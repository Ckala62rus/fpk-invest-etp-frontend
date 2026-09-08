<script setup>
/**
 * Обзор кабинета участника (F0-заглушка).
 */
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
</script>

<template>
  <div class="etp-card">
    <h1>Кабинет</h1>
    <p v-if="auth.user">
      Вы вошли как <strong>{{ auth.user.inn }}</strong>
      ({{ auth.user.email }}).
    </p>
    <p>Профиль, КП и аукцион — фазы F2.</p>
  </div>
</template>
