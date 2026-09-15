import apiClient, { fetchCsrfCookie } from '@/api/axios';
import urls from '@/api/urls';

/**
 * Документация ТЗП (ТЗ, конкурсные файлы) — админский CRUD.
 */

/**
 * @param {number|string} procedureId ID ТЗП
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const list = (procedureId) => apiClient.get(urls.adminProcedureDocuments(procedureId));

/**
 * @param {number|string} procedureId ID ТЗП
 * @param {File} file Файл
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const upload = async (procedureId, file) => {
    await fetchCsrfCookie();
    const body = new FormData();
    body.append('document', file);
    return apiClient.post(urls.adminProcedureDocuments(procedureId), body);
};

/**
 * @param {number|string} procedureId ID ТЗП
 * @param {number|string} documentId ID документа
 * @param {{ inline?: boolean }} [options]
 * @returns {Promise<import('axios').AxiosResponse<Blob>>}
 */
const download = (procedureId, documentId, options = {}) => apiClient.get(
    urls.adminProcedureDocumentDownload(procedureId, documentId),
    {
        responseType: 'blob',
        params: options.inline ? { inline: 1 } : undefined,
    },
);

/**
 * @param {number|string} procedureId ID ТЗП
 * @param {number|string} documentId ID документа
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const destroy = async (procedureId, documentId) => {
    await fetchCsrfCookie();
    return apiClient.delete(urls.adminProcedureDocument(procedureId, documentId));
};

export default { list, upload, download, destroy };
