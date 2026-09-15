<script setup>
/**
 * Модалка: организация участника + документы профиля + служебный комментарий.
 * Используется на странице пользователей и в списке/карточке КП.
 */
import { computed, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { Download, View } from '@element-plus/icons-vue';
import adminUsersApi from '@/api/modules/adminUsers';
import { ROLES } from '@/constants/roles';
import { roleLabel } from '@/constants/roles';
import { userStatusLabel } from '@/constants/admin';
import { useAuthStore } from '@/stores/auth';
import { apiErrorMessage, formatDateTime } from '@/helpers/format';
import { isPdfFile, openBlobInNewTab, saveBlobAsFile } from '@/helpers/files';
import EtpIconButton from '@/components/ui/EtpIconButton.vue';

/**
 * @param {string|null|undefined} entityType
 * @returns {string}
 */
function entityTypeLabel(entityType) {
    if (entityType === 'legal') {
        return 'Юридическое лицо';
    }
    if (entityType === 'individual') {
        return 'Индивидуальный предприниматель / физлицо';
    }
    return entityType || '—';
}

const props = defineProps({
    modelValue: { type: Boolean, default: false },
    /** ID пользователя для загрузки */
    userId: { type: [Number, String], default: null },
});

const emit = defineEmits(['update:modelValue']);

const auth = useAuthStore();
const canEditNotes = computed(() => auth.hasRole([ROLES.SUPER_ADMIN, ROLES.TRADE_ADMIN]));

const visible = computed({
    get: () => props.modelValue,
    set: (v) => emit('update:modelValue', v),
});

const loading = ref(false);
const savingNotes = ref(false);
const user = ref(null);
const documents = ref([]);
const notesDraft = ref('');

/**
 * @param {Record<string, unknown>|null} u
 * @returns {Record<string, unknown>|null}
 */
function profileOf(u) {
    return u?.profile || null;
}

/**
 * @returns {Promise<void>}
 */
async function load() {
    if (!props.userId) {
        user.value = null;
        documents.value = [];
        return;
    }
    loading.value = true;
    try {
        const [u, docs] = await Promise.all([
            adminUsersApi.show(props.userId),
            adminUsersApi.listDocuments(props.userId),
        ]);
        user.value = u.data.data ?? null;
        notesDraft.value = user.value?.admin_notes || '';
        documents.value = Array.isArray(docs.data.data) ? docs.data.data : [];
    } catch (e) {
        ElMessage.error(apiErrorMessage(e, 'Не удалось открыть карточку'));
        user.value = null;
        documents.value = [];
    } finally {
        loading.value = false;
    }
}

/**
 * @returns {Promise<void>}
 */
async function saveNotes() {
    if (!props.userId || !canEditNotes.value) {
        return;
    }
    savingNotes.value = true;
    try {
        const { data } = await adminUsersApi.updateAdminNotes(props.userId, notesDraft.value || null);
        user.value = data.data ?? user.value;
        ElMessage.success('Комментарий сохранён');
    } catch (e) {
        ElMessage.error(apiErrorMessage(e, 'Не удалось сохранить комментарий'));
    } finally {
        savingNotes.value = false;
    }
}

/**
 * @param {Record<string, unknown>} row
 * @returns {Promise<void>}
 */
async function onOpenDoc(row) {
    try {
        const { data } = await adminUsersApi.downloadDocument(props.userId, row.id, { inline: true });
        openBlobInNewTab(data);
    } catch (e) {
        ElMessage.error(apiErrorMessage(e, 'Не удалось открыть файл'));
    }
}

/**
 * @param {Record<string, unknown>} row
 * @returns {Promise<void>}
 */
async function onDownloadDoc(row) {
    try {
        const { data } = await adminUsersApi.downloadDocument(props.userId, row.id);
        saveBlobAsFile(data, String(row.file_name || 'document'));
    } catch (e) {
        ElMessage.error(apiErrorMessage(e, 'Не удалось скачать файл'));
    }
}

watch(
    () => [props.modelValue, props.userId],
    ([open]) => {
        if (open) {
            load();
        }
    },
);
</script>

<template>
  <el-dialog
    v-model="visible"
    title="Организация и документы участника"
    width="720px"
    destroy-on-close
  >
    <div v-loading="loading">
      <template v-if="user">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="Статус">
            {{ userStatusLabel(user.status) }}
          </el-descriptions-item>
          <el-descriptions-item label="Роли">
            {{ (user.roles || []).map(roleLabel).join(', ') || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="ИНН">{{ user.inn }}</el-descriptions-item>
          <el-descriptions-item label="Email">{{ user.email }}</el-descriptions-item>
          <el-descriptions-item label="Тип субъекта">
            {{ entityTypeLabel(profileOf(user)?.entity_type) }}
          </el-descriptions-item>
          <el-descriptions-item label="Организация / ФИО">
            {{ profileOf(user)?.name || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="Телефон">
            {{ profileOf(user)?.phone || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="Руководитель">
            {{ profileOf(user)?.director_name || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="Дата рождения руководителя">
            {{ profileOf(user)?.director_birth_date || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="Контактные лица">
            <span class="pre-wrap">{{ profileOf(user)?.contact_persons || '—' }}</span>
          </el-descriptions-item>
        </el-descriptions>

        <h3 class="docs-title">Документы организации</h3>
        <el-table :data="documents" size="small" empty-text="Документов пока нет">
          <el-table-column prop="file_name" label="Файл" min-width="200" />
          <el-table-column label="Загружен" width="150">
            <template #default="{ row }">{{ formatDateTime(row.uploaded_at) }}</template>
          </el-table-column>
          <el-table-column label="" width="110" fixed="right">
            <template #default="{ row }">
              <div class="etp-table-actions">
                <EtpIconButton
                  v-if="isPdfFile(row.file_name)"
                  title="Открыть PDF"
                  @click="onOpenDoc(row)"
                >
                  <View />
                </EtpIconButton>
                <EtpIconButton title="Скачать" @click="onDownloadDoc(row)">
                  <Download />
                </EtpIconButton>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <h3 class="docs-title">Служебный комментарий</h3>
        <p class="hint">Виден только администраторам. Участник это поле не видит.</p>
        <el-input
          v-model="notesDraft"
          type="textarea"
          :rows="4"
          maxlength="5000"
          show-word-limit
          :disabled="!canEditNotes"
          placeholder="Заметки о пользователе…"
        />
        <el-button
          v-if="canEditNotes"
          type="primary"
          class="mt"
          :loading="savingNotes"
          @click="saveNotes"
        >
          Сохранить комментарий
        </el-button>
      </template>
    </div>
    <template #footer>
      <el-button @click="visible = false">Закрыть</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.docs-title {
  margin: 1.25rem 0 0.5rem;
  font-size: 1rem;
}

.hint {
  color: #6b7280;
  font-size: 0.85rem;
  margin: 0 0 0.5rem;
}

.pre-wrap {
  white-space: pre-wrap;
}

.mt {
  margin-top: 0.75rem;
}
</style>
