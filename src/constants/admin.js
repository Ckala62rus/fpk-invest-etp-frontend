/**
 * Статусы пользователя для фильтров и отображения в админке.
 * value — slug API; label — текст для UI на русском.
 */
export const USER_STATUSES = Object.freeze([
    { value: 'pending_email', label: 'Ожидает подтверждения email' },
    { value: 'pending_approval', label: 'Ожидает одобрения' },
    { value: 'active', label: 'Активен' },
    { value: 'blocked', label: 'Заблокирован' },
]);

/**
 * Роли, которые можно назначить через API (без guest).
 * value — slug Spatie; label — русское название для операторов ЭТП.
 */
export const ASSIGNABLE_ROLES = Object.freeze([
    { value: 'super_admin', label: 'Главный администратор' },
    { value: 'trade_admin', label: 'Администратор торгов' },
    { value: 'auditor', label: 'Аудитор' },
    { value: 'participant', label: 'Участник' },
]);

/**
 * Русская подпись статуса пользователя.
 *
 * @param {string|null|undefined} status Slug статуса с API
 * @returns {string}
 */
export function userStatusLabel(status) {
    const found = USER_STATUSES.find((item) => item.value === status);
    return found?.label || status || '—';
}
