<script setup>
/**
 * Layout кабинета участника — Metronic aside (как админка, светлее по смыслу ЛК).
 */
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const router = useRouter();

const displayName = computed(() => {
    const u = auth.user;
    return u?.profile?.name || u?.email || u?.inn || 'Участник';
});

/**
 * @returns {Promise<void>}
 */
async function onLogout() {
    await auth.logout();
    await router.push({ name: 'login' });
}
</script>

<template>
  <div class="d-flex flex-column flex-root">
    <div class="page d-flex flex-row flex-column-fluid">
      <div class="aside aside-dark aside-hoverable cabinet-aside">
        <div class="aside-logo flex-column-auto px-6 pt-8 pb-4">
          <span class="text-white fw-bolder fs-5">Кабинет участника</span>
        </div>
        <div class="aside-menu flex-column-fluid px-3">
          <div class="menu menu-column">
            <div class="menu-item">
              <router-link class="menu-link" :to="{ name: 'cabinet' }">
                <span class="menu-title">Обзор</span>
              </router-link>
            </div>
            <div class="menu-item">
              <router-link class="menu-link" :to="{ name: 'cabinet.profile' }">
                <span class="menu-title">Профиль</span>
              </router-link>
            </div>
            <div class="menu-item">
              <router-link class="menu-link" :to="{ name: 'cabinet.subscriptions' }">
                <span class="menu-title">Подписки</span>
              </router-link>
            </div>
            <div class="menu-item">
              <router-link class="menu-link" :to="{ name: 'cabinet.notifications' }">
                <span class="menu-title">Уведомления</span>
              </router-link>
            </div>
            <div class="menu-item">
              <router-link class="menu-link" :to="{ name: 'cabinet.proposals' }">
                <span class="menu-title">Мои КП</span>
              </router-link>
            </div>
            <div class="menu-item">
              <router-link class="menu-link" :to="{ name: 'home' }">
                <span class="menu-title">На витрину</span>
              </router-link>
            </div>
            <div v-if="auth.isAdminArea" class="menu-item">
              <router-link class="menu-link" :to="{ name: 'admin.dashboard' }">
                <span class="menu-title">В админку</span>
              </router-link>
            </div>
          </div>
        </div>
        <div class="aside-footer px-5 pb-5">
          <button type="button" class="btn btn-primary w-100" @click="onLogout">Выход</button>
        </div>
      </div>

      <div class="wrapper d-flex flex-column flex-row-fluid">
        <div class="header align-items-stretch bg-white border-bottom">
          <div class="container-fluid d-flex align-items-center justify-content-between min-h-65px">
            <h1 class="text-dark fw-bolder fs-3 my-1">Личный кабинет</h1>
            <span class="text-gray-600 fw-bold">{{ displayName }}</span>
          </div>
        </div>
        <div class="content d-flex flex-column flex-column-fluid">
          <div class="container-xxl py-5">
            <slot />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cabinet-aside {
  width: 250px;
  background: #1e1e2d;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.menu-link {
  color: #9899ac !important;
  padding: 0.65rem 1rem;
  border-radius: 0.475rem;
  display: flex;
}

.menu-link.router-link-active,
.menu-link:hover {
  color: #fff !important;
  background: rgba(255, 255, 255, 0.05);
}

.wrapper {
  background: #f5f8fa;
  flex: 1;
  min-height: 100vh;
}

.min-h-65px {
  min-height: 65px;
}

@media (max-width: 991px) {
  .page {
    flex-direction: column;
  }

  .cabinet-aside {
    width: 100%;
    min-height: auto;
  }
}
</style>
