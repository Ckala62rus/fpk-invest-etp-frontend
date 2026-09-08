<script setup>
/**
 * Корневой компонент SPA: выбирает layout по meta.layout активного маршрута.
 */
import { computed, watchEffect } from 'vue';
import { useRoute } from 'vue-router';
import PublicLayout from '@/layouts/PublicLayout.vue';
import CabinetLayout from '@/layouts/CabinetLayout.vue';
import AdminLayout from '@/layouts/AdminLayout.vue';
import AuthLayout from '@/layouts/AuthLayout.vue';

const route = useRoute();

/**
 * Какой layout отрисовать для текущего маршрута.
 * @returns {import('vue').Component}
 */
const layoutComponent = computed(() => {
    switch (route.meta.layout) {
        case 'admin':
            return AdminLayout;
        case 'cabinet':
            return CabinetLayout;
        case 'auth':
            return AuthLayout;
        default:
            return PublicLayout;
    }
});

/**
 * Классы body как в Metronic: на auth — белый фон без aside.
 */
watchEffect(() => {
    const body = document.getElementById('kt_body') || document.body;
    if (route.meta.layout === 'auth') {
        body.className = 'bg-body';
        return;
    }
    if (route.meta.layout === 'admin' || route.meta.layout === 'cabinet') {
        body.className = 'header-fixed header-tablet-and-mobile-fixed toolbar-enabled aside-enabled aside-fixed';
        return;
    }
    // Витрина: без Metronic aside-классов — chrome example
    body.className = 'bg-body';
});
</script>

<template>
  <component :is="layoutComponent">
    <router-view />
  </component>
</template>
