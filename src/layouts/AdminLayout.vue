<script setup>
/**
 * Layout админки в стиле Metronic aside-dark + header.
 */
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { ROLES, roleLabel } from '@/constants/roles';

const auth = useAuthStore();
const router = useRouter();

const isSuperAdmin = computed(() => auth.hasRole(ROLES.SUPER_ADMIN));
const rolesLabel = computed(() => {
    if (!auth.roles.length) {
        return '—';
    }
    return auth.roles.map(roleLabel).join(', ');
});
const horizonUrl = import.meta.env.VITE_HORIZON_URL || 'http://localhost:8200/horizon';
const displayName = computed(() => {
    const u = auth.user;
    return u?.profile?.name || u?.email || u?.inn || 'Админ';
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
      <div id="kt_aside" class="aside aside-dark aside-hoverable">
        <div class="aside-logo flex-column-auto px-6" id="kt_aside_logo">
          <router-link :to="{ name: 'admin.dashboard' }" class="d-flex align-items-center">
            <img alt="Logo" src="/metronic/media/logos/logo-1.svg" class="h-15px logo" />
            <span class="text-white fw-bolder fs-6 ms-3">Админка ЭТП</span>
          </router-link>
        </div>
        <div class="aside-menu flex-column-fluid">
          <div class="hover-scroll-overlay-y my-5 px-3">
            <div class="menu menu-column menu-title-gray-800 menu-state-title-primary">
              <div class="menu-item">
                <router-link class="menu-link" :to="{ name: 'admin.dashboard' }">
                  <span class="menu-title">Дашборд</span>
                </router-link>
              </div>
              <div class="menu-item">
                <router-link class="menu-link" :to="{ name: 'admin.users' }">
                  <span class="menu-title">Пользователи</span>
                </router-link>
              </div>
              <div v-if="isSuperAdmin" class="menu-item">
                <router-link class="menu-link" :to="{ name: 'admin.classifier' }">
                  <span class="menu-title">Классификатор</span>
                </router-link>
              </div>
              <div class="menu-item">
                <router-link class="menu-link" :to="{ name: 'admin.procedures' }">
                  <span class="menu-title">ТЗП</span>
                </router-link>
              </div>
              <div v-if="isSuperAdmin" class="menu-item">
                <router-link class="menu-link" :to="{ name: 'admin.cms' }">
                  <span class="menu-title">CMS</span>
                </router-link>
              </div>
              <div v-if="isSuperAdmin" class="menu-item">
                <router-link class="menu-link" :to="{ name: 'admin.notifications' }">
                  <span class="menu-title">Письма</span>
                </router-link>
              </div>
              <div v-if="isSuperAdmin" class="menu-item">
                <router-link class="menu-link" :to="{ name: 'admin.surveys' }">
                  <span class="menu-title">Опросы</span>
                </router-link>
              </div>
              <div v-if="isSuperAdmin" class="menu-item">
                <router-link class="menu-link" :to="{ name: 'admin.extraTemplates' }">
                  <span class="menu-title">Доп. условия</span>
                </router-link>
              </div>
              <div class="menu-item">
                <router-link class="menu-link" :to="{ name: 'admin.reports' }">
                  <span class="menu-title">Отчёты</span>
                </router-link>
              </div>
              <div class="menu-item">
                <router-link class="menu-link" :to="{ name: 'admin.activity' }">
                  <span class="menu-title">Аудит</span>
                </router-link>
              </div>
              <div v-if="isSuperAdmin" class="menu-item">
                <a class="menu-link" :href="horizonUrl" target="_blank" rel="noopener noreferrer">
                  <span class="menu-title">Horizon</span>
                </a>
              </div>
              <div class="menu-item">
                <div class="menu-content pt-8 pb-2">
                  <span class="menu-section text-muted text-uppercase fs-8 ls-1">Навигация</span>
                </div>
              </div>
              <div class="menu-item">
                <router-link class="menu-link" :to="{ name: 'home' }">
                  <span class="menu-title">Витрина</span>
                </router-link>
              </div>
              <div class="menu-item">
                <router-link class="menu-link" :to="{ name: 'cabinet' }">
                  <span class="menu-title">Кабинет</span>
                </router-link>
              </div>
            </div>
          </div>
        </div>
        <div class="aside-footer flex-column-auto px-5 pb-5">
          <div class="text-gray-600 fs-8 mb-2">Роли: {{ rolesLabel }}</div>
          <button type="button" class="btn btn-custom btn-primary w-100" @click="onLogout">
            Выход
          </button>
        </div>
      </div>

      <div class="wrapper d-flex flex-column flex-row-fluid" id="kt_wrapper">
        <div id="kt_header" class="header align-items-stretch">
          <div class="container-fluid d-flex align-items-stretch justify-content-between">
            <div class="d-flex align-items-center">
              <h1 class="text-dark fw-bolder my-1 fs-3">Панель управления</h1>
            </div>
            <div class="d-flex align-items-center">
              <span class="text-gray-600 fw-bold me-3">{{ displayName }}</span>
            </div>
          </div>
        </div>
        <div class="content d-flex flex-column flex-column-fluid">
          <div class="container-xxl" id="kt_content_container">
            <slot />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
#kt_aside {
  width: 265px;
  background: #1e1e2d;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.aside-logo {
  padding-top: 1.5rem;
  padding-bottom: 1rem;
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
  min-height: 100vh;
  flex: 1;
}

#kt_header {
  background: #fff;
  border-bottom: 1px solid #eff2f5;
  min-height: 65px;
}

#kt_content_container {
  padding-top: 1.5rem;
  padding-bottom: 2rem;
}

@media (max-width: 991px) {
  .page {
    flex-direction: column;
  }

  #kt_aside {
    width: 100%;
    min-height: auto;
  }
}
</style>
