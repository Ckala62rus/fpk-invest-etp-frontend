<script setup>
/**
 * Страница 404.
 */
</script>

<template>
  <div class="etp-page">
    <div class="etp-card">
      <h1>Страница не найдена</h1>
      <el-button type="primary" @click="$router.push({ name: 'home' })">
        На главную
      </el-button>
    </div>
  </div>
</template>
