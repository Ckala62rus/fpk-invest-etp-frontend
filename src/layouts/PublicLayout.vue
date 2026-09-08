<script setup>
/**
 * Публичный layout по reference example: Header + Navbar + Footer
 * (не Metronic — Metronic только админка/кабинет/auth).
 */
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import cmsApi from '@/api/modules/cms';

const auth = useAuthStore();
const router = useRouter();
const cmsLinks = ref([]);
const mobileOpen = ref(false);

const cabinetTarget = computed(() => {
    if (!auth.isAuth) {
        return { name: 'login' };
    }
    return auth.isAdminArea ? { name: 'admin.dashboard' } : { name: 'cabinet' };
});

const displayName = computed(() => {
    const u = auth.user;
    if (!u) {
        return 'Гость';
    }
    return u.profile?.name || u.email || u.inn || 'Пользователь';
});

/**
 * @returns {Promise<void>}
 */
async function loadCmsNav() {
    try {
        const { data } = await cmsApi.list();
        const list = Array.isArray(data.data) ? data.data : [];
        cmsLinks.value = list
            .slice()
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
            .map((p) => ({ slug: p.slug, title: p.title }));
    } catch {
        cmsLinks.value = [];
    }
}

/**
 * @returns {Promise<void>}
 */
async function onLogout() {
    await auth.logout();
    await router.push({ name: 'home' });
}

onMounted(loadCmsNav);
</script>

<template>
  <div class="public-shell">
    <header class="header-wrapper">
      <div class="container">
        <div class="header-row">
          <router-link :to="{ name: 'home' }" class="logo-section">
            <div class="logo-placeholder">
              <span class="logo-text">ФИ</span>
            </div>
            <div>
              <h1 class="portal-title">ЭТП ФПК «Инвест»</h1>
              <p class="portal-subtitle">Электронная торговая площадка</p>
            </div>
          </router-link>

          <div class="user-info">
            <p class="mb-1">
              Здравствуйте,
              <span class="user-name">{{ displayName }}</span>
            </p>
            <div class="user-actions">
              <template v-if="!auth.isAuth">
                <router-link :to="{ name: 'login' }" class="btn-admin">Вход</router-link>
                <router-link :to="{ name: 'register' }" class="btn-admin">Регистрация</router-link>
              </template>
              <template v-else>
                <router-link
                  v-if="auth.isAdminArea"
                  :to="{ name: 'admin.dashboard' }"
                  class="btn-admin"
                >
                  Панель администратора
                </router-link>
                <router-link :to="cabinetTarget" class="btn-admin">Кабинет</router-link>
                <button type="button" class="btn-logout" title="Выход" @click="onLogout">✕</button>
              </template>
            </div>
          </div>
        </div>
      </div>
    </header>

    <nav class="main-nav">
      <div class="container nav-inner">
        <button
          type="button"
          class="nav-toggler"
          aria-label="Меню"
          @click="mobileOpen = !mobileOpen"
        >
          ☰
        </button>
        <ul class="navbar-nav" :class="{ open: mobileOpen }">
          <li>
            <router-link
              class="nav-link"
              :to="{ name: 'home' }"
              @click="mobileOpen = false"
            >
              Главная
            </router-link>
          </li>
          <li>
            <router-link
              class="nav-link"
              :to="{ name: 'procedures.index' }"
              @click="mobileOpen = false"
            >
              Процедуры
            </router-link>
          </li>
          <li v-for="page in cmsLinks" :key="page.slug">
            <router-link
              class="nav-link"
              :to="{ name: 'cms.show', params: { slug: page.slug } }"
              @click="mobileOpen = false"
            >
              {{ page.title }}
            </router-link>
          </li>
          <li>
            <router-link
              class="nav-link"
              :to="{ name: 'complaint' }"
              @click="mobileOpen = false"
            >
              Жалоба
            </router-link>
          </li>
          <li>
            <router-link
              class="nav-link"
              :to="{ name: 'corruption' }"
              @click="mobileOpen = false"
            >
              Антикоррупция
            </router-link>
          </li>
        </ul>
      </div>
    </nav>

    <main class="main-content">
      <div class="container">
        <slot />
      </div>
    </main>

    <footer class="footer-wrapper">
      <div class="container footer-content">
        <p class="footer-text">ЭТП ФПК «Инвест» © {{ new Date().getFullYear() }}</p>
        <div class="footer-links">
          <router-link :to="{ name: 'cms.show', params: { slug: 'about' } }">О площадке</router-link>
          <router-link :to="{ name: 'cms.show', params: { slug: 'contacts' } }">Контакты</router-link>
          <router-link :to="{ name: 'corruption' }">Антикоррупция</router-link>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.public-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--public-bg, #f8f6f4);
  color: var(--text-dark, #1a1a1a);
}

