<script setup>
/**
 * Вопросы опроса качества закупки (super_admin).
 */
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Delete, Edit } from '@element-plus/icons-vue';
import adminSurveysApi from '@/api/modules/adminSurveys';
import EtpIconButton from '@/components/ui/EtpIconButton.vue';

const loading = ref(false);
const items = ref([]);
const dialogVisible = ref(false);
const editingId = ref(null);
const saving = ref(false);

const form = reactive({
    question: '',
    field_type: 'rating',
    is_required: true,
    sort_order: 0,
});

/**
 * @returns {Promise<void>}
 */
async function load() {
    loading.value = true;
    try {
        const { data } = await adminSurveysApi.list();
        items.value = Array.isArray(data.data) ? data.data : [];
    } catch (e) {
        ElMessage.error(e?.response?.data?.message || 'Нет доступа');
    } finally {
        loading.value = false;
    }
}

/**
 * @returns {void}
 */
function openCreate() {
    editingId.value = null;
    Object.assign(form, { question: '', field_type: 'rating', is_required: true, sort_order: 0 });
    dialogVisible.value = true;
}

/**
 * @param {Record<string, unknown>} row Вопрос
 * @returns {void}
 */
function openEdit(row) {
    editingId.value = row.id;
    Object.assign(form, {
        question: row.question,
        field_type: row.field_type,
        is_required: Boolean(row.is_required),
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
        if (editingId.value) {
            await adminSurveysApi.update(editingId.value, { ...form });
        } else {
            await adminSurveysApi.create({ ...form });
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
    await ElMessageBox.confirm('Удалить вопрос?', 'Подтверждение');
    try {
        await adminSurveysApi.destroy(id);
        ElMessage.success('Удалено');
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
      <h1>Опросы качества</h1>
      <el-button type="primary" @click="openCreate">Добавить вопрос</el-button>
    </div>

    <el-table :data="items" stripe>
      <el-table-column prop="sort_order" label="#" width="60" />
      <el-table-column prop="question" label="Вопрос" min-width="240" />
      <el-table-column prop="field_type" label="Тип" width="100" />
      <el-table-column label="Обяз." width="80">
        <template #default="{ row }">{{ row.is_required ? 'да' : 'нет' }}</template>
      </el-table-column>
      <el-table-column label="" width="160">
        <template #default="{ row }">
          <div class="etp-table-actions">
            <EtpIconButton title="Изменить" @click="openEdit(row)">
              <Edit />
            </EtpIconButton>
            <EtpIconButton type="danger" title="Удалить" @click="onDelete(row.id)">
              <Delete />
            </EtpIconButton>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="editingId ? 'Вопрос' : 'Новый вопрос'" width="520px">
      <el-form label-position="top">
        <el-form-item label="Текст" required>
          <el-input v-model="form.question" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="Тип" required>
          <el-select v-model="form.field_type" style="width: 100%">
            <el-option label="rating" value="rating" />
            <el-option label="text" value="text" />
            <el-option label="boolean" value="boolean" />
          </el-select>
        </el-form-item>
        <el-form-item label="Порядок">
          <el-input-number v-model="form.sort_order" :min="0" />
        </el-form-item>
        <el-switch v-model="form.is_required" active-text="Обязательный" />
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
