import axios from 'axios';
import { getCookie } from '@/helpers/cookies';

/**
 * Единый HTTP-клиент ЭТП.
 *
 * Паттерн как в reference `api/axios.js`, но auth — Laravel Sanctum (cookie SPA),
 * а не Bearer JWT: withCredentials + CSRF cookie/заголовок.
 *
 * baseURL:
 * - пустой / относительный `/api` — через Vite proxy на бэк (dev);
 * - абсолютный URL из VITE_API_BASE_URL — прямой вызов API (prod / другой origin).
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

apiClient.interceptors.request.use(attachCsrfHeader);
rootClient.interceptors.request.use(attachCsrfHeader);

/**
 * Общая обработка ошибок ответов (401 → на логин, кроме гостевых страниц).
 *
 * @param {import('axios').AxiosError} error Ошибка axios
 * @returns {Promise<never>}
 */
function handleResponseError(error) {
    const status = error.response?.status;
    const path = window.location.pathname;

    // Гостевые маршруты, где 401 — нормальный ответ (форма входа и т.п.)
    const guestPaths = ['/login', '/register', '/password-forgot', '/password-reset'];

    if (status === 401 && !guestPaths.some((p) => path.startsWith(p))) {
        // Не делаем полный reload здесь — router/guard и Pinia разрулят сессию
        // Редирект выполняет вызывающий код или navigation guard
    }

    return Promise.reject(error);
}

apiClient.interceptors.response.use((response) => response, handleResponseError);
rootClient.interceptors.response.use((response) => response, handleResponseError);

/**
 * Запрашивает CSRF cookie у Laravel Sanctum.
 * Вызывать перед login / register / любым POST без сессии.
 *
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export function fetchCsrfCookie() {
    return rootClient.get('/sanctum/csrf-cookie');
}

export { rootClient };
export default apiClient;
