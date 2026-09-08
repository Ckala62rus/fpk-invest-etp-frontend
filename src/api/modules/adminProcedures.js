import apiClient, { fetchCsrfCookie } from '@/api/axios';
import urls from '@/api/urls';

/**
 * API-модуль админского CRUD ТЗП (торгово-закупочных процедур).
 */

/**
 * @param {Record<string, unknown>} [params] Фильтры списка
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const list = (params = {}) => apiClient.get(urls.adminProcedures, { params });

/**
 * @param {number|string} id ID процедуры
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const show = (id) => apiClient.get(urls.adminProcedure(id));

/**
 * @param {Record<string, unknown>} payload StoreProcedureRequest
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const create = async (payload) => {
    await fetchCsrfCookie();
    return apiClient.post(urls.adminProcedures, payload);
};

/**
 * @param {number|string} id ID
 * @param {Record<string, unknown>} payload UpdateProcedureRequest
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const update = async (id, payload) => {
    await fetchCsrfCookie();
    return apiClient.put(urls.adminProcedure(id), payload);
};

/**
 * @param {number|string} id ID
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const publish = async (id) => {
    await fetchCsrfCookie();
    return apiClient.post(urls.adminProcedurePublish(id));
};

/**
 * @param {number|string} id ID
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const destroy = async (id) => {
    await fetchCsrfCookie();
    return apiClient.delete(urls.adminProcedure(id));
};

/**
 * @param {number|string} id ID
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const restore = async (id) => {
    await fetchCsrfCookie();
    return apiClient.post(urls.adminProcedureRestore(id));
};

export default {
    list,
    show,
    create,
    update,
    publish,
    destroy,
    restore,
};
