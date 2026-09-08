/**
 * Локальный список ID своих КП (на бэке нет GET /proposals участника).
 * Ключ в localStorage.
 */
const STORAGE_KEY = 'etp_my_proposal_ids';

/**
 * @returns {number[]}
 */
export function getMyProposalIds() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const list = raw ? JSON.parse(raw) : [];
        return Array.isArray(list) ? list.map(Number).filter(Boolean) : [];
    } catch {
        return [];
    }
}

/**
 * Запоминает ID поданного КП.
 * @param {number|string} id ID заявки
 * @returns {void}
 */
export function rememberProposalId(id) {
    const num = Number(id);
    if (!num) {
        return;
    }
    const next = [num, ...getMyProposalIds().filter((x) => x !== num)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next.slice(0, 50)));
}

/**
 * Убирает ID из локального списка.
 * @param {number|string} id ID заявки
 * @returns {void}
 */
export function forgetProposalId(id) {
    const num = Number(id);
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(getMyProposalIds().filter((x) => x !== num)),
    );
}
