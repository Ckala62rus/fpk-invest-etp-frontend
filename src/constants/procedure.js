/**
 * Константы типов и статусов ТЗП (торгово-закупочных процедур) для фильтров UI.
 * Значения совпадают с PHP Enum на бэкенде.
 */
export const PROCEDURE_TYPES = Object.freeze([
    { value: 'request_for_proposal', label: 'Запрос предложений' },
    { value: 'auction', label: 'Электронный аукцион' },
]);

/**
 * Статусы, доступные в публичном списке (см. ListPublicProceduresRequest).
 */
export const PUBLIC_PROCEDURE_STATUSES = Object.freeze([
    { value: 'published', label: 'Опубликована' },
    { value: 'accepting', label: 'Приём заявок' },
    { value: 'review', label: 'Рассмотрение' },
    { value: 'auction_pending', label: 'Ожидание аукциона' },
    { value: 'in_progress', label: 'Идут торги' },
    { value: 'completed', label: 'Завершена' },
]);

/**
 * Типы субъекта при регистрации (EntityType).
 */
export const ENTITY_TYPES = Object.freeze([
    { value: 'legal', label: 'Юридическое лицо' },
    { value: 'individual', label: 'Физическое лицо' },
]);
