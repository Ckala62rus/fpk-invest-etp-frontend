<script setup>
/**
 * Корневой компонент SPA: выбирает layout по meta.layout активного маршрута.
 */
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import PublicLayout from '@/layouts/PublicLayout.vue';
import CabinetLayout from '@/layouts/CabinetLayout.vue';
import AdminLayout from '@/layouts/AdminLayout.vue';

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
        default:
            return PublicLayout;
    }
});
</script>

<template>
  <component :is="layoutComponent">
    <router-view />
  </component>
</template>
