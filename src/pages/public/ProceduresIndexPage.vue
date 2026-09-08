<script setup>
/**
 * Публичный список ТЗП (торгово-закупочных процедур) на витрине.
 */
import { onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import proceduresApi from '@/api/modules/procedures';
import { PROCEDURE_TYPES, PUBLIC_PROCEDURE_STATUSES } from '@/constants/procedure';
import { formatDateTime } from '@/helpers/format';

const router = useRouter();

const loading = ref(false);
const items = ref([]);
const errorMessage = ref('');

/** Фильтры query → API */
const filters = reactive({
    search: '',
    type: '',
    status: '',
});

const pagination = reactive({
    page: 1,
    perPage: 15,
    total: 0,
});

/**
 * Загружает страницу списка с текущими фильтрами.
 * @returns {Promise<void>}
 */
async function loadList() {
    loading.value = true;
    errorMessage.value = '';
    try {
        const { data } = await proceduresApi.list({
            search: filters.search || undefined,
            type: filters.type || undefined,
            status: filters.status || undefined,
            page: pagination.page,
            per_page: pagination.perPage,
        });
        items.value = Array.isArray(data.data) ? data.data : [];
        pagination.total = Number(data.meta?.total ?? items.value.length);
    } catch (e) {
        errorMessage.value = e?.response?.data?.message || e?.message || 'Не удалось загрузить список';
        items.value = [];
    } finally {
        loading.value = false;
    }
}

/**
 * Сброс на первую страницу при смене фильтров.
 * @returns {void}
 */
function onFilterChange() {
    pagination.page = 1;
    loadList();
}

/**
 * Переход на карточку процедуры.
 * @param {number} id ID ТЗП
 * @returns {void}
 */
function openProcedure(id) {
    router.push({ name: 'procedures.show', params: { id } });
}

onMounted(loadList);

watch(() => pagination.page, loadList);
</script>

<template>
  <div class="etp-page">
    <div class="etp-card">
      <h1>Торгово-закупочные процедуры</h1>
      <p class="muted">Открытые процедуры площадки. Контакты заказчика скрыты.</p>

      <el-form class="filters" inline @submit.prevent="onFilterChange">
        <el-form-item label="Поиск">
          <el-input
            v-model="filters.search"
            clearable
            placeholder="Номер или название"
            style="width: 220px"
            @clear="onFilterChange"
          />
        </el-form-item>
        <el-form-item label="Тип">
          <el-select
            v-model="filters.type"
            clearable
            placeholder="Все"
            style="width: 200px"
            @change="onFilterChange"
          >
            <el-option
              v-for="t in PROCEDURE_TYPES"
              :key="t.value"
              :label="t.label"
              :value="t.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="Статус">
          <el-select
            v-model="filters.status"
            clearable
            placeholder="Все"
            style="width: 180px"
            @change="onFilterChange"
          >
            <el-option
              v-for="s in PUBLIC_PROCEDURE_STATUSES"
              :key="s.value"
              :label="s.label"
              :value="s.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onFilterChange">Найти</el-button>
        </el-form-item>
      </el-form>

      <el-alert
        v-if="errorMessage"
        type="error"
        :title="errorMessage"
        show-icon
        :closable="false"
        class="mb"
      />

      <el-table
        v-loading="loading"
        :data="items"
        stripe
        style="width: 100%"
        empty-text="Нет опубликованных процедур"
        @row-click="(row) => openProcedure(row.id)"
      >
        <el-table-column prop="number" label="Номер" width="140" />
        <el-table-column prop="title" label="Название" min-width="220" />
        <el-table-column label="Тип" width="160">
          <template #default="{ row }">{{ row.type_label || row.type }}</template>
        </el-table-column>
        <el-table-column label="Статус" width="140">
          <template #default="{ row }">
            <el-tag size="small">{{ row.status_label || row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Окончание" width="150">
          <template #default="{ row }">{{ formatDateTime(row.ends_at) }}</template>
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
    </div>
  </div>
</template>

<style scoped>
.muted {
  color: #6b7280;
}

.filters {
  margin: 1rem 0;
}

.mb {
  margin-bottom: 1rem;
}

.pager {
  margin-top: 1rem;
  display: flex;
  justify-content: flex-end;
}

:deep(.el-table__row) {
  cursor: pointer;
}
</style>
