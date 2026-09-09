/**
 * Подписи и цвет тега фазы торгов аукциона (старт / пауза / финиш).
 *
 * @param {string|null|undefined} code pending|running|paused|finished|cancelled
 * @returns {{ label: string, tagType: 'info'|'success'|'warning'|'danger' }}
 */
export function auctionTradeBadge(code) {
    const map = {
        pending: { label: 'Ожидает старта', tagType: 'info' },
        running: { label: 'Идут торги', tagType: 'success' },
        paused: { label: 'На паузе', tagType: 'warning' },
        finished: { label: 'Завершён', tagType: 'info' },
        cancelled: { label: 'Отменён', tagType: 'danger' },
    };
    return map[code] || { label: code || '—', tagType: 'info' };
}
