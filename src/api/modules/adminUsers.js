import apiClient, { fetchCsrfCookie } from '@/api/axios';
import urls from '@/api/urls';

/**
 * API-модуль админки: пользователи (модерация, блок, роли).
 */

/**
 * Список пользователей с фильтрами.
 * @param {Record<string, unknown>} [params] status, search, role, page, per_page
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const list = (params = {}) => apiClient.get(urls.adminUsers, { params });

/**
 * Одобрить регистрацию участника.
 * @param {number|string} userId ID пользователя
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const approve = async (userId) => {
    await fetchCsrfCookie();
    return apiClient.post(urls.adminUserApprove(userId));
};

/**
 * Заблокировать пользователя.
 * @param {number|string} userId ID
 * @param {{ reason: string, blocked_until?: string|null }} payload Причина
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const block = async (userId, payload) => {
    await fetchCsrfCookie();
    return apiClient.post(urls.adminUserBlock(userId), payload);
};

/**
 * Разблокировать пользователя.
 * @param {number|string} userId ID
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const unblock = async (userId) => {
    await fetchCsrfCookie();
    return apiClient.post(urls.adminUserUnblock(userId));
};

/**
 * Назначить роли (только super_admin).
 * @param {number|string} userId ID
 * @param {string[]} roles Список slug ролей
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const assignRoles = async (userId, roles) => {
    await fetchCsrfCookie();
    return apiClient.put(urls.adminUserRoles(userId), { roles });
};

export default {
    list,
    approve,
    block,
    unblock,
    assignRoles,
};
