<script setup>
/**
 * Журнал аудита: список, фильтры, экспорт CSV.
 */
import { onMounted, reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { View } from '@element-plus/icons-vue';
import adminActivityApi from '@/api/modules/adminActivity';
import { formatDateTime } from '@/helpers/format';
import EtpIconButton from '@/components/ui/EtpIconButton.vue';

const loading = ref(false);
const items = ref([]);
const detail = ref(null);
const detailVisible = ref(false);

const filters = reactive({
    log_name: '',
    event: '',
    causer_id: null,
    date_from: '',
    date_to: '',
});
const pagination = reactive({ page: 1, perPage: 20, total: 0 });

/**
 * @returns {Record<string, unknown>}
 */
function queryParams() {
    return {
        log_name: filters.log_name || undefined,
        event: filters.event || undefined,
        causer_id: filters.causer_id || undefined,
        date_from: filters.date_from || undefined,
        date_to: filters.date_to || undefined,
        page: pagination.page,
        per_page: pagination.perPage,
    };
}

/**
 * @returns {Promise<void>}
 */
async function load() {
    loading.value = true;
    try {
        const { data } = await adminActivityApi.list(queryParams());
        items.value = Array.isArray(data.data) ? data.data : [];
        pagination.total = Number(data.meta?.total ?? items.value.length);
    } catch (e) {
        ElMessage.error(e?.response?.data?.message || 'Не удалось загрузить журнал');
    } finally {
        loading.value = false;
    }
}

/**
 * @returns {void}
 */
function onFilter() {
    pagination.page = 1;
    load();
}

/**
 * @param {number} id ID записи
 * @returns {Promise<void>}
 */
async function openDetail(id) {
    try {
        const { data } = await adminActivityApi.show(id);
        detail.value = data.data ?? null;
        detailVisible.value = true;
    } catch (e) {
        ElMessage.error(e?.response?.data?.message || 'Не найдено');
    }
}

/**
 * @returns {Promise<void>}
 */
async function onExport() {
    try {
        const { data } = await adminActivityApi.exportCsv({
            log_name: filters.log_name || undefined,
            event: filters.event || undefined,
            causer_id: filters.causer_id || undefined,
            date_from: filters.date_from || undefined,
            date_to: filters.date_to || undefined,
        });
        const blob = new Blob([data], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'activity-log.csv';
        a.click();
        URL.revokeObjectURL(url);
        ElMessage.success('CSV скачан');
    } catch (e) {
        ElMessage.error(e?.response?.data?.message || 'Ошибка экспорта');
    }
}

onMounted(load);
watch(() => pagination.page, load);
</script>

<template>
  <div class="etp-card" v-loading="loading">
    <div class="head">
      <h1>Журнал аудита</h1>
      <el-button @click="onExport">Экспорт CSV</el-button>
    </div>

    <el-form inline @submit.prevent="onFilter">
      <el-form-item label="Канал">
        <el-input v-model="filters.log_name" clearable style="width: 140px" />
      </el-form-item>
      <el-form-item label="Событие">
        <el-input v-model="filters.event" clearable style="width: 140px" />
      </el-form-item>
      <el-form-item label="Causer ID">
        <el-input-number v-model="filters.causer_id" :min="1" controls-position="right" />
      </el-form-item>
      <el-form-item label="С">
        <el-date-picker v-model="filters.date_from" type="date" value-format="YYYY-MM-DD" />
      </el-form-item>
      <el-form-item label="По">
        <el-date-picker v-model="filters.date_to" type="date" value-format="YYYY-MM-DD" />
      </el-form-item>
      <el-button type="primary" @click="onFilter">Найти</el-button>
    </el-form>

    <el-table :data="items" stripe>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="log_name" label="Канал" width="120" />
      <el-table-column prop="event" label="Событие" width="120" />
      <el-table-column prop="description" label="Описание" min-width="220" />
      <el-table-column label="Кто" width="100">
        <template #default="{ row }">{{ row.causer_id || '—' }}</template>
      </el-table-column>
      <el-table-column label="Когда" width="150">
        <template #default="{ row }">{{ formatDateTime(row.created_at) }}</template>
      </el-table-column>
      <el-table-column label="" width="70">
        <template #default="{ row }">
          <div class="etp-table-actions">
            <EtpIconButton title="Детали" @click="openDetail(row.id)">
              <View />
            </EtpIconButton>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <div class="pager">
      <el-pagination
        v-model:current-page="pagination.page"
        :page-size="pagination.perPage"
        :total="pagination.total"
        layout="prev, pager, next, total"
        background
      />
    </div>

    <el-dialog v-model="detailVisible" title="Запись аудита" width="640px">
      <pre v-if="detail" class="json">{{ JSON.stringify(detail, null, 2) }}</pre>
    </el-dialog>
  </div>
</template>

<style scoped>
.head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.pager {
  margin-top: 1rem;
  display: flex;
  justify-content: flex-end;
}

.json {
  font-size: 0.8rem;
  white-space: pre-wrap;
  max-height: 60vh;
  overflow: auto;
}
</style>
