import apiClient from '@/api/axios';
import urls from '@/api/urls';

/**
 * API-модуль публичной витрины ТЗП (торгово-закупочных процедур).
 */

/**
 * Список открытых процедур с фильтрами и пагинацией.
 *
 * @param {Record<string, unknown>} [params] Query: search, type, status, page, per_page, …
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const list = (params = {}) => {
    return apiClient.get(urls.publicProcedures, { params });
};

/**
 * Карточка одной открытой процедуры (без контактов заказчика).
 *
 * @param {number|string} id ID процедуры
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const show = (id) => {
    return apiClient.get(urls.publicProcedure(id));
};

export default {
    list,
    show,
};
