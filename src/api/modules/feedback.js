import apiClient, { fetchCsrfCookie } from '@/api/axios';
import urls from '@/api/urls';

/**
 * API-модуль жалоб и сообщений о коррупции (публичные POST + throttle на бэке).
 */

/**
 * Отправить жалобу с сайта.
 *
 * @param {{ name?: string, email?: string, subject: string, message: string }} payload Поля формы
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const submitComplaint = async (payload) => {
    await fetchCsrfCookie();
    return apiClient.post(urls.complaints, payload);
};

/**
 * Отправить сообщение о коррупции.
 *
 * @param {{ name?: string, email?: string, message: string }} payload Поля формы
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const submitCorruptionReport = async (payload) => {
    await fetchCsrfCookie();
    return apiClient.post(urls.corruptionReports, payload);
};

export default {
    submitComplaint,
    submitCorruptionReport,
};
