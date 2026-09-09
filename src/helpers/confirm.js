import Swal from 'sweetalert2';

/**
 * Подтверждение действия (SweetAlert2) вместо ElMessageBox.
 *
 * @param {string} text Текст вопроса
 * @param {string} [title='Подтверждение'] Заголовок
 * @param {{ confirmText?: string, cancelText?: string, icon?: string }} [options] Кнопки
 * @returns {Promise<boolean>} true если пользователь подтвердил
 */
export async function confirmAction(text, title = 'Подтверждение', options = {}) {
    const result = await Swal.fire({
        title,
        text,
        icon: options.icon || 'question',
        showCancelButton: true,
        confirmButtonText: options.confirmText || 'Да',
        cancelButtonText: options.cancelText || 'Отмена',
        reverseButtons: true,
        focusCancel: true,
        customClass: {
            confirmButton: 'el-button el-button--primary',
            cancelButton: 'el-button',
        },
        buttonsStyling: true,
    });

    return result.isConfirmed;
}
