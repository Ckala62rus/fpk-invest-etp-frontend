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

export default {
    listLots,
    createLot,
    updateLot,
    deleteLot,
    listChangeLogs,
    approveChange,
    rejectChange,
};
