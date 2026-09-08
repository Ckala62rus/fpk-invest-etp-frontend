<script setup>
/**
 * Layout кабинета участника: боковое меню ЛК.
 */
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const router = useRouter();

/**
 * Выход из кабинета.
 * @returns {Promise<void>}
 */
async function onLogout() {
    await auth.logout();
    await router.push({ name: 'login' });
}
</script>

<template>
  <div class="cabinet-layout">
    <aside class="cabinet-layout__aside">
      <div class="cabinet-layout__title">Кабинет участника</div>
      <nav>
        <router-link :to="{ name: 'cabinet' }">Обзор</router-link>
        <router-link :to="{ name: 'cabinet.profile' }">Профиль</router-link>
        <router-link :to="{ name: 'cabinet.subscriptions' }">Подписки</router-link>
        <router-link :to="{ name: 'cabinet.notifications' }">Уведомления</router-link>
        <router-link :to="{ name: 'cabinet.proposals' }">Мои КП</router-link>
        <router-link :to="{ name: 'home' }">На витрину</router-link>
        <router-link v-if="auth.isAdminArea" :to="{ name: 'admin.dashboard' }">
          В админку
        </router-link>
      </nav>
      <el-button class="cabinet-layout__logout" @click="onLogout">Выход</el-button>
    </aside>
    <main class="cabinet-layout__main">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.cabinet-layout {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 240px 1fr;
}

.cabinet-layout__aside {
  background: #1e293b;
  color: #fff;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.cabinet-layout__title {
  font-weight: 700;
}

.cabinet-layout__aside a {
  display: block;
  color: #cbd5e1;
  margin-bottom: 0.5rem;
}

.cabinet-layout__aside a.router-link-active {
  color: #93c5fd;
}

.cabinet-layout__logout {
  margin-top: auto;
}

.cabinet-layout__main {
  padding: 1.5rem;
}

@media (max-width: 768px) {
  .cabinet-layout {
    grid-template-columns: 1fr;
  }
}
</style>
