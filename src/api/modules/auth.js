import apiClient, { fetchCsrfCookie } from '@/api/axios';
import urls from '@/api/urls';

/**
 * API-модуль авторизации ЭТП (Sanctum SPA).
 *
 * Перед мутирующими запросами без сессии сначала тянем CSRF cookie.
 */

/**
 * Вход по ИНН (идентификационному номеру налогоплательщика) и паролю.
 *
 * @param {{ inn: string, password: string }} credentials Учётные данные
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const login = async (credentials) => {
    await fetchCsrfCookie();
    return apiClient.post(urls.login, credentials);
};

/**
 * Регистрация участника (статус pending_email на бэке).
 *
 * @param {Record<string, unknown>} payload Поля формы регистрации
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const register = async (payload) => {
    await fetchCsrfCookie();
    return apiClient.post(urls.register, payload);
};

/**
 * Текущий пользователь с ролями и профилем (сессия cookie).
 *
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const me = () => {
    return apiClient.get(urls.me);
};

/**
 * Выход: инвалидация сессии на бэке.
 *
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const logout = async () => {
    await fetchCsrfCookie();
    return apiClient.post(urls.logout);
};

/**
 * Запрос письма сброса пароля.
 *
 * @param {{ email: string }} payload Email
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const passwordForgot = async (payload) => {
    await fetchCsrfCookie();
    return apiClient.post(urls.passwordForgot, payload);
};

/**
 * Установка нового пароля по токену из письма.
 * @param {{ token: string, password: string, password_confirmation: string }} payload Данные
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const passwordReset = async (payload) => {
    await fetchCsrfCookie();
    return apiClient.post(urls.passwordReset, payload);
};

/**
 * Обращение к администратору для сброса пароля по ИНН.
 * @param {{ inn: string, message?: string }} payload Данные
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const passwordAdminRequest = async (payload) => {
    await fetchCsrfCookie();
    return apiClient.post(urls.passwordAdminRequest, payload);
};

export default {
    login,
    register,
    me,
    logout,
    passwordForgot,
    passwordReset,
    passwordAdminRequest,
};
