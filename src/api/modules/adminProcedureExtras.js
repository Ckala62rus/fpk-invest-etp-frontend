import apiClient, { fetchCsrfCookie } from '@/api/axios';
import urls from '@/api/urls';

/**
 * CRUD лотов процедуры + change-logs согласования.
 */

const listLots = (procedureId) => apiClient.get(urls.adminProcedureLots(procedureId));

/**
 * @param {number|string} procedureId ID ТЗП
 * @param {Record<string, unknown>} payload StoreProcedureLotRequest
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const createLot = async (procedureId, payload) => {
    await fetchCsrfCookie();
    return apiClient.post(urls.adminProcedureLots(procedureId), payload);
};

/**
 * @param {number|string} procedureId ID ТЗП
 * @param {number|string} lotId ID лота
 * @param {Record<string, unknown>} payload Поля
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const updateLot = async (procedureId, lotId, payload) => {
    await fetchCsrfCookie();
    return apiClient.put(urls.adminProcedureLot(procedureId, lotId), payload);
};

/**
 * @param {number|string} procedureId ID ТЗП
 * @param {number|string} lotId ID лота
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const deleteLot = async (procedureId, lotId) => {
    await fetchCsrfCookie();
    return apiClient.delete(urls.adminProcedureLot(procedureId, lotId));
};

const listChangeLogs = (procedureId) => apiClient.get(urls.adminChangeLogs(procedureId));

/**
 * @param {number|string} procedureId ID ТЗП
 * @param {number|string} changeLogId ID записи
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const approveChange = async (procedureId, changeLogId) => {
    await fetchCsrfCookie();
    return apiClient.post(urls.adminChangeLogApprove(procedureId, changeLogId));
};

/**
 * @param {number|string} procedureId ID ТЗП
 * @param {number|string} changeLogId ID записи
 * @param {{ reason: string }} payload Причина
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const rejectChange = async (procedureId, changeLogId, payload) => {
    await fetchCsrfCookie();
    return apiClient.post(urls.adminChangeLogReject(procedureId, changeLogId), payload);
};

const listCustomFields = (procedureId) => apiClient.get(urls.adminCustomFields(procedureId));

/**
 * @param {number|string} procedureId ID ТЗП
 * @param {Record<string, unknown>} payload StoreProcedureCustomFieldRequest
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const createCustomField = async (procedureId, payload) => {
    await fetchCsrfCookie();
    return apiClient.post(urls.adminCustomFields(procedureId), payload);
};

/**
 * @param {number|string} procedureId ID ТЗП
 * @param {number|string} fieldId ID поля
 * @param {Record<string, unknown>} payload Поля
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const updateCustomField = async (procedureId, fieldId, payload) => {
    await fetchCsrfCookie();
    return apiClient.put(urls.adminCustomField(procedureId, fieldId), payload);
};

/**
 * @param {number|string} procedureId ID ТЗП
 * @param {number|string} fieldId ID поля
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const deleteCustomField = async (procedureId, fieldId) => {
    await fetchCsrfCookie();
    return apiClient.delete(urls.adminCustomField(procedureId, fieldId));
};

/**
 * @param {number|string} procedureId ID ТЗП
 * @param {{ emails: string[] }} payload Список email
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const sendExternalInvites = async (procedureId, payload) => {
    await fetchCsrfCookie();
    return apiClient.post(urls.adminExternalInvites(procedureId), payload);
};

export default {
    listLots,
    createLot,
    updateLot,
    deleteLot,
    listChangeLogs,
    approveChange,
    rejectChange,
    listCustomFields,
    createCustomField,
    updateCustomField,
    deleteCustomField,
    sendExternalInvites,
};
