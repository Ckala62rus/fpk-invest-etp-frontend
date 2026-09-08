/**
 * Вспомогательные функции для работы с localStorage.
 *
 * Нужны для безопасного хранения несекретных настроек UI.
 * Сессия ЭТП — cookie Laravel Sanctum, токен в localStorage не кладём.
 */

/**
 * Сохранить значение в localStorage (JSON).
 *
 * @param {string} key Ключ
 * @param {unknown} value Значение (будет JSON.stringify)
 * @returns {void}
 */
export const setItem = (key, value) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.error('Ошибка при сохранении в localStorage', e);
    }
};

/**
 * Получить значение из localStorage.
 *
 * @param {string} key Ключ
 * @returns {unknown|null} Распарсенное значение или null
 */
export const getItem = (key) => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (e) {
        console.error('Ошибка при чтении из localStorage', e);
        return null;
    }
};

/**
 * Удалить значение из localStorage.
 *
 * @param {string} key Ключ
 * @returns {void}
 */
export const removeItem = (key) => {
    try {
        localStorage.removeItem(key);
    } catch (e) {
        console.error('Ошибка при удалении из localStorage', e);
    }
};

/**
 * Очистить весь localStorage текущего origin.
 *
 * @returns {void}
 */
export const clear = () => {
    try {
        localStorage.clear();
    } catch (e) {
        console.error('Ошибка при очистке localStorage', e);
    }
};
