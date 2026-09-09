/**
 * Работа с файлами API (blob + cookie Sanctum): открыть в новой вкладке или скачать.
 */

/**
 * Является ли имя файла PDF (для просмотра в браузере).
 *
 * @param {string|null|undefined} fileName Имя файла
 * @returns {boolean}
 */
export function isPdfFile(fileName) {
    return /\.pdf$/i.test(String(fileName || ''));
}

/**
 * Скачивает blob как файл с заданным именем.
 *
 * @param {Blob} blob Данные
 * @param {string} fileName Имя файла
 * @returns {void}
 */
export function saveBlobAsFile(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || 'document';
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

/**
 * Открывает blob в новой вкладке (PDF/изображения).
 *
 * @param {Blob} blob Данные
 * @returns {void}
 */
export function openBlobInNewTab(blob) {
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (!win) {
        // Блокировщик попапов — скачиваем как fallback
        saveBlobAsFile(blob, 'document');
    }
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
