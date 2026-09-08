<script setup>
/**
 * Шаблоны отчётов: CRUD (super_admin), запуск и история (admin роли).
 */
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import adminReportsApi from '@/api/modules/adminReports';
import { ROLES } from '@/constants/roles';
import { useAuthStore } from '@/stores/auth';
import { formatDateTime } from '@/helpers/format';

const auth = useAuthStore();
const isSuper = computed(() => auth.hasRole(ROLES.SUPER_ADMIN));

const loading = ref(false);
const items = ref([]);
const runs = ref([]);
const selectedId = ref(null);

const dialogVisible = ref(false);
const editingId = ref(null);
const saving = ref(false);
const form = reactive({
    name: '',
    source: 'procedures',
    columnsText: 'id,number,title,status',
});

const runForm = reactive({
    format: 'xlsx',
    date_from: '',
    date_to: '',
    status: '',
});
const running = ref(false);

/**
 * @returns {Promise<void>}
 */
async function load() {
    loading.value = true;
    try {
        const { data } = await adminReportsApi.listTemplates();
        items.value = Array.isArray(data.data) ? data.data : [];
    } catch (e) {
        ElMessage.error(e?.response?.data?.message || 'Ошибка загрузки');
    } finally {
        loading.value = false;
    }
}

/**
 * @returns {void}
 */
function openCreate() {
    editingId.value = null;
    form.name = '';
    form.source = 'procedures';
    form.columnsText = 'id,number,title,status';
    dialogVisible.value = true;
}

/**
 * @param {Record<string, unknown>} row Шаблон
 * @returns {void}
 */
function openEdit(row) {
    editingId.value = row.id;
    form.name = row.name;
    form.source = row.query_config?.source || 'procedures';
    form.columnsText = Array.isArray(row.columns) ? row.columns.join(',') : '';
    dialogVisible.value = true;
}

/**
 * @returns {Promise<void>}
 */
async function onSave() {
    const columns = form.columnsText.split(',').map((s) => s.trim()).filter(Boolean);
    const payload = {
        name: form.name,
        query_config: { source: form.source },
        columns,
    };
    saving.value = true;
    try {
        if (editingId.value) {
            await adminReportsApi.updateTemplate(editingId.value, payload);
        } else {
            await adminReportsApi.createTemplate(payload);
        }
        dialogVisible.value = false;
        ElMessage.success('Сохранено');
        await load();
    } catch (e) {
        ElMessage.error(e?.response?.data?.message || 'Ошибка');
    } finally {
        saving.value = false;
    }
}

/**
 * @param {number} id ID
 * @returns {Promise<void>}
 */
async function onDelete(id) {
    await ElMessageBox.confirm('Удалить шаблон?', 'Подтверждение');
    try {
        await adminReportsApi.deleteTemplate(id);
        ElMessage.success('Удалено');
        if (selectedId.value === id) {
            selectedId.value = null;
            runs.value = [];
        }
        await load();
    } catch (e) {
        if (e !== 'cancel') {
            ElMessage.error(e?.response?.data?.message || 'Ошибка');
        }
    }
}

/**
 * @param {number} id ID шаблона
 * @returns {Promise<void>}
 */
async function selectTemplate(id) {
    selectedId.value = id;
    try {
        const { data } = await adminReportsApi.listRuns(id);
        runs.value = Array.isArray(data.data) ? data.data : [];
    } catch (e) {
        ElMessage.error(e?.response?.data?.message || 'Ошибка истории');
        runs.value = [];
    }
}

/**
 * @returns {Promise<void>}
 */
async function onRun() {
    if (!selectedId.value) {
        ElMessage.warning('Выберите шаблон');
        return;
    }
    running.value = true;
    try {
        await adminReportsApi.run(selectedId.value, {
            format: runForm.format,
            filters: {
                date_from: runForm.date_from || undefined,
                date_to: runForm.date_to || undefined,
                status: runForm.status || undefined,
            },
        });
        ElMessage.success('Отчёт в очереди');
        await selectTemplate(selectedId.value);
    } catch (e) {
        ElMessage.error(e?.response?.data?.message || 'Ошибка запуска');
    } finally {
        running.value = false;
    }
}

/**
 * @param {number} runId ID запуска
 * @returns {Promise<void>}
 */
async function onDownload(runId) {
    try {
        const { data } = await adminReportsApi.downloadRun(runId);
        const blob = new Blob([data]);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report-${runId}`;
        a.click();
        URL.revokeObjectURL(url);
    } catch (e) {
        ElMessage.error(e?.response?.data?.message || 'Файл ещё не готов');
    }
}

onMounted(load);
</script>

<template>
  <div class="etp-card" v-loading="loading">
    <div class="head">
      <h1>Отчёты</h1>
      <el-button v-if="isSuper" type="primary" @click="openCreate">Создать шаблон</el-button>
    </div>

    <el-table :data="items" stripe highlight-current-row @current-change="(row) => row && selectTemplate(row.id)">
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="name" label="Название" min-width="180" />
      <el-table-column label="Источник" width="140">
        <template #default="{ row }">{{ row.query_config?.source }}</template>
      </el-table-column>
      <el-table-column v-if="isSuper" label="" width="160">
        <template #default="{ row }">
          <el-button link type="primary" @click.stop="openEdit(row)">Изменить</el-button>
          <el-button link type="danger" @click.stop="onDelete(row.id)">Удалить</el-button>
        </template>
      </el-table-column>
    </el-table>

    <template v-if="selectedId">
      <h2>Запуск шаблона #{{ selectedId }}</h2>
      <el-form inline class="mb">
        <el-form-item label="Формат">
          <el-select v-model="runForm.format" style="width: 120px">
            <el-option label="xlsx" value="xlsx" />
            <el-option label="pdf" value="pdf" />
            <el-option label="doc" value="doc" />
          </el-select>
        </el-form-item>
        <el-form-item label="С">
          <el-date-picker v-model="runForm.date_from" type="date" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="По">
          <el-date-picker v-model="runForm.date_to" type="date" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-button type="primary" :loading="running" @click="onRun">Сформировать</el-button>
      </el-form>

      <el-table :data="runs" size="small" empty-text="Нет запусков">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="format" label="Формат" width="90" />
        <el-table-column label="Файл" width="100">
          <template #default="{ row }">{{ row.file_path ? 'есть' : '—' }}</template>
        </el-table-column>
        <el-table-column label="Когда" width="160">
          <template #default="{ row }">{{ formatDateTime(row.generated_at) }}</template>
        </el-table-column>
        <el-table-column label="" width="120">
          <template #default="{ row }">
            <el-button
              v-if="row.file_path"
              link
              type="primary"
              @click="onDownload(row.id)"
            >
              Скачать
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </template>

    <el-dialog v-model="dialogVisible" :title="editingId ? 'Шаблон' : 'Новый шаблон'" width="560px">
      <el-form label-position="top">
        <el-form-item label="Название" required>
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="Источник" required>
          <el-select v-model="form.source" style="width: 100%">
            <el-option label="procedures" value="procedures" />
            <el-option label="auction_bids" value="auction_bids" />
          </el-select>
        </el-form-item>
        <el-form-item label="Колонки (через запятую)" required>
          <el-input v-model="form.columnsText" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">Отмена</el-button>
        <el-button type="primary" :loading="saving" @click="onSave">Сохранить</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

h2 {
  font-size: 1.05rem;
  margin-top: 1.5rem;
}

.mb {
  margin: 0.75rem 0;
}
</style>
