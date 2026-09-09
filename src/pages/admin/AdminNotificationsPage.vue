<script setup>
/**
 * Шаблоны email-уведомлений (super_admin).
 */
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Delete, Edit } from '@element-plus/icons-vue';
import adminNotificationsApi from '@/api/modules/adminNotifications';
import EtpIconButton from '@/components/ui/EtpIconButton.vue';

const loading = ref(false);
const items = ref([]);
const dialogVisible = ref(false);
const editingId = ref(null);
const saving = ref(false);

const form = reactive({
    code: '',
    name: '',
    subject: '',
    body_html: '',
    event_type: 'event',
    is_active: true,
});

/**
 * @returns {Promise<void>}
 */
async function load() {
    loading.value = true;
    try {
        const { data } = await adminNotificationsApi.list();
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
    Object.assign(form, {
        code: '',
        name: '',
        subject: '',
        body_html: '',
        event_type: 'event',
        is_active: true,
    });
    dialogVisible.value = true;
}

/**
 * @param {Record<string, unknown>} row Шаблон
 * @returns {void}
 */
function openEdit(row) {
    editingId.value = row.id;
    Object.assign(form, {
        code: row.code,
        name: row.name,
        subject: row.subject,
        body_html: row.body_html,
        event_type: row.event_type || 'event',
        is_active: Boolean(row.is_active),
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
            const { code, ...rest } = form;
            await adminNotificationsApi.update(editingId.value, rest);
        } else {
            await adminNotificationsApi.create({ ...form });
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
        await adminNotificationsApi.destroy(id);
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
      <h1>Шаблоны писем</h1>
      <el-button type="primary" @click="openCreate">Создать</el-button>
    </div>

    <el-table :data="items" stripe>
      <el-table-column prop="code" label="Код" width="160" />
      <el-table-column prop="name" label="Название" min-width="160" />
      <el-table-column prop="subject" label="Тема" min-width="180" />
      <el-table-column label="Тип" width="120">
        <template #default="{ row }">{{ row.event_type_label || row.event_type }}</template>
      </el-table-column>
      <el-table-column label="Активен" width="90">
        <template #default="{ row }">{{ row.is_active ? 'да' : 'нет' }}</template>
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

    <el-dialog v-model="dialogVisible" :title="editingId ? 'Редактирование' : 'Новый шаблон'" width="720px">
      <el-form label-position="top">
        <el-form-item v-if="!editingId" label="Код" required>
          <el-input v-model="form.code" placeholder="auction_started" />
        </el-form-item>
        <el-form-item label="Название" required>
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="Тема" required>
          <el-input v-model="form.subject" />
        </el-form-item>
        <el-form-item label="HTML-тело" required>
          <el-input v-model="form.body_html" type="textarea" :rows="10" />
        </el-form-item>
        <el-form-item label="Тип события">
          <el-select v-model="form.event_type" style="width: 100%">
            <el-option label="По событию" value="event" />
            <el-option label="По расписанию" value="scheduled" />
          </el-select>
        </el-form-item>
        <el-switch v-model="form.is_active" active-text="Активен" />
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