.container {
  width: 100%;
  max-width: 1140px;
  margin: 0 auto;
  padding: 0 16px;
}

.header-wrapper {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  padding: 16px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 16px;
  color: inherit;
}

.logo-placeholder {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #7c2d36, #9a3a45);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.logo-text {
  color: #fff;
  font-weight: 700;
  font-size: 1.35rem;
  letter-spacing: 1px;
}

.portal-title {
  color: #7c2d36;
  font-size: 1.35rem;
  font-weight: 700;
  margin: 0;
}

.portal-subtitle {
  font-size: 0.8rem;
  color: #6b7280;
  margin: 2px 0 0;
}

.user-info {
  text-align: right;
  font-size: 0.875rem;
}

.user-name {
  font-weight: 600;
  color: #1a1a1a;
}

.user-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.btn-admin {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  font-size: 0.75rem;
  font-weight: 500;
  color: #7c2d36;
  background: rgba(124, 45, 54, 0.08);
  border: 1px solid rgba(124, 45, 54, 0.15);
  border-radius: 6px;
}

.btn-admin:hover {
  background: rgba(124, 45, 54, 0.15);
}

.btn-logout {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  color: #6b7280;
  background: transparent;
  border: 1px solid rgba(0, 0, 0, 0.08);
  cursor: pointer;
}

.btn-logout:hover {
  background: #fee2e2;
  color: #dc2626;
}

.main-nav {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.nav-inner {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 52px;
}

.nav-toggler {
  display: none;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: #fff;
  border-radius: 8px;
  padding: 8px 12px;
  cursor: pointer;
}

.navbar-nav {
  display: flex;
  align-items: center;
  gap: 4px;
  list-style: none;
  margin: 0;
  padding: 0;
  flex-wrap: wrap;
}

.nav-link {
  display: block;
  color: #4a4a4a !important;
  font-weight: 500;
  font-size: 0.875rem;
  padding: 12px 16px !important;
  border-radius: 8px;
}

.nav-link:hover,
.nav-link.router-link-active {
  color: #7c2d36 !important;
  background: rgba(124, 45, 54, 0.08);
}

.main-content {
  flex: 1;
  padding: 24px 0 40px;
}

.footer-wrapper {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  padding: 20px 0;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  margin-top: auto;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.footer-text {
  color: #6b7280;
  font-size: 0.8rem;
  margin: 0;
}

.footer-links {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.footer-links a {
  color: #6b7280;
  font-size: 0.8rem;
}

.footer-links a:hover {
  color: #7c2d36;
}

@media (max-width: 768px) {
  .header-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .user-info {
    text-align: left;
    width: 100%;
  }

  .user-actions {
    justify-content: flex-start;
  }

  .nav-toggler {
    display: inline-flex;
  }

  .navbar-nav {
    display: none;
    width: 100%;
    flex-direction: column;
    align-items: stretch;
    padding: 8px 0 12px;
  }

  .navbar-nav.open {
    display: flex;
  }
}
</style>
