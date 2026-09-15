import apiClient from '@/api/axios';
import urls from '@/api/urls';

/**
 * Публичный логотип шапки (имя модуля без «branding» — adblock блокирует такой URL).
 */

/**
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const show = () => apiClient.get(urls.siteLogo);

export default { show };
