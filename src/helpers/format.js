/**
 * Форматирует ISO-дату с бэка для отображения в UI (ru-RU).
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
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
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
        // Пустой массив — сброс ошибок (authError = []), не «Ошибка запроса»
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
