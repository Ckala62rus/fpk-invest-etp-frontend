<script setup>
/**
 * Публичный layout: шапка витрины ЭТП (фаза F0).
 */
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const router = useRouter();

const cabinetTarget = computed(() => {
    if (!auth.isAuth) {
        return { name: 'login' };
    }
    return auth.isAdminArea ? { name: 'admin.dashboard' } : { name: 'cabinet' };
});

/**
 * Выход и возврат на главную.
 * @returns {Promise<void>}
 */
async function onLogout() {
    await auth.logout();
    await router.push({ name: 'home' });
}
</script>

<template>
  <div class="public-layout">
    <header class="public-layout__header">
      <router-link class="public-layout__brand" :to="{ name: 'home' }">
        ЭТП ФПК «Инвест»
      </router-link>
      <nav class="public-layout__nav">
        <router-link :to="{ name: 'home' }">Главная</router-link>
        <router-link v-if="!auth.isAuth" :to="{ name: 'login' }">Вход</router-link>
        <router-link v-if="!auth.isAuth" :to="{ name: 'register' }">Регистрация</router-link>
        <router-link v-if="auth.isAuth" :to="cabinetTarget">Кабинет</router-link>
        <el-button v-if="auth.isAuth" link type="danger" @click="onLogout">Выход</el-button>
      </nav>
    </header>
    <main class="public-layout__main">
      <slot />
    </main>
    <footer class="public-layout__footer">
      © ЭТП — электронная торговая площадка
    </footer>
  </div>
</template>

<style scoped>
.public-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.public-layout__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.85rem 1.5rem;
  background: #111827;
  color: #fff;
}

.public-layout__brand {
  color: #fff;
  font-weight: 700;
}

.public-layout__nav {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.public-layout__nav a {
  color: #e5e7eb;
}

.public-layout__nav a.router-link-active {
  color: #93c5fd;
}

.public-layout__main {
  flex: 1;
}

.public-layout__footer {
  padding: 1rem 1.5rem;
  text-align: center;
  color: #6b7280;
  font-size: 0.875rem;
}
</style>
