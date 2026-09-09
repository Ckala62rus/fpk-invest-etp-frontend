<script setup>
/**
 * Админка: список ТЗП + создание черновика + публикация.
 */
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Delete, Edit, Upload, View } from '@element-plus/icons-vue';
import adminProceduresApi from '@/api/modules/adminProcedures';
import adminClassifierApi from '@/api/modules/adminClassifier';
import { PROCEDURE_TYPES } from '@/constants/procedure';
import { ROLES } from '@/constants/roles';
import { useAuthStore } from '@/stores/auth';
import { formatDateTime } from '@/helpers/format';
import EtpIconButton from '@/components/ui/EtpIconButton.vue';

const auth = useAuthStore();
const router = useRouter();

const canWrite = computed(() => auth.hasRole([ROLES.SUPER_ADMIN, ROLES.TRADE_ADMIN]));
const canDelete = computed(() => auth.hasRole(ROLES.SUPER_ADMIN));

const loading = ref(false);
const items = ref([]);
const companies = ref([]);
const categories = ref([]);
const filters = reactive({ search: '', type: '', status: '' });
const pagination = reactive({ page: 1, perPage: 15, total: 0 });

const createVisible = ref(false);
const creating = ref(false);
const form = reactive({
    type: 'request_for_proposal',
    title: '',
    description: '',
    company_id: null,
    classifier_category_id: null,
    visibility: 'open',
});

/**
 * Справочники для формы создания (может не хватить прав у auditor — тогда пусто).
 * @returns {Promise<void>}
 */
async function loadLookups() {
    try {
        const [co, cat] = await Promise.all([
            adminClassifierApi.listCompanies({ per_page: 100 }),
            adminClassifierApi.listCategories({ per_page: 100 }),
        ]);
        companies.value = Array.isArray(co.data.data) ? co.data.data : [];
        categories.value = Array.isArray(cat.data.data) ? cat.data.data : [];
    } catch {
        companies.value = [];
        categories.value = [];
    }
}

/**
 * @returns {Promise<void>}
 */
async function load() {
    loading.value = true;
    try {
        const { data } = await adminProceduresApi.list({
            search: filters.search || undefined,
            type: filters.type || undefined,
            status: filters.status || undefined,
            page: pagination.page,
            per_page: pagination.perPage,
        });
        items.value = Array.isArray(data.data) ? data.data : [];
        pagination.total = Number(data.meta?.total ?? items.value.length);
    } catch (e) {
        ElMessage.error(e?.response?.data?.message || 'Не удалось загрузить ТЗП');
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
 * @returns {Promise<void>}
 */
async function onCreate() {
    creating.value = true;
    try {
        const { data } = await adminProceduresApi.create({ ...form });
        createVisible.value = false;
        ElMessage.success('Черновик создан');
        const id = data.data?.id;
        if (id) {
            await router.push({ name: 'admin.procedures.show', params: { id } });
        } else {
            await load();
        }
    } catch (e) {
        ElMessage.error(e?.response?.data?.message || 'Ошибка создания');
    } finally {
        creating.value = false;
    }
}

/**
 * @param {number} id ID
 * @returns {Promise<void>}
 */
async function onPublish(id) {
    await ElMessageBox.confirm('Опубликовать процедуру?', 'Публикация');
    try {
        await adminProceduresApi.publish(id);
        ElMessage.success('Опубликовано');
        await load();
    } catch (e) {
        if (e !== 'cancel') {
            ElMessage.error(e?.response?.data?.message || 'Ошибка публикации');
        }
    }
}

/**
 * @param {number} id ID
 * @returns {Promise<void>}
 */
async function onDelete(id) {
    await ElMessageBox.confirm('Мягко удалить ТЗП?', 'Удаление');
    try {
        await adminProceduresApi.destroy(id);
        ElMessage.success('Удалено');
        await load();
    } catch (e) {
        if (e !== 'cancel') {
            ElMessage.error(e?.response?.data?.message || 'Ошибка удаления');
        }
    }
}

onMounted(async () => {
    await Promise.all([load(), loadLookups()]);
});
watch(() => pagination.page, load);
</script>

<template>
  <div class="etp-card" v-loading="loading">
    <div class="head">
      <h1>ТЗП (торгово-закупочные процедуры)</h1>
      <el-button v-if="canWrite" type="primary" @click="createVisible = true">Создать черновик</el-button>
    </div>

    <el-form inline @submit.prevent="onFilter">
      <el-form-item label="Поиск">
        <el-input v-model="filters.search" clearable />
      </el-form-item>
      <el-form-item label="Тип">
        <el-select v-model="filters.type" clearable style="width: 200px">
          <el-option v-for="t in PROCEDURE_TYPES" :key="t.value" :label="t.label" :value="t.value" />
        </el-select>
      </el-form-item>
      <el-button type="primary" @click="onFilter">Найти</el-button>
    </el-form>

    <el-table :data="items" stripe style="width: 100%">
      <el-table-column prop="number" label="Номер" width="130" />
      <el-table-column prop="title" label="Название" min-width="200" />
      <el-table-column label="Тип" width="140">
        <template #default="{ row }">{{ row.type_label || row.type }}</template>
      </el-table-column>
      <el-table-column label="Статус" width="140">
        <template #default="{ row }">{{ row.status_label || row.status }}</template>
      </el-table-column>
      <el-table-column label="Окончание" width="150">
        <template #default="{ row }">{{ formatDateTime(row.ends_at) }}</template>
      </el-table-column>
      <el-table-column label="" width="140" fixed="right">
        <template #default="{ row }">
          <div class="etp-table-actions">
            <EtpIconButton
              title="Открыть"
              @click="$router.push({ name: 'admin.procedures.show', params: { id: row.id } })"
            >
              <View />
            </EtpIconButton>
            <EtpIconButton
              v-if="canWrite && row.status === 'draft'"
              type="success"
              title="Опубликовать"
              @click="onPublish(row.id)"
            >
              <Upload />
            </EtpIconButton>
            <EtpIconButton
              v-if="canDelete"
              type="danger"
              title="Удалить"
              @click="onDelete(row.id)"
            >
              <Delete />
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

    <el-dialog v-model="createVisible" title="Новый черновик ТЗП" width="560px">
      <el-form label-position="top">
        <el-form-item label="Тип" required>
          <el-select v-model="form.type" style="width: 100%">
            <el-option v-for="t in PROCEDURE_TYPES" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="Название" required>
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="Описание">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="Заказчик" required>
          <el-select v-model="form.company_id" filterable style="width: 100%">
            <el-option v-for="c in companies" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="Категория" required>
          <el-select v-model="form.classifier_category_id" filterable style="width: 100%">
            <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-alert
          v-if="!companies.length || !categories.length"
          type="warning"
          :closable="false"
          title="Справочники пусты или недоступны (компании и категории создаёт главный администратор)."
        />
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">Отмена</el-button>
        <el-button type="primary" :loading="creating" @click="onCreate">Создать</el-button>
      </template>
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
</style>
