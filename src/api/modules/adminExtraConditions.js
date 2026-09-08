import apiClient, { fetchCsrfCookie } from '@/api/axios';
import urls from '@/api/urls';

/**
 * API доп. условий ТЗП и справочника шаблонов.
 */

const listTemplates = () => apiClient.get(urls.adminExtraConditionTemplates);

/**
 * @param {Record<string, unknown>} payload StoreExtraConditionTemplateRequest
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const createTemplate = async (payload) => {
    await fetchCsrfCookie();
    return apiClient.post(urls.adminExtraConditionTemplates, payload);
};

/**
 * @param {number|string} id ID шаблона
 * @param {Record<string, unknown>} payload Поля
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const updateTemplate = async (id, payload) => {
    await fetchCsrfCookie();
    return apiClient.put(urls.adminExtraConditionTemplate(id), payload);
};

/**
 * @param {number|string} id ID шаблона
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const deleteTemplate = async (id) => {
    await fetchCsrfCookie();
    return apiClient.delete(urls.adminExtraConditionTemplate(id));
};

const listProcedureConditions = (procedureId) => apiClient.get(
    urls.adminProcedureExtraConditions(procedureId),
);

/**
 * @param {number|string} procedureId ID ТЗП
 * @param {{ conditions: Array<{ template_id: number, value?: string|null }> }} payload Sync
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const syncProcedureConditions = async (procedureId, payload) => {
    await fetchCsrfCookie();
    return apiClient.put(urls.adminProcedureExtraConditions(procedureId), payload);
};

export default {
    listTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    listProcedureConditions,
    syncProcedureConditions,
};
