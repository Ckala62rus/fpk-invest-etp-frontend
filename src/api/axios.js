import axios from 'axios';
import { getCookie } from '@/helpers/cookies';
import { useUiStore } from '@/stores/ui';

/**
 * Единый HTTP-клиент ЭТП.
 *
 * Паттерн как в reference `api/axios.js`, но auth — Laravel Sanctum (cookie SPA),
 * а не Bearer JWT: withCredentials + CSRF cookie/заголовок.
 *
 * baseURL:
 * - пустой / относительный `/api` — через Vite proxy на бэк (dev);
 * - абсолютный URL из VITE_API_BASE_URL — прямой вызов API (prod / другой origin).
 *
 * Глобальный спиннер: по умолчанию включён для apiClient.
 * Отключить: `apiClient.get(url, { skipGlobalLoader: true })`.
 */

const env = import.meta.env;

/** База REST: либо явный VITE_API_BASE_URL, либо `/api` за proxy */
const apiBase = (env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

/**
 * Клиент для маршрутов под `/api/*`.
 */
const apiClient = axios.create({
    baseURL: apiBase,
    withCredentials: true,
    headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
});

/**
 * Клиент без `/api` — для `GET /sanctum/csrf-cookie` (тот же origin через proxy).
 */
const rootClient = axios.create({
    baseURL: '',
    withCredentials: true,
    headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
});

/**
 * Перед каждым запросом к API подставляет CSRF из cookie XSRF-TOKEN.
 *
 * @param {import('axios').InternalAxiosRequestConfig} config Конфиг axios
 * @returns {import('axios').InternalAxiosRequestConfig}
 */
function attachCsrfHeader(config) {
    const xsrf = getCookie('XSRF-TOKEN');
    if (xsrf) {
        config.headers['X-XSRF-TOKEN'] = xsrf;
    }
    return config;
}

/**
 * Включает глобальный спиннер, если не skipGlobalLoader.
 *
 * @param {import('axios').InternalAxiosRequestConfig} config Конфиг
 * @returns {import('axios').InternalAxiosRequestConfig}
 */
function beginGlobalLoader(config) {
    if (!config.skipGlobalLoader) {
        try {
            useUiStore().beginRequest();
            config.__etpLoaderStarted = true;
        } catch {
            // Pinia ещё не готова на самом раннем старте
        }
    }
    return config;
}

/**
 * Снимает глобальный спиннер.
 *
 * @param {import('axios').AxiosResponse|import('axios').AxiosError} responseOrError Ответ/ошибка
 * @returns {import('axios').AxiosResponse|Promise<never>}
 */
function endGlobalLoader(responseOrError) {
    const config = responseOrError?.config || responseOrError?.response?.config;
    if (config?.__etpLoaderStarted) {
        try {
            useUiStore().endRequest();
        } catch {
            // ignore
        }
    }
    return responseOrError;
}

apiClient.interceptors.request.use((config) => beginGlobalLoader(attachCsrfHeader(config)));
rootClient.interceptors.request.use(attachCsrfHeader);

/**
 * Общая обработка ошибок ответов (401 → на логин, кроме гостевых страниц).
 *
 * @param {import('axios').AxiosError} error Ошибка axios
 * @returns {Promise<never>}
 */
function handleResponseError(error) {
    endGlobalLoader(error);
    const status = error.response?.status;
    const path = window.location.pathname;

    const guestPaths = ['/login', '/register', '/password-forgot', '/password-reset'];

    if (status === 401 && !guestPaths.some((p) => path.startsWith(p))) {
        // router/guard разрулят сессию
    }

    return Promise.reject(error);
}

apiClient.interceptors.response.use(
    (response) => endGlobalLoader(response),
    handleResponseError,
);
rootClient.interceptors.response.use((response) => response, handleResponseError);

/**
 * Запрашивает CSRF cookie у Laravel Sanctum.
 *
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export function fetchCsrfCookie() {
    return rootClient.get('/sanctum/csrf-cookie');
}

export { rootClient };
export default apiClient;
