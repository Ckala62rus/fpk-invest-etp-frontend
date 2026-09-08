/**
 * Статусы пользователя для фильтров админки.
 */
export const USER_STATUSES = Object.freeze([
    { value: 'pending_email', label: 'Ожидает email' },
    { value: 'pending_approval', label: 'Ожидает одобрения' },
    { value: 'active', label: 'Активен' },
    { value: 'blocked', label: 'Заблокирован' },
]);

/**
 * Роли, которые можно назначить через API (без guest).
 */
export const ASSIGNABLE_ROLES = Object.freeze([
    { value: 'super_admin', label: 'super_admin' },
    { value: 'trade_admin', label: 'trade_admin' },
    { value: 'auditor', label: 'auditor' },
    { value: 'participant', label: 'participant' },
]);
