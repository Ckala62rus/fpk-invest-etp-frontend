<script setup>
/**
 * Дашборд админки: ссылки на разделы F3/F4 и Horizon.
 */
import { useAuthStore } from '@/stores/auth';
import { ROLES } from '@/constants/roles';

const auth = useAuthStore();
const horizonUrl = import.meta.env.VITE_HORIZON_URL || 'http://localhost:8200/horizon';
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
      <el-button
        v-if="auth.hasRole(ROLES.SUPER_ADMIN)"
        tag="a"
        :href="horizonUrl"
        target="_blank"
        rel="noopener noreferrer"
      >
        Horizon
      </el-button>
    </el-space>

    <p class="hint">
      На карточке ТЗП: лоты, настраиваемые поля, внешние приглашения, согласование правок (F4), аукцион.
    </p>
  </div>
</template>

<style scoped>
.hint {
  margin-top: 1.25rem;
  color: #6b7280;
}
</style>
