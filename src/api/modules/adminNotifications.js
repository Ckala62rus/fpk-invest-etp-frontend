import apiClient, { fetchCsrfCookie } from '@/api/axios';
import urls from '@/api/urls';

/**
 * Шаблоны email-уведомлений (super_admin).
 */
const list = () => apiClient.get(urls.adminNotificationTemplates);

/**
 * @param {Record<string, unknown>} payload StoreNotificationTemplateRequest
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const create = async (payload) => {
    await fetchCsrfCookie();
    return apiClient.post(urls.adminNotificationTemplates, payload);
};

/**
 * @param {number|string} id ID
 * @param {Record<string, unknown>} payload Поля
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const update = async (id, payload) => {
    await fetchCsrfCookie();
    return apiClient.put(urls.adminNotificationTemplate(id), payload);
};

/**
 * @param {number|string} id ID
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const destroy = async (id) => {
    await fetchCsrfCookie();
    return apiClient.delete(urls.adminNotificationTemplate(id));
};

export default { list, create, update, destroy };
