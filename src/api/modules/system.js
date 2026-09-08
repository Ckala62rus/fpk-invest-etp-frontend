import apiClient from '@/api/axios';
import urls from '@/api/urls';

/**
 * API-модуль служебных публичных endpoint’ов (health, время сервера).
 */

/**
 * Проверка доступности API, БД и Redis.
 *
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const health = () => apiClient.get(urls.health);

/**
 * Серверное время для синхронизации таймеров на клиенте.
 *
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const serverTime = () => apiClient.get(urls.serverTime);

export default {
    health,
    serverTime,
};
