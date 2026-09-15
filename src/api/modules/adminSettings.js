import apiClient, { fetchCsrfCookie } from '@/api/axios';
import urls from '@/api/urls';

/**
 * API-модуль: логотип площадки (super_admin).
 */

/**
 * @param {File} file Изображение логотипа (поле logo)
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const uploadLogo = async (file) => {
    await fetchCsrfCookie();

    const body = new FormData();
    body.append('logo', file);

    return apiClient.post(urls.adminSettingsLogo, body);
};

/**
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const deleteLogo = async () => {
    await fetchCsrfCookie();

    return apiClient.delete(urls.adminSettingsLogo);
};

export default { uploadLogo, deleteLogo };
