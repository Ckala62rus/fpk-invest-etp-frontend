import apiClient, { fetchCsrfCookie } from '@/api/axios';
import urls from '@/api/urls';

/**
 * Шаблоны и запуски отчётов.
 */
const listTemplates = () => apiClient.get(urls.adminReportTemplates);

/**
 * @param {Record<string, unknown>} payload StoreReportTemplateRequest
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const createTemplate = async (payload) => {
    await fetchCsrfCookie();
    return apiClient.post(urls.adminReportTemplates, payload);
};

/**
 * @param {number|string} id ID
 * @param {Record<string, unknown>} payload Поля
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const updateTemplate = async (id, payload) => {
    await fetchCsrfCookie();
    return apiClient.put(urls.adminReportTemplate(id), payload);
};

/**
 * @param {number|string} id ID
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const deleteTemplate = async (id) => {
    await fetchCsrfCookie();
    return apiClient.delete(urls.adminReportTemplate(id));
};

/**
 * @param {number|string} id ID шаблона
 * @param {{ format: string, filters?: Record<string, unknown> }} payload Запуск
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const run = async (id, payload) => {
    await fetchCsrfCookie();
    return apiClient.post(urls.adminReportTemplateRuns(id), payload);
};

/**
 * @param {number|string} id ID шаблона
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const listRuns = (id) => apiClient.get(urls.adminReportTemplateRuns(id));

/**
 * @param {number|string} runId ID запуска
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const downloadRun = async (runId) => {
    await fetchCsrfCookie();
    return apiClient.get(urls.adminReportRunDownload(runId), { responseType: 'blob' });
};

export default {
    listTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    run,
    listRuns,
    downloadRun,
};
