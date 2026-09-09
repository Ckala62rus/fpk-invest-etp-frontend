import apiClient, { fetchCsrfCookie } from '@/api/axios';
import urls from '@/api/urls';

/**
 * API-модуль КП (коммерческих предложений) участника.
 */

/**
 * Подать КП по процедуре.
 * @param {number|string} procedureId ID ТЗП
 * @param {Record<string, unknown>} payload SubmitProposalRequest
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const submit = async (procedureId, payload) => {
    await fetchCsrfCookie();
    return apiClient.post(urls.submitProposal(procedureId), payload);
};

/**
 * Список своих КП.
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const index = () => apiClient.get(urls.myProposals);

/**
 * Карточка своего КП.
 * @param {number|string} id ID заявки
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const show = (id) => apiClient.get(urls.proposal(id));

/**
 * Список документов КП.
 * @param {number|string} proposalId ID КП
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const listDocuments = (proposalId) => apiClient.get(urls.proposalDocuments(proposalId));

/**
 * Загрузить документ к КП.
 * @param {number|string} proposalId ID КП
 * @param {File} file Файл
 * @param {string} [type] Тип документа
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const uploadDocument = async (proposalId, file, type) => {
    await fetchCsrfCookie();
    const formData = new FormData();
    formData.append('document', file);
    if (type) {
        formData.append('type', type);
    }
    return apiClient.post(urls.proposalDocuments(proposalId), formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};

/**
 * Удалить документ КП.
 * @param {number|string} proposalId ID КП
 * @param {number|string} documentId ID документа
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const deleteDocument = async (proposalId, documentId) => {
    await fetchCsrfCookie();
    return apiClient.delete(urls.proposalDocument(proposalId, documentId));
};

/**
 * Скачать / открыть документ КП (blob).
 * @param {number|string} proposalId ID КП
 * @param {number|string} documentId ID файла
 * @param {{ inline?: boolean }} [options] inline — просмотр PDF
 * @returns {Promise<import('axios').AxiosResponse<Blob>>}
 */
const downloadDocument = (proposalId, documentId, options = {}) => apiClient.get(
    urls.proposalDocumentDownload(proposalId, documentId),
    {
        responseType: 'blob',
        params: options.inline ? { inline: 1 } : undefined,
        skipGlobalLoader: true,
    },
);

/**
 * Переписка по КП.
 * @param {number|string} proposalId ID КП
 * @param {Record<string, unknown>} [config] Axios config
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const listMessages = (proposalId, config = {}) => apiClient.get(urls.proposalMessages(proposalId), config);

/**
 * Отправить сообщение в переписке.
 * @param {number|string} proposalId ID КП
 * @param {{ message: string }} payload Текст
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const sendMessage = async (proposalId, payload) => {
    await fetchCsrfCookie();
    return apiClient.post(urls.proposalMessages(proposalId), payload);
};

export default {
    submit,
    index,
    show,
    listDocuments,
    uploadDocument,
    deleteDocument,
    downloadDocument,
    listMessages,
    sendMessage,
};
