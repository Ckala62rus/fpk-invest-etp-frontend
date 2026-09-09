import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import authApi from '@/api/modules/auth';
import { ADMIN_ROLES, ROLES } from '@/constants/roles';

/**
 * Имена actions/getters в стиле констант Vuex из reference-проекта
 * (`mutationTypes` / `actionTypes`), чтобы вызовы были единообразными.
 */
export const authActionTypes = Object.freeze({
    login: 'auth/login',
    register: 'auth/register',
    me: 'auth/me',
    logout: 'auth/logout',
    bootstrap: 'auth/bootstrap',
});

/**
 * Pinia-хранилище авторизации ЭТП (аналог `store/modules/auth.js` на Vuex).
 *
 * Composition API style (`setup` store): состояние + действия в одном месте.
 * Сессия — cookie Sanctum; после login вызываем `me()`, чтобы получить user + roles.
 */
export const useAuthStore = defineStore('auth', () => {
    /** @type {import('vue').Ref<Record<string, unknown>|null>} */
    const user = ref(null);

    /** Идёт ли сейчас login/register */
    const isSubmitting = ref(false);

    /** Пользователь считается авторизованным (есть успешный /auth/me) */
    const isAuth = ref(false);

    /** Сообщения об ошибках форм auth (массив строк или объект Laravel errors) */
    const authError = ref(/** @type {unknown} */ ([]));

    /** Уже пытались подтянуть сессию при старте приложения */
    const bootstrapped = ref(false);

    /**
     * Список slug ролей текущего пользователя.
     * @type {import('vue').ComputedRef<string[]>}
     */
    const roles = computed(() => {
        const raw = user.value?.roles;
        return Array.isArray(raw) ? raw.map(String) : [];
    });

    /**
     * Есть ли у пользователя хотя бы одна из переданных ролей.
     *
     * @param {string|string[]} needed Роль или список ролей
     * @returns {boolean}
     */
    function hasRole(needed) {
        const list = Array.isArray(needed) ? needed : [needed];
        return list.some((role) => roles.value.includes(role));
    }

    /** Доступ в админ-зону */
    const isAdminArea = computed(() => hasRole([...ADMIN_ROLES]));

    /** Участник торгов */
    const isParticipant = computed(() => hasRole(ROLES.PARTICIPANT));

    /**
     * Нормализует ошибки Laravel `{ message, errors }` в удобный вид для UI.
     * Пустой `errors: []` игнорируем — берём `message` ( DomainException с 403 ).
     *
     * @param {unknown} error Ошибка axios или произвольная
     * @returns {unknown}
     */
    function extractError(error) {
        const data = error?.response?.data;
        const errors = data?.errors;

        if (
            errors
            && typeof errors === 'object'
            && !Array.isArray(errors)
            && Object.keys(errors).length > 0
        ) {
            return errors;
        }

        if (Array.isArray(errors) && errors.length > 0) {
            return errors;
        }

        if (data?.message) {
            return [data.message];
        }

        return [error?.message || 'Неизвестная ошибка'];
    }

    /**
     * Первое текстовое сообщение из authError (для ElMessage на формах входа).
     *
     * @returns {string}
     */
    function firstAuthErrorMessage() {
        const raw = authError.value;
        if (Array.isArray(raw) && raw.length > 0) {
            return String(raw[0]);
        }
        if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
            const first = Object.values(raw).flat()[0];
            if (first) {
                return String(first);
            }
        }
        return 'Не удалось выполнить запрос';
    }

    /**
     * Вход по ИНН и паролю, затем загрузка профиля.
     *
     * @param {{ inn: string, password: string }} credentials Учётные данные
     * @returns {Promise<{ ok: boolean, message?: string }>} Результат и текст ошибки с API
     */
    async function login(credentials) {
        isSubmitting.value = true;
        authError.value = [];
        try {
            await authApi.login(credentials);
            await me();
            return { ok: true };
        } catch (error) {
            // Сразу из ответа axios — не через пустой errors: []
            const apiMessage = error?.response?.data?.message;
            authError.value = extractError(error);
            isAuth.value = false;
            user.value = null;
            return {
                ok: false,
                message: (typeof apiMessage === 'string' && apiMessage.trim() !== '')
                    ? apiMessage
                    : firstAuthErrorMessage(),
            };
        } finally {
            isSubmitting.value = false;
        }
    }

    /**
     * Регистрация участника (без автоматического входа — ждём email).
     *
     * @param {Record<string, unknown>} payload Поля регистрации
     * @returns {Promise<{ ok: boolean, data?: unknown }>}
     */
    async function register(payload) {
        isSubmitting.value = true;
        authError.value = [];
        try {
            const response = await authApi.register(payload);
            return { ok: true, data: response.data };
        } catch (error) {
            authError.value = extractError(error);
            return { ok: false };
        } finally {
            isSubmitting.value = false;
        }
    }

    /**
     * Загрузить текущего пользователя из `/api/auth/me`.
     *
     * @returns {Promise<boolean>} true если сессия валидна
     */
    async function me() {
        try {
            const response = await authApi.me();
            // Конверт бэка: { success, message, data: UserResource }
            user.value = response.data?.data ?? null;
            isAuth.value = Boolean(user.value);
            return isAuth.value;
        } catch {
            user.value = null;
            isAuth.value = false;
            return false;
        }
    }

    /**
     * Выход из системы и сброс локального состояния.
     *
     * @returns {Promise<void>}
     */
    async function logout() {
        try {
            await authApi.logout();
        } catch {
            // Сессию всё равно сбрасываем локально
        } finally {
            user.value = null;
            isAuth.value = false;
            authError.value = [];
        }
    }

    /**
     * Однократная попытка восстановить сессию при старте SPA.
     *
     * @returns {Promise<void>}
     */
    async function bootstrap() {
        if (bootstrapped.value) {
            return;
        }
        await me();
        bootstrapped.value = true;
    }

    return {
        user,
        isSubmitting,
        isAuth,
        authError,
        bootstrapped,
        roles,
        isAdminArea,
        isParticipant,
        hasRole,
        login,
        register,
        me,
        logout,
        bootstrap,
        firstAuthErrorMessage,
    };
});
