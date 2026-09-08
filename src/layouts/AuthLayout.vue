<script setup>
/**
 * Полноэкранный layout авторизации в стиле Metronic (flows/basic/sign-in).
 * Без шапки витрины — форма по центру на весь экран.
 */
</script>

<template>
  <div class="d-flex flex-column flex-root auth-root">
    <div
      class="d-flex flex-column flex-column-fluid bgi-position-y-bottom position-x-center bgi-no-repeat bgi-size-contain bgi-attachment-fixed auth-bg"
    >
      <div class="d-flex flex-center flex-column flex-column-fluid p-10 pb-lg-20">
        <router-link :to="{ name: 'home' }" class="mb-12">
          <img
            alt="ЭТП"
            src="/metronic/media/logos/logo-2-dark.svg"
            class="h-45px"
          />
        </router-link>
        <div class="w-lg-700px bg-white rounded shadow-sm p-10 p-lg-15 mx-auto auth-card">
          <slot />
        </div>
      </div>
      <div class="d-flex flex-center flex-column-auto p-10">
        <div class="d-flex align-items-center fw-bold fs-6">
          <router-link :to="{ name: 'home' }" class="text-muted text-hover-primary px-2">
            На витрину
          </router-link>
          <router-link :to="{ name: 'cms.show', params: { slug: 'contacts' } }" class="text-muted text-hover-primary px-2">
            Контакты
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-root {
  min-height: 100vh;
}

.auth-bg {
  min-height: 100vh;
  background-image: url('/metronic/media/illustrations/progress.svg');
  background-size: 100% 50%;
}

.auth-card {
  width: 100%;
  max-width: 700px;
}
</style>
