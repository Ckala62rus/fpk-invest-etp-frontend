/**
 * Константы ролей RBAC (role-based access control) ЭТП.
 *
 * Совпадают со slug’ами Spatie Permission на бэкенде.
 * Используются в meta.roles маршрутов и проверках Pinia.
 */
export const ROLES = Object.freeze({
    /** Главный администратор — полный доступ */
    SUPER_ADMIN: 'super_admin',
    /** Администратор торгов — ТЗП, ставки, КП */
    TRADE_ADMIN: 'trade_admin',
    /** Аудитор — просмотр, согласование документации, аудит */
    AUDITOR: 'auditor',
    /** Участник торгов — кабинет, ставки, КП */
    PARTICIPANT: 'participant',
});

/**
 * Роли, которым разрешена админ-зона (`/admin/*`).
 *
 * @type {readonly string[]}
 */
export const ADMIN_ROLES = Object.freeze([
    ROLES.SUPER_ADMIN,
    ROLES.TRADE_ADMIN,
    ROLES.AUDITOR,
]);

/**
 * Имена ключей localStorage (настройки UI; сессия — cookie Sanctum, не JWT).
 */
export const STORAGE_KEYS = Object.freeze({
    /** Предпочитаемая тема Element Plus (светлая/тёмная), опционально */
    THEME: 'etp_theme',
});
