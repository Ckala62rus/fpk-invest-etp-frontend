import apiClient, { fetchCsrfCookie } from '@/api/axios';
import urls from '@/api/urls';

/**
 * API-модуль аукциона для участника (лоты, свои ставки, presence HTTP).
 */

/**
 * Лоты процедуры без winner и чужих ставок.
 * @param {number|string} procedureId ID ТЗП
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const listLots = (procedureId) => apiClient.get(urls.procedureLots(procedureId));

/**
 * Только свои ставки по лоту.
 * @param {number|string} procedureId ID ТЗП
 * @param {number|string} lotId ID лота
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const listMyBids = (procedureId, lotId) => apiClient.get(urls.lotBids(procedureId, lotId));

/**
 * Подать ставку.
 * @param {number|string} procedureId ID ТЗП
 * @param {number|string} lotId ID лота
 * @param {{ amount: number|string }} payload Сумма
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const placeBid = async (procedureId, lotId, payload) => {
    await fetchCsrfCookie();
    return apiClient.post(urls.lotBids(procedureId, lotId), payload);
};

/**
 * Heartbeat «я на странице аукциона».
 * @param {number|string} procedureId ID ТЗП
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const heartbeat = async (procedureId) => {
    await fetchCsrfCookie();
    return apiClient.post(urls.auctionHeartbeat(procedureId));
};

/**
 * Leave «ушёл со страницы».
 * @param {number|string} procedureId ID ТЗП
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const leave = async (procedureId) => {
    await fetchCsrfCookie();
    return apiClient.post(urls.auctionLeave(procedureId));
};

export default {
    listLots,
    listMyBids,
    placeBid,
    heartbeat,
    leave,
};
