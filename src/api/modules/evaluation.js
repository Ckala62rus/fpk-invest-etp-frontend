import apiClient, { fetchCsrfCookie } from '@/api/axios';
import urls from '@/api/urls';

/**
 * API-модуль опроса качества закупки по токену из письма (без входа).
 */

/**
 * Получить вопросы открытого опроса.
 *
 * @param {string} token Токен из ссылки письма
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const show = (token) => {
    return apiClient.get(urls.evaluationSurvey(token));
};

/**
 * Отправить ответы и оценки победителя.
 *
 * @param {string} token Токен опроса
 * @param {Record<string, unknown>} payload answers, contractor_score, product_score, comment
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const submit = async (token, payload) => {
    await fetchCsrfCookie();
    return apiClient.post(urls.evaluationSurvey(token), payload);
};

export default {
    show,
    submit,
};
