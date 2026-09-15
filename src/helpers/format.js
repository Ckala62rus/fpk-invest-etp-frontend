/**
 * Форматирует ISO-дату с бэка для отображения в UI (Europe/Moscow).
 * Часовой пояс приложения ЭТП — Москва; иначе UTC с бэка «съезжает» на +3 в браузере.
 *
 * @param {string|null|undefined} iso Дата в ISO 8601
 * @returns {string} Локализованная строка или «—»
 */
export function formatDateTime(iso) {
    if (!iso) {
        return '—';
    }

    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
        return '—';
    }

    return date.toLocaleString('ru-RU', {
        timeZone: 'Europe/Moscow',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * ISO → naive datetime для el-date-picker (Europe/Moscow, YYYY-MM-DD HH:mm:ss).
 *
 * @param {string|null|undefined} iso ISO с бэка
 * @returns {string}
 */
export function toNaiveDateTimeMoscow(iso) {
    if (!iso) {
        return '';
    }
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
        return '';
    }
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Moscow',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    }).formatToParts(date);
    /** @type {Record<string, string>} */
    const map = {};
    for (const p of parts) {
        if (p.type !== 'literal') {
            map[p.type] = p.value;
        }
    }
    return `${map.year}-${map.month}-${map.day} ${map.hour}:${map.minute}:${map.second}`;
}

/**
 * Человекочитаемое сообщение об ошибке API (с учётом Laravel errors).
 *
 * @param {unknown} error Ошибка axios / unknown
 * @param {string} [fallback='Ошибка запроса'] Текст по умолчанию
 * @returns {string}
 */
export function apiErrorMessage(error, fallback = 'Ошибка запроса') {
    const data = error && typeof error === 'object' && 'response' in error
        ? /** @type {{ response?: { data?: { message?: string, errors?: Record<string, string[]> } } }} */ (error).response?.data
        : null;

    if (data?.errors && typeof data.errors === 'object') {
        const first = Object.values(data.errors).flat().find(Boolean);
        if (first) {
            return String(first);
        }
    }

    if (data?.message) {
        return String(data.message);
    }

    if (error && typeof error === 'object' && 'message' in error && error.message) {
        return String(error.message);
    }

    return fallback;
}

/**
 * Превращает Laravel `errors` / массив сообщений в объект полей для Element Plus Form.
 *
 * @param {unknown} raw Ошибки из Pinia authError или response.data.errors
 * @returns {Record<string, string>} Карта field → первое сообщение
 */
export function mapLaravelErrorsToFields(raw) {
    /** @type {Record<string, string>} */
    const result = {};

    if (!raw) {
        return result;
    }

    if (Array.isArray(raw)) {
        if (raw.length === 0) {
            return result;
        }
        result._form = String(raw[0] ?? 'Ошибка запроса');
        return result;
    }

    if (typeof raw === 'object') {
        for (const [key, messages] of Object.entries(raw)) {
            if (Array.isArray(messages) && messages.length > 0) {
                result[key] = String(messages[0]);
            } else if (typeof messages === 'string') {
                result[key] = messages;
            }
        }
    }

    return result;
}
