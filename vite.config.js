import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

/**
 * Конфиг Vite для SPA ЭТП (электронной торговой площадки).
 *
 * @param {{ mode: string }} ctx Режим сборки (development / production)
 * @returns {import('vite').UserConfig}
 */
export default defineConfig(({ mode }) => {
    // Читаем VITE_* из .env, чтобы прокси и порт можно было менять без правки кода
    const env = loadEnv(mode, process.cwd(), '');
    const apiTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:8200';
    const port = Number(env.VITE_DEV_PORT || 5173);

    return {
        plugins: [vue()],
        resolve: {
            alias: {
                // Как в вашем reference-проекте: импорты через @/
                '@': fileURLToPath(new URL('./src', import.meta.url)),
            },
        },
        server: {
            host: '0.0.0.0',
            port,
            // В Docker/на сервере cookie Sanctum идут на тот же origin через proxy
            proxy: {
                '/api': {
                    target: apiTarget,
                    changeOrigin: true,
                    // Не переписываем Domain cookie: сессия остаётся на localhost (dev)
                },
                '/sanctum': {
                    target: apiTarget,
                    changeOrigin: true,
                },
            },
        },
        preview: {
            host: '0.0.0.0',
            port,
        },
    };
});
