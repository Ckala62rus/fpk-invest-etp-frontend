/**
 * Точка входа SPA ЭТП: Vue 3 + Pinia + Router + Element Plus.
 */
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import ru from 'element-plus/es/locale/lang/ru';
import 'element-plus/dist/index.css';

import App from '@/App.vue';
import router from '@/router';
import '@/assets/styles/main.css';
import 'sweetalert2/dist/sweetalert2.min.css';

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(ElementPlus, { locale: ru });

app.mount('#app');
