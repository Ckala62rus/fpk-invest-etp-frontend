<script setup>
/**
 * Публичный layout: Header + Navbar + Footer.
 * Логотип: загруженный админом или дефолт «ФИ». Небесно-голубой корпоративный стиль.
 */
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { SwitchButton } from '@element-plus/icons-vue';
import { useAuthStore } from '@/stores/auth';
import cmsApi from '@/api/modules/cms';
import brandingApi from '@/api/modules/siteLogo';

const auth = useAuthStore();
const router = useRouter();
const cmsLinks = ref([]);
const mobileOpen = ref(false);
/** @type {import('vue').Ref<string|null>} */
const logoUrl = ref(null);

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
async function loadBranding() {
    try {
        const { data } = await brandingApi.show();
        logoUrl.value = data.data?.logo_url || null;
    } catch {
        logoUrl.value = null;
    }
}

/**
 * @returns {Promise<void>}
 */
async function onLogout() {
    await auth.logout();
    await router.push({ name: 'home' });
}

onMounted(() => {
    loadCmsNav();
    loadBranding();
});
</script>

<template>
  <div class="public-shell">
    <header class="header-wrapper">
      <div class="etp-container">
        <div class="header-row">
          <router-link :to="{ name: 'home' }" class="logo-section">
            <!-- Загруженный логотип занимает весь бренд-блок (широкий горизонтальный) -->
            <img
              v-if="logoUrl"
              :src="logoUrl"
              alt="ФПК «Инвест» — электронная торговая площадка"
              class="logo-full"
            >
            <template v-else>
              <div class="logo-box">
                <span class="logo-text">ФИ</span>
              </div>
              <div>
                <h1 class="portal-title">ЭТП ФПК «Инвест»</h1>
                <p class="portal-subtitle">Электронная торговая площадка</p>
              </div>
            </template>
          </router-link>

          <div class="user-info">
            <p class="user-greet">
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
                <button type="button" class="btn-logout" @click="onLogout">
                  <el-icon :size="16"><SwitchButton /></el-icon>
                  <span>Выход</span>
                </button>
              </template>
            </div>
          </div>
        </div>
      </div>
    </header>

    <nav class="etp-main-nav">
      <div class="etp-container etp-nav-inner">
        <button
          type="button"
          class="etp-nav-toggler"
          aria-label="Меню"
          @click="mobileOpen = !mobileOpen"
        >
          ☰
        </button>
        <ul class="etp-nav-list" :class="{ 'is-open': mobileOpen }">
          <li class="etp-nav-item">
            <router-link
              class="etp-nav-link"
              :to="{ name: 'home' }"
              @click="mobileOpen = false"
            >
              Главная
            </router-link>
          </li>
          <li v-for="page in cmsLinks" :key="page.slug" class="etp-nav-item">
            <router-link
              class="etp-nav-link"
              :to="{ name: 'cms.show', params: { slug: page.slug } }"
              @click="mobileOpen = false"
            >
              {{ page.title }}
            </router-link>
          </li>
          <li class="etp-nav-item">
            <router-link
              class="etp-nav-link"
              :to="{ name: 'complaint' }"
              @click="mobileOpen = false"
            >
              Жалоба
            </router-link>
          </li>
          <li class="etp-nav-item">
            <router-link
              class="etp-nav-link"
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
      <div class="etp-container">
        <slot />
      </div>
    </main>

    <footer class="footer-wrapper">
      <div class="etp-container footer-content">
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
  background: var(--public-bg);
  color: var(--text-dark, #1a2332);
}

.etp-container {
  width: 100%;
  max-width: 1140px;
  margin: 0 auto;
  padding: 0 16px;
  box-sizing: border-box;
}

.header-wrapper {
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  padding: 16px 0;
  border-bottom: 1px solid var(--border-color);
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
  min-width: 0;
}

/* Широкий корпоративный логотип вместо «ФИ» + заголовка */
.logo-full {
  display: block;
  height: 56px;
  width: auto;
  max-width: min(420px, 55vw);
  object-fit: contain;
  object-position: left center;
}

.logo-box {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, var(--sky-700), var(--primary-color));
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.25);
}

.logo-text {
  color: #fff;
  font-weight: 700;
  font-size: 1.35rem;
  letter-spacing: 1px;
}

.portal-title {
  color: var(--sky-700);
  font-size: 1.35rem;
  font-weight: 700;
  margin: 0;
}

.portal-subtitle {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin: 2px 0 0;
}

.user-info {
  text-align: right;
  font-size: 0.875rem;
}

.user-greet {
  margin: 0;
}

.user-name {
  font-weight: 600;
  color: var(--text-dark);
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
  color: var(--sky-700);
  background: rgba(59, 157, 217, 0.1);
  border: 1px solid rgba(59, 157, 217, 0.25);
  border-radius: 6px;
}

.btn-admin:hover {
  background: rgba(59, 157, 217, 0.18);
}

.btn-logout {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 12px;
  border-radius: 6px;
  color: var(--sky-700);
  background: #fff;
  border: 1px solid rgba(59, 157, 217, 0.35);
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
}

.btn-logout:hover {
  background: var(--sky-50);
}

.etp-main-nav {
  background: rgba(255, 255, 255, 0.75);
  border-bottom: 1px solid var(--border-color);
}

.etp-nav-inner {
  display: flex;
  align-items: center;
  min-height: 48px;
}

.etp-nav-toggler {
  display: none;
  border: none;
  background: transparent;
  font-size: 1.25rem;
  cursor: pointer;
  color: var(--sky-700);
}

.etp-nav-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  list-style: none;
  margin: 0;
  padding: 8px 0;
}

.etp-nav-link {
  display: block;
  padding: 8px 14px;
  border-radius: 8px;
  color: var(--text-medium);
  font-size: 0.9rem;
  font-weight: 500;
}

.etp-nav-link:hover,
.etp-nav-link.router-link-active {
  background: rgba(59, 157, 217, 0.12);
  color: var(--sky-700);
}

.main-content {
  flex: 1;
  padding: 24px 0 40px;
}

.footer-wrapper {
  background: #fff;
  border-top: 1px solid var(--border-color);
  padding: 20px 0;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.footer-text {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.85rem;
}

.footer-links {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.footer-links a {
  color: var(--sky-700);
  font-size: 0.85rem;
}

@media (max-width: 768px) {
  .etp-nav-toggler {
    display: block;
  }

  .etp-nav-list {
    display: none;
    width: 100%;
    flex-direction: column;
  }

  .etp-nav-list.is-open {
    display: flex;
  }

  .header-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .logo-full {
    height: 44px;
    max-width: min(320px, 90vw);
  }

  .user-info {
    text-align: left;
    width: 100%;
  }

  .user-actions {
    justify-content: flex-start;
  }
}
</style>
