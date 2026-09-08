/**
 * Читает cookie по имени (нужно для XSRF-TOKEN → заголовок X-XSRF-TOKEN).
 *
 * Laravel кладёт cookie `XSRF-TOKEN` (URL-encoded); axios сам не всегда
 * подставляет её при cross-origin — при same-origin proxy обычно хватает
 * withCredentials, но явная подстановка надёжнее.
 *
 * @param {string} name Имя cookie
 * @returns {string|null} Декодированное значение или null
 */
export function getCookie(name) {
    const match = document.cookie.match(
        new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)'),
    );

    return match ? decodeURIComponent(match[1]) : null;
}
