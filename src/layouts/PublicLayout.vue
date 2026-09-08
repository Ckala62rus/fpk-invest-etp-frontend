<script setup>
/**
 * Публичный layout в стиле Metronic header (горизонтальное меню витрины).
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
  <div class="d-flex flex-column flex-root public-root">
    <div class="page d-flex flex-row flex-column-fluid">
      <div class="wrapper d-flex flex-column flex-row-fluid w-100">
        <div id="kt_header" class="header align-items-stretch border-0">
          <div class="container-xxl d-flex align-items-stretch justify-content-between">
            <div class="d-flex align-items-center flex-grow-1 flex-lg-grow-0 me-lg-15">
              <router-link :to="{ name: 'home' }" class="d-flex align-items-center">
                <img
                  alt="ЭТП"
                  src="/metronic/media/logos/logo-2.svg"
                  class="h-25px h-lg-30px"
                />
                <span class="text-white fw-bolder fs-4 ms-3 d-none d-md-inline">
                  ЭТП ФПК «Инвест»
                </span>
              </router-link>
            </div>

            <div class="d-flex align-items-stretch justify-content-between flex-lg-grow-1">
              <div class="d-flex align-items-stretch" :class="{ 'mobile-nav-open': mobileOpen }">
                <nav class="header-menu align-items-stretch">
                  <div class="menu menu-lg-rounded menu-column menu-lg-row menu-state-bg menu-title-gray-700 menu-state-title-primary fw-bold my-5 my-lg-0 align-items-stretch">
                    <div class="menu-item me-lg-1">
                      <router-link
                        class="menu-link py-3"
                        :to="{ name: 'home' }"
                        @click="mobileOpen = false"
                      >
                        <span class="menu-title">Главная</span>
                      </router-link>
                    </div>
                    <div class="menu-item me-lg-1">
                      <router-link
                        class="menu-link py-3"
                        :to="{ name: 'procedures.index' }"
                        @click="mobileOpen = false"
                      >
                        <span class="menu-title">Процедуры</span>
                      </router-link>
                    </div>
                    <div
                      v-for="page in cmsLinks"
                      :key="page.slug"
                      class="menu-item me-lg-1"
                    >
                      <router-link
                        class="menu-link py-3"
                        :to="{ name: 'cms.show', params: { slug: page.slug } }"
                        @click="mobileOpen = false"
                      >
                        <span class="menu-title">{{ page.title }}</span>
                      </router-link>
                    </div>
                    <div class="menu-item me-lg-1">
                      <router-link
                        class="menu-link py-3"
                        :to="{ name: 'complaint' }"
                        @click="mobileOpen = false"
                      >
                        <span class="menu-title">Жалоба</span>
                      </router-link>
                    </div>
                  </div>
                </nav>
              </div>

              <div class="d-flex align-items-stretch flex-shrink-0">
                <div class="d-flex align-items-center ms-1 ms-lg-3">
                  <button
                    type="button"
                    class="btn btn-icon btn-active-light-primary d-lg-none"
                    @click="mobileOpen = !mobileOpen"
                  >
                    <span class="svg-icon svg-icon-1">☰</span>
                  </button>
                </div>
                <div class="d-flex align-items-center ms-1 ms-lg-3">
                  <template v-if="!auth.isAuth">
                    <router-link
                      :to="{ name: 'login' }"
                      class="btn btn-sm btn-light-primary fw-bolder me-2"
                    >
                      Вход
                    </router-link>
                    <router-link
                      :to="{ name: 'register' }"
                      class="btn btn-sm btn-primary fw-bolder"
                    >
                      Регистрация
                    </router-link>
                  </template>
                  <template v-else>
                    <span class="text-gray-600 fw-bold me-3 d-none d-md-inline">
                      {{ displayName }}
                    </span>
                    <router-link
                      :to="cabinetTarget"
                      class="btn btn-sm btn-light-primary fw-bolder me-2"
                    >
                      Кабинет
                    </router-link>
                    <button
                      type="button"
                      class="btn btn-sm btn-light-danger fw-bolder"
                      @click="onLogout"
                    >
                      Выход
                    </button>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="content d-flex flex-column flex-column-fluid">
          <div class="container-xxl py-5">
            <slot />
          </div>
        </div>

        <div class="footer py-4 d-flex flex-lg-column">
          <div class="container-xxl d-flex flex-column flex-md-row align-items-center justify-content-between">
            <div class="text-dark order-2 order-md-1">
              <span class="text-muted fw-bold me-1">©</span>
              <span class="text-gray-800 text-hover-primary">ЭТП ФПК «Инвест»</span>
            </div>
            <ul class="menu menu-gray-600 menu-hover-primary fw-bold order-1">
              <li class="menu-item">
                <router-link :to="{ name: 'corruption' }" class="menu-link px-2">
                  Антикоррупция
                </router-link>
              </li>
              <li class="menu-item">
                <router-link
                  :to="{ name: 'cms.show', params: { slug: 'contacts' } }"
                  class="menu-link px-2"
                >
                  Контакты
                </router-link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.public-root {
  min-height: 100vh;
  background: #f5f8fa;
}

#kt_header {
  background: #1e1e2d;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
}

.header-menu .menu-link {
  color: #9899ac !important;
}

.header-menu .menu-link.router-link-active,
.header-menu .menu-link:hover {
  color: #fff !important;
}

.footer {
  background: #fff;
  border-top: 1px solid #eff2f5;
}

@media (max-width: 991px) {
  .header-menu {
    display: none;
    position: absolute;
    top: 65px;
    left: 0;
    right: 0;
    background: #1e1e2d;
    z-index: 100;
    padding: 1rem;
  }

  .mobile-nav-open .header-menu {
    display: block;
  }
}
</style>
