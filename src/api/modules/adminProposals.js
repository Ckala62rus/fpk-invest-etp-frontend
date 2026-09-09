import apiClient, { fetchCsrfCookie } from '@/api/axios';
import urls from '@/api/urls';

/**
 * Админский API КП (коммерческих предложений): список, допуск, переписка.
 */

/**
 * @param {number|string} procedureId ID ТЗП
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const list = (procedureId) => apiClient.get(urls.adminProcedureProposals(procedureId));

/**
 * @param {number|string} procedureId ID ТЗП
 * @param {number|string} proposalId ID КП
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const show = (procedureId, proposalId) => apiClient.get(urls.adminProcedureProposal(procedureId, proposalId));

/**
 * @param {number|string} procedureId ID ТЗП
 * @param {number|string} proposalId ID КП
 * @param {{ decision: string, reason: string, clarification_deadline?: string }} payload Решение
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const admission = async (procedureId, proposalId, payload) => {
    await fetchCsrfCookie();
    return apiClient.post(urls.adminProposalAdmission(procedureId, proposalId), payload);
};

/**
 * @param {number|string} procedureId ID ТЗП
 * @param {number|string} proposalId ID КП
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const listMessages = (procedureId, proposalId, config = {}) => apiClient.get(
    urls.adminProposalMessages(procedureId, proposalId),
    config,
);

/**
 * @param {number|string} procedureId ID ТЗП
 * @param {number|string} proposalId ID КП
 * @param {Record<string, unknown>} payload Текст / уточнение
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const sendMessage = async (procedureId, proposalId, payload) => {
    await fetchCsrfCookie();
    return apiClient.post(urls.adminProposalMessages(procedureId, proposalId), payload);
};

/**
 * Скачать / открыть документ КП (blob). Доступно после дедлайна приёма.
 * @param {number|string} procedureId ID ТЗП
 * @param {number|string} proposalId ID КП
 * @param {number|string} documentId ID файла
 * @param {{ inline?: boolean }} [options] inline — просмотр PDF
 * @returns {Promise<import('axios').AxiosResponse<Blob>>}
 */
const downloadDocument = (procedureId, proposalId, documentId, options = {}) => apiClient.get(
    urls.adminProposalDocumentDownload(procedureId, proposalId, documentId),
    {
        responseType: 'blob',
        params: options.inline ? { inline: 1 } : undefined,
        skipGlobalLoader: true,
    },
);

export default {
    list,
    show,
    admission,
    listMessages,
    sendMessage,
    downloadDocument,
};
