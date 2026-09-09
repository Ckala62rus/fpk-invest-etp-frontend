import apiClient, { fetchCsrfCookie } from '@/api/axios';
import urls from '@/api/urls';

/**
 * API-модуль аукциона для участника (лоты, свои ставки, presence HTTP).
 */

/**
 * Список аукционов участника в кабинете (ставки / приглашение / победа).
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const listMyAuctions = () => apiClient.get(urls.myAuctions);

/**
 * Лоты процедуры без чужих ставок; свой выигрыш — i_am_winner.
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
const listMyBids = (procedureId, lotId) => apiClient.get(urls.lotBids(procedureId, lotId), {
    skipGlobalLoader: true,
});

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
 * Heartbeat «я на странице аукциона» (без глобального спиннера — опрос каждые ~30 с).
 * @param {number|string} procedureId ID ТЗП
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const heartbeat = async (procedureId) => {
    await fetchCsrfCookie();
    return apiClient.post(urls.auctionHeartbeat(procedureId), null, {
        skipGlobalLoader: true,
    });
};

/**
 * Leave «ушёл со страницы» (без глобального спиннера).
 * @param {number|string} procedureId ID ТЗП
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const leave = async (procedureId) => {
    await fetchCsrfCookie();
    return apiClient.post(urls.auctionLeave(procedureId), null, {
        skipGlobalLoader: true,
    });
};

export default {
    listMyAuctions,
    listLots,
    listMyBids,
    placeBid,
    heartbeat,
    leave,
};
