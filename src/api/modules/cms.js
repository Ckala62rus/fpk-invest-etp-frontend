import apiClient from '@/api/axios';
import urls from '@/api/urls';

/**
 * API-модуль публичных страниц CMS (контент-сайт).
 */

/**
 * Список опубликованных страниц (меню / sitemap).
 *
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const list = () => {
    return apiClient.get(urls.cmsPages);
};

/**
 * Одна страница по ЧПУ (slug) с HTML-контентом ревизии.
 *
 * @param {string} slug ЧПУ страницы
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const show = (slug) => {
    return apiClient.get(urls.cmsPage(slug));
};

export default {
    list,
    show,
};
