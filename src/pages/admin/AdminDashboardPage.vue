<script setup>
/**
 * Дашборд админки (F0-заглушка; CRUD — фаза F3).
 */
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
</script>

<template>
  <div class="etp-card">
    <h1>Админка</h1>
    <p>
      Роли:
      <el-tag
        v-for="role in auth.roles"
        :key="role"
        style="margin-right: 0.35rem"
      >
        {{ role }}
      </el-tag>
    </p>
    <p>
      Пользователи, ТЗП, ставки, отчёты — фаза F3. Аудитор — F4.
    </p>
  </div>
</template>
