<script setup>
/**
 * Главная публичная страница (заглушка F0).
 */
import { onMounted, ref } from 'vue';
import systemApi from '@/api/modules/system';

const health = ref(null);
const healthError = ref('');

/**
 * Запрашивает health у API при монтировании.
 * @returns {Promise<void>}
 */
async function loadHealth() {
    try {
        const { data } = await systemApi.health();
        health.value = data;
    } catch (e) {
        healthError.value = e?.message || 'API недоступен';
    }
}

onMounted(loadHealth);
</script>

<template>
  <div class="etp-page">
    <div class="etp-card">
      <h1>Электронная торговая площадка</h1>
      <p>
        Публичная витрина ТЗП (торгово-закупочных процедур) будет на фазе F1.
        Сейчас — каркас SPA (фаза F0).
      </p>

      <el-alert
        v-if="healthError"
        type="error"
        :title="healthError"
        show-icon
        :closable="false"
      />

      <el-descriptions
        v-else-if="health"
        title="Связь с API"
        :column="1"
        border
        class="home-health"
      >
        <el-descriptions-item label="success">
          {{ health.success }}
        </el-descriptions-item>
        <el-descriptions-item label="database">
          {{ health.data?.database }}
        </el-descriptions-item>
        <el-descriptions-item label="redis">
          {{ health.data?.redis }}
        </el-descriptions-item>
        <el-descriptions-item label="queue">
          {{ health.data?.queue }}
        </el-descriptions-item>
      </el-descriptions>

      <div class="home-actions">
        <el-button type="primary" @click="$router.push({ name: 'login' })">
          Войти
        </el-button>
        <el-button @click="$router.push({ name: 'register' })">
          Регистрация
        </el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-health {
  margin-top: 1rem;
}

.home-actions {
  margin-top: 1.25rem;
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}
</style>
