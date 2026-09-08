<script setup>
/**
 * Обзор кабинета участника.
 */
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
</script>

<template>
  <div class="etp-card">
    <h1>Кабинет участника</h1>
    <p>
      Здравствуйте{{ auth.user?.profile?.name ? `, ${auth.user.profile.name}` : '' }}.
      Здесь профиль, подписки, КП (коммерческие предложения) и аукционы.
    </p>
    <el-space wrap>
      <el-button type="primary" @click="$router.push({ name: 'cabinet.profile' })">Профиль</el-button>
      <el-button @click="$router.push({ name: 'cabinet.subscriptions' })">Подписки</el-button>
      <el-button @click="$router.push({ name: 'cabinet.notifications' })">Уведомления</el-button>
      <el-button @click="$router.push({ name: 'cabinet.proposals' })">Мои КП</el-button>
      <el-button @click="$router.push({ name: 'procedures.index' })">К процедурам</el-button>
    </el-space>
  </div>
</template>
