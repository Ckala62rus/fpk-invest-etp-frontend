<script setup>
/**
 * CRUD лотов ТЗП в админке.
 */
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import adminProcedureExtrasApi from '@/api/modules/adminProcedureExtras';
import { ROLES } from '@/constants/roles';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const procedureId = computed(() => route.params.id);
const canWrite = computed(() => auth.hasRole([ROLES.SUPER_ADMIN, ROLES.TRADE_ADMIN]));

const loading = ref(false);
const items = ref([]);
const dialogVisible = ref(false);
const editingId = ref(null);
const saving = ref(false);

const form = reactive({
    name: '',
    unit: '',
    quantity: null,
    start_price: 0,
    bid_step: 1,
    sort_order: 0,
});

/**
 * @returns {Promise<void>}
 */
async function load() {
    loading.value = true;
    try {
        const { data } = await adminProcedureExtrasApi.listLots(procedureId.value);
        items.value = Array.isArray(data.data) ? data.data : [];
    } catch (e) {
        ElMessage.error(e?.response?.data?.message || 'Ошибка загрузки лотов');
    } finally {
        loading.value = false;
    }
}

/**
 * @returns {void}
 */
function openCreate() {
    editingId.value = null;
    Object.assign(form, {
        name: '',
        unit: '',
        quantity: null,
        start_price: 0,
        bid_step: 1,
        sort_order: items.value.length,
    });
    dialogVisible.value = true;
}

/**
 * @param {Record<string, unknown>} row Лот
 * @returns {void}
 */
function openEdit(row) {
    editingId.value = row.id;
    Object.assign(form, {
        name: row.name,
        unit: row.unit || '',
        quantity: row.quantity,
        start_price: Number(row.start_price) || 0,
        bid_step: Number(row.bid_step) || 1,
        sort_order: row.sort_order ?? 0,
    });
    dialogVisible.value = true;
}

/**
 * @returns {Promise<void>}
 */
async function onSave() {
    saving.value = true;
    try {
        const payload = { ...form };
        if (editingId.value) {
            await adminProcedureExtrasApi.updateLot(procedureId.value, editingId.value, payload);
        } else {
            await adminProcedureExtrasApi.createLot(procedureId.value, payload);
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
 * @param {number} id ID лота
 * @returns {Promise<void>}
 */
async function onDelete(id) {
    await ElMessageBox.confirm('Удалить лот?', 'Подтверждение');
    try {
        await adminProcedureExtrasApi.deleteLot(procedureId.value, id);
        ElMessage.success('Удалено');
        await load();
    } catch (e) {
        if (e !== 'cancel') {
            ElMessage.error(e?.response?.data?.message || 'Ошибка');
        }
    }
}

onMounted(load);
watch(procedureId, load);
</script>

<template>
  <div class="etp-card" v-loading="loading">
    <el-button link type="primary" @click="router.push({ name: 'admin.procedures.show', params: { id: procedureId } })">
      ← К процедуре
    </el-button>
    <div class="head">
      <h1>Лоты процедуры #{{ procedureId }}</h1>
      <el-button v-if="canWrite" type="primary" @click="openCreate">Добавить лот</el-button>
    </div>

    <el-table :data="items" stripe>
      <el-table-column prop="sort_order" label="#" width="60" />
      <el-table-column prop="name" label="Название" min-width="180" />
      <el-table-column prop="unit" label="Ед." width="80" />
      <el-table-column prop="quantity" label="Кол-во" width="90" />
      <el-table-column prop="start_price" label="Старт" width="100" />
      <el-table-column prop="bid_step" label="Шаг" width="90" />
      <el-table-column prop="current_price" label="Текущая" width="100" />
      <el-table-column v-if="canWrite" label="" width="160">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">Изменить</el-button>
          <el-button link type="danger" @click="onDelete(row.id)">Удалить</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="editingId ? 'Лот' : 'Новый лот'" width="520px">
      <el-form label-position="top">
        <el-form-item label="Название" required>
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="Ед. изм.">
          <el-input v-model="form.unit" />
        </el-form-item>
        <el-form-item label="Количество">
          <el-input-number v-model="form.quantity" :min="0" />
        </el-form-item>
        <el-form-item label="Начальная цена" required>
          <el-input-number v-model="form.start_price" :min="0" :step="1000" />
        </el-form-item>
        <el-form-item label="Шаг ставки" required>
          <el-input-number v-model="form.bid_step" :min="0.01" :step="100" />
        </el-form-item>
        <el-form-item label="Порядок">
          <el-input-number v-model="form.sort_order" :min="0" />
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
</style>
