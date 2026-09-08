import apiClient, { fetchCsrfCookie } from '@/api/axios';
import urls from '@/api/urls';

/**
 * Админский API журнала аудита.
 */

/**
 * @param {Record<string, unknown>} [params] Фильтры
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const list = (params = {}) => apiClient.get(urls.adminActivityLogs, { params });

/**
 * @param {number|string} id ID записи
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const show = (id) => apiClient.get(urls.adminActivityLog(id));

/**
 * Скачивание CSV (blob).
 * @param {Record<string, unknown>} [params] Те же фильтры, что у списка
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const exportCsv = async (params = {}) => {
    await fetchCsrfCookie();
    return apiClient.get(urls.adminActivityLogsExport, {
        params,
        responseType: 'blob',
    });
};

export default {
    list,
    show,
    exportCsv,
};
