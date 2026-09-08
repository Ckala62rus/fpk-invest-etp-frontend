<script setup>
/**
 * Админка CMS: список страниц и создание/редактирование (super_admin).
 */
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import adminCmsApi from '@/api/modules/adminCms';

const router = useRouter();
const loading = ref(false);
const items = ref([]);
const dialogVisible = ref(false);
const editingId = ref(null);
const saving = ref(false);

const form = reactive({
    slug: '',
    title: '',
    meta_title: '',
    meta_description: '',
    is_published: false,
    sort_order: 0,
    content_html: '',
});

/**
 * @returns {Promise<void>}
 */
async function load() {
    loading.value = true;
    try {
        const { data } = await adminCmsApi.list({ per_page: 100 });
        items.value = Array.isArray(data.data) ? data.data : [];
    } catch (e) {
        ElMessage.error(e?.response?.data?.message || 'Нет доступа (нужен super_admin)');
    } finally {
        loading.value = false;
    }
}

/**
 * @returns {void}
 */
function openCreate() {
    editingId.value = null;
    form.slug = '';
    form.title = '';
    form.meta_title = '';
    form.meta_description = '';
    form.is_published = false;
    form.sort_order = 0;
    form.content_html = '<p></p>';
    dialogVisible.value = true;
}

/**
 * @param {Record<string, unknown>} row Страница
 * @returns {Promise<void>}
 */
async function openEdit(row) {
    editingId.value = row.id;
    try {
        const { data } = await adminCmsApi.show(row.id);
        const p = data.data ?? row;
        form.slug = p.slug || '';
        form.title = p.title || '';
        form.meta_title = p.meta_title || '';
        form.meta_description = p.meta_description || '';
        form.is_published = Boolean(p.is_published);
        form.sort_order = p.sort_order ?? 0;
        form.content_html = p.content_html || '';
        dialogVisible.value = true;
    } catch (e) {
        ElMessage.error(e?.response?.data?.message || 'Не удалось открыть');
    }
}

/**
 * @returns {Promise<void>}
 */
async function onSave() {
    saving.value = true;
    try {
        if (editingId.value) {
            await adminCmsApi.update(editingId.value, { ...form });
        } else {
            await adminCmsApi.create({ ...form });
        }
        dialogVisible.value = false;
        ElMessage.success('Сохранено');
        await load();
    } catch (e) {
        ElMessage.error(e?.response?.data?.message || 'Ошибка сохранения');
    } finally {
        saving.value = false;
    }
}

/**
 * @param {number} id ID
 * @returns {Promise<void>}
 */
async function onDelete(id) {
    await ElMessageBox.confirm('Удалить страницу?', 'Подтверждение');
    try {
        await adminCmsApi.destroy(id);
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
      <h1>CMS-страницы</h1>
      <el-button type="primary" @click="openCreate">Создать</el-button>
    </div>

    <el-table :data="items" stripe>
      <el-table-column prop="slug" label="Slug" width="160" />
      <el-table-column prop="title" label="Заголовок" min-width="180" />
      <el-table-column label="Публикация" width="120">
        <template #default="{ row }">
          <el-tag :type="row.is_published ? 'success' : 'info'" size="small">
            {{ row.is_published ? 'да' : 'нет' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="sort_order" label="Порядок" width="90" />
      <el-table-column label="" width="200">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">Изменить</el-button>
          <el-button
            link
            @click="router.push({ name: 'cms.show', params: { slug: row.slug } })"
          >
            Витрина
          </el-button>
          <el-button link type="danger" @click="onDelete(row.id)">Удалить</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? 'Редактирование' : 'Новая страница'"
      width="720px"
    >
      <el-form label-position="top">
        <el-form-item label="Slug" required>
          <el-input v-model="form.slug" placeholder="about" />
        </el-form-item>
        <el-form-item label="Заголовок" required>
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="Meta title">
          <el-input v-model="form.meta_title" />
        </el-form-item>
        <el-form-item label="Meta description">
          <el-input v-model="form.meta_description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="HTML-контент" required>
          <el-input v-model="form.content_html" type="textarea" :rows="10" />
        </el-form-item>
        <el-form-item label="Порядок">
          <el-input-number v-model="form.sort_order" :min="0" />
        </el-form-item>
        <el-form-item>
          <el-switch v-model="form.is_published" active-text="Опубликована" />
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
  gap: 1rem;
  flex-wrap: wrap;
}
</style>
