import apiClient, { fetchCsrfCookie } from '@/api/axios';
import urls from '@/api/urls';

/**
 * Админский API CMS-страниц (только super_admin).
 */

const list = (params = {}) => apiClient.get(urls.adminCmsPages, { params });

/**
 * @param {number|string} id ID страницы
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const show = (id) => apiClient.get(urls.adminCmsPage(id));

/**
 * @param {Record<string, unknown>} payload StoreCmsPageRequest
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const create = async (payload) => {
    await fetchCsrfCookie();
    return apiClient.post(urls.adminCmsPages, payload);
};

/**
 * @param {number|string} id ID
 * @param {Record<string, unknown>} payload UpdateCmsPageRequest
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const update = async (id, payload) => {
    await fetchCsrfCookie();
    return apiClient.put(urls.adminCmsPage(id), payload);
};

/**
 * @param {number|string} id ID
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const destroy = async (id) => {
    await fetchCsrfCookie();
    return apiClient.delete(urls.adminCmsPage(id));
};

export default {
    list,
    show,
    create,
    update,
    destroy,
};
