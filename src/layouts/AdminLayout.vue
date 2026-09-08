<script setup>
/**
 * Layout админки: зона super_admin / trade_admin / auditor.
 */
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { ROLES } from '@/constants/roles';

const auth = useAuthStore();
const router = useRouter();

const rolesLabel = computed(() => auth.roles.join(', ') || '—');
const isSuperAdmin = computed(() => auth.hasRole(ROLES.SUPER_ADMIN));

/**
 * Выход из админки.
 * @returns {Promise<void>}
 */
async function onLogout() {
    await auth.logout();
    await router.push({ name: 'login' });
}
</script>

<template>
  <div class="admin-layout">
    <aside class="admin-layout__aside">
      <div class="admin-layout__brand">Админка ЭТП</div>
      <nav>
        <router-link :to="{ name: 'admin.dashboard' }">Дашборд</router-link>
        <router-link :to="{ name: 'admin.users' }">Пользователи</router-link>
        <router-link v-if="isSuperAdmin" :to="{ name: 'admin.classifier' }">
          Классификатор
        </router-link>
        <router-link :to="{ name: 'admin.procedures' }">ТЗП</router-link>
        <router-link :to="{ name: 'home' }">Витрина</router-link>
        <router-link :to="{ name: 'cabinet' }">Кабинет</router-link>
      </nav>
      <div class="admin-layout__meta">Роли: {{ rolesLabel }}</div>
      <el-button type="danger" plain @click="onLogout">Выход</el-button>
    </aside>
    <main class="admin-layout__main">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.admin-layout {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 260px 1fr;
}

.admin-layout__aside {
  background: #0f172a;
  color: #fff;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.admin-layout__brand {
  font-weight: 700;
  font-size: 1.05rem;
}

.admin-layout__aside a {
  display: block;
  color: #cbd5e1;
  margin-bottom: 0.5rem;
}

.admin-layout__aside a.router-link-active {
  color: #93c5fd;
}

.admin-layout__meta {
  margin-top: auto;
  font-size: 0.8rem;
  color: #94a3b8;
}

.admin-layout__main {
  padding: 1.5rem;
  background: #f1f5f9;
}

@media (max-width: 768px) {
  .admin-layout {
    grid-template-columns: 1fr;
  }
}
</style>
