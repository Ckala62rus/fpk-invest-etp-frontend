<script setup>
/**
 * Главная публичная страница: превью открытых ТЗП + быстрые ссылки.
 */
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import proceduresApi from '@/api/modules/procedures';
import { formatDateTime } from '@/helpers/format';

const router = useRouter();

const loading = ref(false);
const preview = ref([]);
const loadError = ref('');

/**
 * Загружает первые процедуры для витрины на главной.
 * @returns {Promise<void>}
 */
async function loadPreview() {
    loading.value = true;
    loadError.value = '';
    try {
        const { data } = await proceduresApi.list({ per_page: 5, page: 1 });
        preview.value = Array.isArray(data.data) ? data.data : [];
    } catch (e) {
        loadError.value = e?.response?.data?.message || e?.message || 'API недоступен';
        preview.value = [];
    } finally {
        loading.value = false;
    }
}

onMounted(loadPreview);
</script>

<template>
  <div class="etp-page">
    <div class="etp-card">
      <h1>Электронная торговая площадка</h1>
      <p class="lead">
        Открытые ТЗП (торгово-закупочные процедуры) ФПК «Инвест». Участие — после регистрации и одобрения.
      </p>

      <div class="home-actions">
        <el-button type="primary" @click="router.push({ name: 'procedures.index' })">
          Все процедуры
        </el-button>
        <el-button @click="router.push({ name: 'login' })">Войти</el-button>
        <el-button @click="router.push({ name: 'register' })">Регистрация</el-button>
        <el-button link type="primary" @click="router.push({ name: 'complaint' })">
          Жалоба
        </el-button>
        <el-button link type="warning" @click="router.push({ name: 'corruption' })">
          Антикоррупция
        </el-button>
      </div>

      <h2 class="section-title">Сейчас на площадке</h2>

      <el-alert
        v-if="loadError"
        type="error"
        :title="loadError"
        show-icon
        :closable="false"
        class="mb"
      />

      <el-skeleton v-else-if="loading" :rows="4" animated />

      <el-table
        v-else
        :data="preview"
        stripe
        empty-text="Нет опубликованных процедур"
        style="width: 100%"
        @row-click="(row) => router.push({ name: 'procedures.show', params: { id: row.id } })"
      >
        <el-table-column prop="number" label="Номер" width="130" />
        <el-table-column prop="title" label="Название" min-width="200" />
        <el-table-column label="Тип" width="150">
          <template #default="{ row }">{{ row.type_label || row.type }}</template>
        </el-table-column>
        <el-table-column label="Окончание" width="150">
          <template #default="{ row }">{{ formatDateTime(row.ends_at) }}</template>
        </el-table-column>
      </el-table>

      <div v-if="preview.length" class="more">
        <router-link :to="{ name: 'procedures.index' }">Смотреть все →</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lead {
  color: #4b5563;
  max-width: 40rem;
}

.home-actions {
  margin: 1.25rem 0;
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  align-items: center;
}

.section-title {
  font-size: 1.15rem;
  margin: 1.5rem 0 0.75rem;
}

.mb {
  margin-bottom: 1rem;
}

.more {
  margin-top: 0.75rem;
}

:deep(.el-table__row) {
  cursor: pointer;
}
</style>
