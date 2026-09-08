<script setup>
/**
 * Профиль участника: просмотр/правка анкеты и загрузка документа.
 */
import { onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import profileApi from '@/api/modules/profile';
import { ENTITY_TYPES } from '@/constants/procedure';
import { mapLaravelErrorsToFields } from '@/helpers/format';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const formRef = ref(null);
const loading = ref(false);
const saving = ref(false);
const uploading = ref(false);
const serverErrors = reactive(/** @type {Record<string, string>} */ ({}));

const form = reactive({
    entity_type: 'legal',
    name: '',
    phone: '',
    director_name: '',
    director_birth_date: '',
    contact_persons: '',
});

/**
 * Загружает профиль с API.
 * @returns {Promise<void>}
 */
async function load() {
    loading.value = true;
    try {
        const { data } = await profileApi.show();
        const p = data.data ?? {};
        form.entity_type = p.entity_type || 'legal';
        form.name = p.name || '';
        form.phone = p.phone || '';
        form.director_name = p.director_name || '';
        form.director_birth_date = p.director_birth_date || '';
        form.contact_persons = p.contact_persons || '';
    } catch (e) {
        ElMessage.error(e?.response?.data?.message || 'Не удалось загрузить профиль');
    } finally {
        loading.value = false;
    }
}

/**
 * Сохраняет изменения профиля.
 * @returns {Promise<void>}
 */
async function onSave() {
    Object.keys(serverErrors).forEach((k) => delete serverErrors[k]);
    saving.value = true;
    try {
        await profileApi.update({
            entity_type: form.entity_type,
            name: form.name.trim(),
            phone: form.phone.trim(),
            director_name: form.director_name.trim(),
            director_birth_date: form.director_birth_date || null,
            contact_persons: form.contact_persons,
        });
        await auth.me();
        ElMessage.success('Профиль сохранён');
    } catch (e) {
        Object.assign(serverErrors, mapLaravelErrorsToFields(e?.response?.data?.errors || [e?.response?.data?.message]));
        ElMessage.error('Проверьте поля формы');
    } finally {
        saving.value = false;
    }
}

/**
 * Загрузка файла документа профиля.
 * @param {{ raw: File }} uploadFile Файл из el-upload
 * @returns {Promise<void>}
 */
async function onUpload({ raw }) {
    if (!raw) {
        return;
    }
    uploading.value = true;
    try {
        await profileApi.uploadDocument(raw);
        ElMessage.success('Документ загружен');
    } catch (e) {
        const fields = mapLaravelErrorsToFields(e?.response?.data?.errors || [e?.response?.data?.message]);
        ElMessage.error(fields.document || fields._form || 'Ошибка загрузки');
    } finally {
        uploading.value = false;
    }
}

onMounted(load);
</script>

<template>
  <div class="etp-card" v-loading="loading">
    <h1>Профиль</h1>
    <p class="muted">
      ИНН {{ auth.user?.inn }} · {{ auth.user?.email }}
      · статус {{ auth.user?.status }}
    </p>

    <el-form ref="formRef" :model="form" label-position="top" @submit.prevent="onSave">
      <el-form-item label="Тип субъекта" :error="serverErrors.entity_type">
        <el-radio-group v-model="form.entity_type">
          <el-radio v-for="item in ENTITY_TYPES" :key="item.value" :value="item.value">
            {{ item.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="Наименование / ФИО" :error="serverErrors.name">
        <el-input v-model="form.name" />
      </el-form-item>

      <el-form-item label="Телефон" :error="serverErrors.phone">
        <el-input v-model="form.phone" />
      </el-form-item>

      <el-form-item label="ФИО руководителя" :error="serverErrors.director_name">
        <el-input v-model="form.director_name" />
      </el-form-item>

      <el-form-item label="Дата рождения руководителя" :error="serverErrors.director_birth_date">
        <el-date-picker
          v-model="form.director_birth_date"
          type="date"
          value-format="YYYY-MM-DD"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="Контактные лица" :error="serverErrors.contact_persons">
        <el-input v-model="form.contact_persons" type="textarea" :rows="3" />
      </el-form-item>

      <el-button type="primary" native-type="submit" :loading="saving">Сохранить</el-button>
    </el-form>

    <el-divider />

    <h2>Документы</h2>
    <p class="muted">PDF, DOC, DOCX, XLS, XLSX до 10 МБ. Список загруженных на API пока без GET — только загрузка.</p>
    <el-upload
      :auto-upload="false"
      :show-file-list="false"
      accept=".pdf,.doc,.docx,.xls,.xlsx"
      :disabled="uploading"
      @change="onUpload"
    >
      <el-button :loading="uploading">Выбрать файл</el-button>
    </el-upload>
  </div>
</template>

<style scoped>
.muted {
  color: #6b7280;
  margin-bottom: 1rem;
}

h2 {
  font-size: 1.1rem;
}
</style>
