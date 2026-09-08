import apiClient, { fetchCsrfCookie } from '@/api/axios';
import urls from '@/api/urls';

/**
 * Админский API аукциона: настройки, lifecycle, ставки, presence.
 */

const getSettings = (procedureId) => apiClient.get(urls.adminAuctionSettings(procedureId));

/**
 * @param {number|string} procedureId ID ТЗП
 * @param {Record<string, unknown>} payload Настройки
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const updateSettings = async (procedureId, payload) => {
    await fetchCsrfCookie();
    return apiClient.put(urls.adminAuctionSettings(procedureId), payload);
};

const listLots = (procedureId) => apiClient.get(urls.adminProcedureLots(procedureId));

/**
 * @param {number|string} procedureId ID ТЗП
 * @param {'start'|'pause'|'resume'|'finish'} action Действие lifecycle
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const lifecycle = async (procedureId, action) => {
    await fetchCsrfCookie();
    const map = {
        start: urls.adminAuctionStart,
        pause: urls.adminAuctionPause,
        resume: urls.adminAuctionResume,
        finish: urls.adminAuctionFinish,
    };
    return apiClient.post(map[action](procedureId));
};

const listLotBids = (procedureId, lotId) => apiClient.get(urls.adminLotBids(procedureId, lotId));

/**
 * @param {number|string} procedureId ID ТЗП
 * @param {number|string} bidId ID ставки
 * @param {{ reason: string }} payload Причина
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const cancelBid = async (procedureId, bidId, payload) => {
    await fetchCsrfCookie();
    return apiClient.post(urls.adminCancelBid(procedureId, bidId), payload);
};

const presence = (procedureId) => apiClient.get(urls.adminAuctionPresence(procedureId));

const listProtocols = (procedureId) => apiClient.get(urls.adminAuctionProtocols(procedureId));

/**
 * @param {number|string} procedureId ID ТЗП
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const generateProtocol = async (procedureId) => {
    await fetchCsrfCookie();
    return apiClient.post(urls.adminAuctionProtocols(procedureId));
};

export default {
    getSettings,
    updateSettings,
    listLots,
    lifecycle,
    listLotBids,
    cancelBid,
    presence,
    listProtocols,
    generateProtocol,
};
