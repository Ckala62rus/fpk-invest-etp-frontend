import apiClient, { fetchCsrfCookie } from '@/api/axios';
import urls from '@/api/urls';

/**
 * API-модуль классификатора и заказчиков (super_admin).
 */

const listCompanyGroups = (params = {}) => apiClient.get(urls.adminCompanyGroups, { params });

/**
 * @param {Record<string, unknown>} payload name, sort_order, is_active
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const createCompanyGroup = async (payload) => {
    await fetchCsrfCookie();
    return apiClient.post(urls.adminCompanyGroups, payload);
};

/**
 * @param {number|string} id ID группы
 * @param {Record<string, unknown>} payload Поля
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const updateCompanyGroup = async (id, payload) => {
    await fetchCsrfCookie();
    return apiClient.put(urls.adminCompanyGroup(id), payload);
};

/**
 * @param {number|string} id ID группы
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const deleteCompanyGroup = async (id) => {
    await fetchCsrfCookie();
    return apiClient.delete(urls.adminCompanyGroup(id));
};

const listCategories = (params = {}) => apiClient.get(urls.adminClassifierCategories, { params });

/**
 * @param {Record<string, unknown>} payload company_group_id, name, …
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const createCategory = async (payload) => {
    await fetchCsrfCookie();
    return apiClient.post(urls.adminClassifierCategories, payload);
};

/**
 * @param {number|string} id ID категории
 * @param {Record<string, unknown>} payload Поля
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const updateCategory = async (id, payload) => {
    await fetchCsrfCookie();
    return apiClient.put(urls.adminClassifierCategory(id), payload);
};

/**
 * @param {number|string} id ID категории
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const deleteCategory = async (id) => {
    await fetchCsrfCookie();
    return apiClient.delete(urls.adminClassifierCategory(id));
};

const listCompanies = (params = {}) => apiClient.get(urls.adminCompanies, { params });

/**
 * @param {Record<string, unknown>} payload company_group_id, name, inn, …
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const createCompany = async (payload) => {
    await fetchCsrfCookie();
    return apiClient.post(urls.adminCompanies, payload);
};

/**
 * @param {number|string} id ID компании
 * @param {Record<string, unknown>} payload Поля
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const updateCompany = async (id, payload) => {
    await fetchCsrfCookie();
    return apiClient.put(urls.adminCompany(id), payload);
};

/**
 * @param {number|string} id ID компании
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const deleteCompany = async (id) => {
    await fetchCsrfCookie();
    return apiClient.delete(urls.adminCompany(id));
};

export default {
    listCompanyGroups,
    createCompanyGroup,
    updateCompanyGroup,
    deleteCompanyGroup,
    listCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    listCompanies,
    createCompany,
    updateCompany,
    deleteCompany,
};
