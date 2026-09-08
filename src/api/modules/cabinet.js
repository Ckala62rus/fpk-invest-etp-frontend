import apiClient, { fetchCsrfCookie } from '@/api/axios';
import urls from '@/api/urls';

/**
 * API-модуль подписок и настроек email-уведомлений.
 */

/**
 * Текущие подписки на категории и группы компаний.
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const getSubscriptions = () => apiClient.get(urls.subscriptions);

/**
 * Полная замена переданных списков подписок.
 * @param {{ category_ids?: number[], company_group_ids?: number[] }} payload ID
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const updateSubscriptions = async (payload) => {
    await fetchCsrfCookie();
    return apiClient.put(urls.subscriptions, payload);
};

/**
 * Настройки email-оповещений.
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const getNotificationSettings = () => apiClient.get(urls.notificationSettings);

/**
 * Обновить флаги оповещений.
 * @param {Record<string, boolean>} payload Флаги UpdateNotificationSettingsRequest
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const updateNotificationSettings = async (payload) => {
    await fetchCsrfCookie();
    return apiClient.put(urls.notificationSettings, payload);
};

export default {
    getSubscriptions,
    updateSubscriptions,
    getNotificationSettings,
    updateNotificationSettings,
};
