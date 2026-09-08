import apiClient, { fetchCsrfCookie } from '@/api/axios';
import urls from '@/api/urls';

/**
 * Вопросы опроса качества (super_admin).
 */
const list = () => apiClient.get(urls.adminEvaluationSurveyTemplates);

/**
 * @param {Record<string, unknown>} payload StoreEvaluationSurveyTemplateRequest
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const create = async (payload) => {
    await fetchCsrfCookie();
    return apiClient.post(urls.adminEvaluationSurveyTemplates, payload);
};

/**
 * @param {number|string} id ID
 * @param {Record<string, unknown>} payload Поля
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const update = async (id, payload) => {
    await fetchCsrfCookie();
    return apiClient.put(urls.adminEvaluationSurveyTemplate(id), payload);
};

/**
 * @param {number|string} id ID
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const destroy = async (id) => {
    await fetchCsrfCookie();
    return apiClient.delete(urls.adminEvaluationSurveyTemplate(id));
};

export default { list, create, update, destroy };
