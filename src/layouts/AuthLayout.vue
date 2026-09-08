<script setup>
/**
 * Полноэкранный AuthLayout в стиле Metronic flows/aside/sign-in (split-panel).
 * Левая брендовая панель + форма справа на весь экран.
 */
</script>

<template>
  <div class="d-flex flex-column flex-root auth-root">
    <div class="d-flex flex-column flex-lg-row flex-column-fluid auth-split">
      <div class="d-flex flex-column flex-lg-row-auto w-xl-600px auth-aside">
        <div class="d-flex flex-column text-center p-10 pt-lg-20">
          <router-link :to="{ name: 'home' }" class="py-9">
            <img
              alt="ЭТП"
              src="/metronic/media/logos/logo-3.svg"
              class="h-70px"
            />
          </router-link>
          <h1 class="fw-bolder fs-2qx pb-5 pb-md-10 auth-aside-title">
            ЭТП ФПК «Инвест»
          </h1>
          <p class="fw-bold fs-2 auth-aside-text">
            Электронная торговая площадка
            <br />
            закупки и аукционы холдинга
          </p>
        </div>
        <div class="d-flex flex-row-fluid auth-aside-illust min-h-100px min-h-lg-350px" />
      </div>

      <div class="d-flex flex-column flex-lg-row-fluid py-10">
        <div class="d-flex flex-center flex-column flex-column-fluid">
          <div class="w-lg-500px p-10 p-lg-15 mx-auto auth-card">
            <slot />
          </div>
        </div>
        <div class="d-flex flex-center flex-wrap fs-6 p-5 pb-0">
          <router-link :to="{ name: 'home' }" class="text-muted text-hover-primary px-2">
            На витрину
          </router-link>
          <router-link
            :to="{ name: 'cms.show', params: { slug: 'contacts' } }"
            class="text-muted text-hover-primary px-2"
          >
            Контакты
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-root,
.auth-split {
  min-height: 100vh;
}

.auth-aside {
  background-color: #f2c98a;
}

.auth-aside-title,
.auth-aside-text {
  color: #986923;
}

.auth-aside-illust {
  background-image: url('/metronic/media/illustrations/checkout.svg');
  background-repeat: no-repeat;
  background-position: center bottom;
  background-size: contain;
}

.auth-card {
  width: 100%;
  max-width: 560px;
}

@media (max-width: 991px) {
  .auth-aside {
    width: 100%;
  }

  .auth-aside-illust {
    min-height: 120px;
  }
}
</style>
