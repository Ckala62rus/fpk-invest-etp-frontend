<script setup>
/**
 * Справочник шаблонов доп. условий (super_admin).
 */
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import adminExtraConditionsApi from '@/api/modules/adminExtraConditions';

const TYPE_OPTIONS = [
    { value: 'text', label: 'Текст' },
    { value: 'number', label: 'Число' },
    { value: 'decimal', label: 'Десятичное' },
    { value: 'date', label: 'Дата' },
    { value: 'boolean', label: 'Да/Нет' },
    { value: 'select', label: 'Список' },
    { value: 'file', label: 'Файл' },
];

const loading = ref(false);
const items = ref([]);
const dialogVisible = ref(false);
const editingId = ref(null);
const saving = ref(false);
const form = reactive({
    name: '',
    field_type: 'text',
    is_active: true,
});

/**
 * @returns {Promise<void>}
 */
async function load() {
    loading.value = true;
    try {
        const { data } = await adminExtraConditionsApi.listTemplates();
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
    Object.assign(form, { name: '', field_type: 'text', is_active: true });
    dialogVisible.value = true;
}

/**
 * @param {Record<string, unknown>} row Шаблон
 * @returns {void}
 */
function openEdit(row) {
    editingId.value = row.id;
    Object.assign(form, {
        name: row.name,
        field_type: row.field_type,
        is_active: Boolean(row.is_active),
    });
    dialogVisible.value = true;
}

/**
 * @returns {Promise<void>}
 */
async function onSave() {
    if (!form.name.trim()) {
        ElMessage.warning('Укажите название');
        return;
    }
    saving.value = true;
    try {
        if (editingId.value) {
            await adminExtraConditionsApi.updateTemplate(editingId.value, { ...form });
        } else {
            await adminExtraConditionsApi.createTemplate({ ...form });
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
    await ElMessageBox.confirm('Деактивировать шаблон?', 'Подтверждение');
    try {
        await adminExtraConditionsApi.deleteTemplate(id);
        ElMessage.success('Деактивирован');
        await load();
    } catch (e) {
        if (e !== 'cancel') {
            ElMessage.error(e?.response?.data?.message || 'Ошибка');
        }
    }
}

onMounted(load);
</script>

<template>
  <div class="etp-card" v-loading="loading">
    <div class="head">
      <h1>Шаблоны доп. условий</h1>
      <el-button type="primary" @click="openCreate">Добавить</el-button>
    </div>
    <el-table :data="items" stripe>
      <el-table-column prop="name" label="Название" min-width="200" />
      <el-table-column label="Тип" width="140">
        <template #default="{ row }">{{ row.field_type_label || row.field_type }}</template>
      </el-table-column>
      <el-table-column label="Активен" width="100">
        <template #default="{ row }">
          <el-tag :type="row.is_active ? 'success' : 'info'" size="small">
            {{ row.is_active ? 'да' : 'нет' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="" width="160">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">Изменить</el-button>
          <el-button link type="danger" @click="onDelete(row.id)">Выкл.</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="editingId ? 'Изменить' : 'Новый шаблон'" width="480px">
      <el-form label-position="top">
        <el-form-item label="Название">
          <el-input v-model="form.name" />
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
        <el-form-item label="Активен">
          <el-switch v-model="form.is_active" />
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
  margin-bottom: 1rem;
}
</style>
