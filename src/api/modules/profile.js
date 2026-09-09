import apiClient, { fetchCsrfCookie } from '@/api/axios';
import urls from '@/api/urls';

/**
 * API-модуль профиля участника ЭТП.
 */

/**
 * Получить профиль текущего пользователя.
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const show = () => apiClient.get(urls.profile);

/**
 * Обновить поля профиля.
 * @param {Record<string, unknown>} payload Поля UpdateProfileRequest
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const update = async (payload) => {
    await fetchCsrfCookie();
    return apiClient.put(urls.profile, payload);
};

/**
 * Список документов профиля.
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const listDocuments = () => apiClient.get(urls.profileDocuments);

/**
 * Загрузить документ профиля (multipart).
 * @param {File} file Файл pdf/doc/xls
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const uploadDocument = async (file) => {
    await fetchCsrfCookie();
    const formData = new FormData();
    formData.append('document', file);
    return apiClient.post(urls.profileDocuments, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};

/**
 * Скачать / открыть свой документ профиля.
 *
 * @param {number|string} documentId ID документа
 * @param {{ inline?: boolean }} [options] inline=true — Content-Disposition: inline
 * @returns {Promise<import('axios').AxiosResponse<Blob>>}
 */
const downloadDocument = (documentId, options = {}) => apiClient.get(
    urls.profileDocumentDownload(documentId),
    {
        responseType: 'blob',
        params: options.inline ? { inline: 1 } : undefined,
    },
);

export default {
    show,
    update,
    listDocuments,
    uploadDocument,
    downloadDocument,
};
