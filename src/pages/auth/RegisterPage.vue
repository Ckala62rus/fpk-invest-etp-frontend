<script setup>
/**
 * Заглушка регистрации на фазе F0 (полная форма — F1).
 */
</script>

<template>
  <div class="etp-page">
    <div class="etp-card" style="max-width: 480px">
      <h1>Регистрация</h1>
      <p>Полная форма регистрации участника появится в фазе F1.</p>
      <el-button type="primary" @click="$router.push({ name: 'login' })">К входу</el-button>
    </div>
  </div>
</template>
