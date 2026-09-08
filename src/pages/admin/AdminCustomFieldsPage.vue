<script setup>
/**
 * CRUD настраиваемых полей ТЗП (торгово-закупочной процедуры) в админке.
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

const SCOPE_OPTIONS = [
    { value: 'procedure', label: 'Поле процедуры' },
    { value: 'participant', label: 'Поле участника' },
    { value: 'lot', label: 'Поле лота' },
];

const TYPE_OPTIONS = [
    { value: 'text', label: 'Текст' },
    { value: 'number', label: 'Число' },
    { value: 'decimal', label: 'Десятичное число' },
    { value: 'date', label: 'Дата' },
    { value: 'boolean', label: 'Да/Нет' },
    { value: 'select', label: 'Выбор из списка' },
    { value: 'file', label: 'Файл' },
];

const loading = ref(false);
const items = ref([]);
const dialogVisible = ref(false);
const editingId = ref(null);
const saving = ref(false);

const form = reactive({
    scope: 'participant',
    label: '',
    field_type: 'text',
    optionsText: '',
    is_required: false,
    sort_order: 0,
});

/**
 * @returns {Promise<void>}
 */
async function load() {
    loading.value = true;
    try {
        const { data } = await adminProcedureExtrasApi.listCustomFields(procedureId.value);
        items.value = Array.isArray(data.data) ? data.data : [];
    } catch (e) {
        ElMessage.error(e?.response?.data?.message || 'Ошибка загрузки полей');
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
        scope: 'participant',
        label: '',
        field_type: 'text',
        optionsText: '',
        is_required: false,
        sort_order: items.value.length,
    });
    dialogVisible.value = true;
}

/**
 * @param {Record<string, unknown>} row Поле
 * @returns {void}
 */
function openEdit(row) {
    editingId.value = row.id;
    Object.assign(form, {
        scope: row.scope || 'participant',
        label: row.label || '',
        field_type: row.field_type || 'text',
        optionsText: Array.isArray(row.options) ? row.options.join('\n') : '',
        is_required: Boolean(row.is_required),
        sort_order: row.sort_order ?? 0,
    });
    dialogVisible.value = true;
}

/**
 * Собирает payload для API.
 * @returns {Record<string, unknown>}
 */
function buildPayload() {
    const payload = {
        scope: form.scope,
        label: form.label.trim(),
        field_type: form.field_type,
        is_required: form.is_required,
        sort_order: Number(form.sort_order) || 0,
    };

    if (form.field_type === 'select') {
        payload.options = form.optionsText
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean);
    } else {
        payload.options = null;
    }

    return payload;
}

/**
 * @returns {Promise<void>}
 */
async function onSave() {
    if (!form.label.trim()) {
        ElMessage.warning('Укажите подпись');
        return;
    }
    if (form.field_type === 'select') {
        const opts = form.optionsText.split('\n').map((s) => s.trim()).filter(Boolean);
        if (!opts.length) {
            ElMessage.warning('Для select укажите варианты (по одному в строке)');
            return;
        }
    }

    saving.value = true;
    try {
        const payload = buildPayload();
        if (editingId.value) {
            await adminProcedureExtrasApi.updateCustomField(
                procedureId.value,
                editingId.value,
                payload,
            );
        } else {
            await adminProcedureExtrasApi.createCustomField(procedureId.value, payload);
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
 * @param {number} id ID поля
 * @returns {Promise<void>}
 */
async function onDelete(id) {
    await ElMessageBox.confirm('Удалить поле?', 'Подтверждение');
    try {
        await adminProcedureExtrasApi.deleteCustomField(procedureId.value, id);
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
    <el-button
      link
      type="primary"
      @click="router.push({ name: 'admin.procedures.show', params: { id: procedureId } })"
    >
      ← К процедуре
    </el-button>

    <div class="head">
      <h1>Настраиваемые поля</h1>
      <el-button v-if="canWrite" type="primary" @click="openCreate">Добавить</el-button>
    </div>

    <el-table :data="items" stripe empty-text="Полей пока нет">
      <el-table-column prop="sort_order" label="#" width="60" />
      <el-table-column prop="label" label="Подпись" min-width="160" />
      <el-table-column label="Область" width="140">
        <template #default="{ row }">{{ row.scope_label || row.scope }}</template>
      </el-table-column>
      <el-table-column label="Тип" width="140">
        <template #default="{ row }">{{ row.field_type_label || row.field_type }}</template>
      </el-table-column>
      <el-table-column label="Обяз." width="80">
        <template #default="{ row }">
          <el-tag :type="row.is_required ? 'danger' : 'info'" size="small">
            {{ row.is_required ? 'да' : 'нет' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column v-if="canWrite" label="" width="160" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">Изменить</el-button>
          <el-button link type="danger" @click="onDelete(row.id)">Удалить</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? 'Изменить поле' : 'Новое поле'"
      width="520px"
    >
      <el-form label-position="top">
        <el-form-item label="Подпись">
          <el-input v-model="form.label" />
        </el-form-item>
        <el-form-item label="Область">
          <el-select v-model="form.scope" style="width: 100%">
            <el-option
              v-for="o in SCOPE_OPTIONS"
              :key="o.value"
              :label="o.label"
              :value="o.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="Тип">
          <el-select v-model="form.field_type" style="width: 100%">
            <el-option
              v-for="o in TYPE_OPTIONS"
              :key="o.value"
              :label="o.label"
              :value="o.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.field_type === 'select'" label="Варианты (по одному в строке)">
          <el-input v-model="form.optionsText" type="textarea" :rows="4" />
        </el-form-item>
        <el-form-item label="Обязательное">
          <el-switch v-model="form.is_required" />
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
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin: 0.75rem 0 1rem;
}
</style>
