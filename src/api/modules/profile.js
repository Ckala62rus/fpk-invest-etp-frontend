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

export default {
    show,
    update,
    uploadDocument,
};
