import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import apiClient, { fetchCsrfCookie } from '@/api/axios';
import urls from '@/api/urls';

/**
 * Laravel Echo + Reverb для тикера аукциона.
 * Presence-канал участнику не подключаем (только private auction.{id}).
 */

/** @type {import('laravel-echo').default|null} */
let echoInstance = null;

/**
 * Создаёт или возвращает singleton Echo.
 * При VITE_REVERB_ENABLED=false возвращает null (только HTTP polling/ручное обновление).
 *
 * @returns {import('laravel-echo').default|null}
 */
export function getEcho() {
    const enabled = String(import.meta.env.VITE_REVERB_ENABLED || 'true') !== 'false';
    const key = import.meta.env.VITE_REVERB_APP_KEY;

    if (!enabled || !key) {
        return null;
    }

    if (echoInstance) {
        return echoInstance;
    }

    window.Pusher = Pusher;

    const scheme = import.meta.env.VITE_REVERB_SCHEME || 'http';
    const host = import.meta.env.VITE_REVERB_HOST || 'localhost';
    const port = Number(import.meta.env.VITE_REVERB_PORT || 6001);

    echoInstance = new Echo({
        broadcaster: 'reverb',
        key,
        wsHost: host,
        wsPort: port,
        wssPort: port,
        forceTLS: scheme === 'https',
        enabledTransports: ['ws', 'wss'],
        authEndpoint: `${(import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')}${urls.broadcastingAuth}`,
        authorizer: (channel) => ({
            /**
             * Авторизация private-канала через Sanctum cookie.
             * @param {string} socketId ID сокета Pusher
             * @param {(error: Error|null, data: unknown) => void} callback Результат
             * @returns {void}
             */
            authorize: (socketId, callback) => {
                fetchCsrfCookie()
                    .then(() => apiClient.post(urls.broadcastingAuth, {
                        socket_id: socketId,
                        channel_name: channel.name,
                    }))
                    .then((response) => {
                        callback(null, response.data);
                    })
                    .catch((error) => {
                        callback(error, null);
                    });
            },
        }),
    });

    return echoInstance;
}

/**
 * Отписывается и уничтожает Echo (при уходе со страницы аукциона).
 * @returns {void}
 */
export function disconnectEcho() {
    if (echoInstance) {
        echoInstance.disconnect();
        echoInstance = null;
    }
}
