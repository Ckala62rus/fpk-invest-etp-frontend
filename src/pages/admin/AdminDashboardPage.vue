<script setup>
/**
 * Дашборд админки: ссылки на разделы F3/F4.
 */
import { useAuthStore } from '@/stores/auth';
import { ROLES } from '@/constants/roles';

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

    <el-space wrap>
      <el-button type="primary" @click="$router.push({ name: 'admin.users' })">Пользователи</el-button>
      <el-button v-if="auth.hasRole(ROLES.SUPER_ADMIN)" @click="$router.push({ name: 'admin.classifier' })">
        Классификатор
      </el-button>
      <el-button @click="$router.push({ name: 'admin.procedures' })">ТЗП</el-button>
      <el-button v-if="auth.hasRole(ROLES.SUPER_ADMIN)" @click="$router.push({ name: 'admin.cms' })">CMS</el-button>
      <el-button v-if="auth.hasRole(ROLES.SUPER_ADMIN)" @click="$router.push({ name: 'admin.notifications' })">
        Письма
      </el-button>
      <el-button v-if="auth.hasRole(ROLES.SUPER_ADMIN)" @click="$router.push({ name: 'admin.surveys' })">
        Опросы
      </el-button>
      <el-button @click="$router.push({ name: 'admin.reports' })">Отчёты</el-button>
      <el-button @click="$router.push({ name: 'admin.activity' })">Аудит</el-button>
    </el-space>

    <p class="hint">
      Согласование правок документации — на карточке ТЗП → «Согласование правок» (F4).
    </p>
  </div>
</template>

<style scoped>
.hint {
  margin-top: 1.25rem;
  color: #6b7280;
}
</style>
