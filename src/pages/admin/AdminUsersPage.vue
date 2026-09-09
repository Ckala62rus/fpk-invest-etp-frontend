<script setup>
/**
 * Админка: список пользователей, одобрение, блок, роли.
 * В таблице и диалогах — профиль регистрации и русские подписи статусов/ролей.
 */
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { CircleCheck, Download, Lock, Setting, Unlock, View } from '@element-plus/icons-vue';
import adminUsersApi from '@/api/modules/adminUsers';
import { ASSIGNABLE_ROLES, USER_STATUSES, userStatusLabel } from '@/constants/admin';
import { ROLES, roleLabel } from '@/constants/roles';
import { ENTITY_TYPES } from '@/constants/procedure';
import { formatDateTime } from '@/helpers/format';
import { isPdfFile, openBlobInNewTab, saveBlobAsFile } from '@/helpers/files';
import { useAuthStore } from '@/stores/auth';
import EtpIconButton from '@/components/ui/EtpIconButton.vue';

const route = useRoute();

const auth = useAuthStore();
const loading = ref(false);
const items = ref([]);
const filters = reactive({ search: '', status: '', role: '' });
const pagination = reactive({ page: 1, perPage: 20, total: 0 });

const canModerate = computed(() => auth.hasRole([ROLES.SUPER_ADMIN, ROLES.TRADE_ADMIN]));
const canAssignRoles = computed(() => auth.hasRole(ROLES.SUPER_ADMIN));

const blockVisible = ref(false);
const blockUserId = ref(null);
const blockForm = reactive({ reason: '', blocked_until: '' });

const rolesVisible = ref(false);
const rolesUserId = ref(null);
const rolesSelected = ref([]);

/** Карточка пользователя: просмотр / подтверждение одобрения */
const detailVisible = ref(false);
const detailUser = ref(/** @type {Record<string, unknown>|null} */ (null));
const detailMode = ref(/** @type {'view'|'approve'} */ ('view'));
const approving = ref(false);
/** Документы профиля (устав и т.п.) в карточке пользователя */
const detailDocuments = ref(/** @type {Array<Record<string, unknown>>} */ ([]));
const detailDocsLoading = ref(false);

/**
 * Подпись типа субъекта (юрлицо / физлицо).
 *
 * @param {string|null|undefined} entityType Slug entity_type
 * @returns {string}
 */
function entityTypeLabel(entityType) {
    const found = ENTITY_TYPES.find((item) => item.value === entityType);
    return found?.label || entityType || '—';
}

/**
 * Профиль из строки списка (может отсутствовать у старых записей).
 *
 * @param {Record<string, unknown>|null|undefined} row Пользователь
 * @returns {Record<string, unknown>|null}
 */
function profileOf(row) {
    const profile = row?.profile;
    return profile && typeof profile === 'object' ? /** @type {Record<string, unknown>} */ (profile) : null;
}

/**
 * Загрузка списка.
 * @returns {Promise<void>}
 */
async function load() {
    loading.value = true;
    try {
        const { data } = await adminUsersApi.list({
            search: filters.search || undefined,
            status: filters.status || undefined,
            role: filters.role || undefined,
            page: pagination.page,
            per_page: pagination.perPage,
        });
        items.value = Array.isArray(data.data) ? data.data : [];
        pagination.total = Number(data.meta?.total ?? items.value.length);
    } catch (e) {
        ElMessage.error(e?.response?.data?.message || 'Не удалось загрузить пользователей');
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
 * Загружает документы профиля выбранного пользователя.
 *
 * @param {number|string} userId ID пользователя
 * @returns {Promise<void>}
 */
async function loadDetailDocuments(userId) {
    detailDocsLoading.value = true;
    detailDocuments.value = [];
    try {
        const { data } = await adminUsersApi.listDocuments(userId);
        detailDocuments.value = Array.isArray(data.data) ? data.data : [];
    } catch (e) {
        ElMessage.error(e?.response?.data?.message || 'Не удалось загрузить документы профиля');
        detailDocuments.value = [];
    } finally {
        detailDocsLoading.value = false;
    }
}

/**
 * Открыть карточку с данными регистрации и документами организации.
 *
 * @param {Record<string, unknown>} row Пользователь
 * @param {'view'|'approve'} mode Режим (просмотр или одобрение)
 * @returns {void}
 */
function openDetail(row, mode = 'view') {
    detailUser.value = row;
    detailMode.value = mode;
    detailVisible.value = true;
    if (row?.id) {
        loadDetailDocuments(row.id);
    }
}

/**
 * @param {Record<string, unknown>} row Документ
 * @returns {Promise<void>}
 */
async function onOpenUserDoc(row) {
    const userId = detailUser.value?.id;
    if (!userId) {
        return;
    }
    try {
        const { data } = await adminUsersApi.downloadDocument(userId, row.id, { inline: true });
        openBlobInNewTab(data);
    } catch (e) {
        ElMessage.error(e?.response?.data?.message || 'Не удалось открыть файл');
    }
}

/**
 * @param {Record<string, unknown>} row Документ
 * @returns {Promise<void>}
 */
async function onDownloadUserDoc(row) {
    const userId = detailUser.value?.id;
    if (!userId) {
        return;
    }
    try {
        const { data } = await adminUsersApi.downloadDocument(userId, row.id);
        saveBlobAsFile(data, String(row.file_name || 'document'));
    } catch (e) {
        ElMessage.error(e?.response?.data?.message || 'Не удалось скачать файл');
    }
}

/**
 * Одобрение из диалога карточки.
 * @returns {Promise<void>}
 */
async function confirmApprove() {
    const id = detailUser.value?.id;
    if (!id) {
        return;
    }
    approving.value = true;
    try {
        await adminUsersApi.approve(id);
        ElMessage.success('Пользователь одобрен');
        detailVisible.value = false;
        await load();
    } catch (e) {
        ElMessage.error(e?.response?.data?.message || 'Ошибка одобрения');
    } finally {
        approving.value = false;
    }
}

/**
 * @param {Record<string, unknown>} row Пользователь
 * @returns {void}
 */
function openBlock(row) {
    blockUserId.value = row.id;
    blockForm.reason = '';
    blockForm.blocked_until = '';
    blockVisible.value = true;
}

/**
 * @returns {Promise<void>}
 */
async function submitBlock() {
    try {
        await adminUsersApi.block(blockUserId.value, {
            reason: blockForm.reason,
            blocked_until: blockForm.blocked_until || null,
        });
        blockVisible.value = false;
        ElMessage.success('Заблокирован');
        await load();
    } catch (e) {
        ElMessage.error(e?.response?.data?.message || 'Ошибка блокировки');
    }
}

/**
 * @param {number} id ID
 * @returns {Promise<void>}
 */
async function onUnblock(id) {
    try {
        await adminUsersApi.unblock(id);
        ElMessage.success('Разблокирован');
        await load();
    } catch (e) {
        ElMessage.error(e?.response?.data?.message || 'Ошибка разблокировки');
    }
}

/**
 * @param {Record<string, unknown>} row Пользователь
 * @returns {void}
 */
function openRoles(row) {
    rolesUserId.value = row.id;
    rolesSelected.value = Array.isArray(row.roles) ? [...row.roles] : [];
    rolesVisible.value = true;
}

/**
 * Вкл/выкл роли в диалоге (без el-checkbox-group — иначе EP показывает slug как подпись).
 *
 * @param {string} slug Slug роли API
 * @param {boolean|string|number} checked Состояние чекбокса
 * @returns {void}
 */
function onToggleRole(slug, checked) {
    const on = checked === true || checked === slug;
    if (on) {
        if (!rolesSelected.value.includes(slug)) {
            rolesSelected.value.push(slug);
        }
        return;
    }
    rolesSelected.value = rolesSelected.value.filter((item) => item !== slug);
}

/**
 * @returns {Promise<void>}
 */
async function submitRoles() {
    if (!rolesSelected.value.length) {
        ElMessage.warning('Выберите хотя бы одну роль');
        return;
    }
    try {
        await adminUsersApi.assignRoles(rolesUserId.value, rolesSelected.value);
        rolesVisible.value = false;
        ElMessage.success('Роли обновлены');
        await load();
    } catch (e) {
        ElMessage.error(e?.response?.data?.message || 'Ошибка назначения ролей');
    }
}

/**
 * Открыть карточку по ?user_id= из списка КП.
 *
 * @returns {Promise<void>}
 */
async function openFromQuery() {
    await load();
    const raw = route.query.user_id;
    const userId = Number(Array.isArray(raw) ? raw[0] : raw);
    if (!userId) {
        return;
    }
    const found = items.value.find((row) => Number(row.id) === userId);
    if (found) {
        openDetail(found, 'view');
        return;
    }
    // Пользователь может быть на другой странице пагинации — всё равно показываем карточку по id
    openDetail({ id: userId, inn: '…', email: '', roles: [], status: '', profile: null }, 'view');
}

onMounted(openFromQuery);
watch(() => pagination.page, load);
</script>

<template>
  <div class="etp-card" v-loading="loading">
    <h1>Пользователи</h1>

    <el-form inline class="filters" @submit.prevent="onFilter">
      <el-form-item label="Поиск">
        <el-input v-model="filters.search" clearable placeholder="ИНН / email / организация" />
      </el-form-item>
      <el-form-item label="Статус">
        <el-select v-model="filters.status" clearable placeholder="Все" style="width: 220px">
          <el-option v-for="s in USER_STATUSES" :key="s.value" :label="s.label" :value="s.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="Роль">
        <el-select v-model="filters.role" clearable placeholder="Все" style="width: 200px">
          <el-option v-for="r in ASSIGNABLE_ROLES" :key="r.value" :label="r.label" :value="r.value" />
        </el-select>
      </el-form-item>
      <el-button type="primary" @click="onFilter">Найти</el-button>
    </el-form>

    <el-table :data="items" stripe style="width: 100%">
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column label="Организация / ФИО" min-width="180">
        <template #default="{ row }">
          {{ profileOf(row)?.name || '—' }}
        </template>
      </el-table-column>
      <el-table-column label="Тип" width="130">
        <template #default="{ row }">
          {{ entityTypeLabel(profileOf(row)?.entity_type) }}
        </template>
      </el-table-column>
      <el-table-column prop="inn" label="ИНН" width="130" />
      <el-table-column prop="email" label="Email" min-width="160" />
      <el-table-column label="Телефон" width="130">
        <template #default="{ row }">
          {{ profileOf(row)?.phone || '—' }}
        </template>
      </el-table-column>
      <el-table-column label="Статус" width="170">
        <template #default="{ row }">
          <el-tag
            size="small"
            :type="row.status === 'active' ? 'success' : row.status === 'blocked' ? 'danger' : 'warning'"
          >
            {{ userStatusLabel(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Роли" min-width="180">
        <template #default="{ row }">
          <el-tag v-for="r in (row.roles || [])" :key="r" size="small" class="tag">
            {{ roleLabel(r) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Действия" width="180" fixed="right">
        <template #default="{ row }">
          <div class="etp-table-actions">
            <EtpIconButton title="Карточка" @click="openDetail(row, 'view')">
              <View />
            </EtpIconButton>
            <EtpIconButton
              v-if="canModerate && row.status === 'pending_approval'"
              type="success"
              title="Одобрить"
              @click="openDetail(row, 'approve')"
            >
              <CircleCheck />
            </EtpIconButton>
            <EtpIconButton
              v-if="canModerate && row.status !== 'blocked'"
              type="danger"
              title="Заблокировать"
              @click="openBlock(row)"
            >
              <Lock />
            </EtpIconButton>
            <EtpIconButton
              v-if="canModerate && row.status === 'blocked'"
              type="warning"
              title="Разблокировать"
              @click="onUnblock(row.id)"
            >
              <Unlock />
            </EtpIconButton>
            <EtpIconButton
              v-if="canAssignRoles"
              title="Роли"
              @click="openRoles(row)"
            >
              <Setting />
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

    <el-dialog
      v-model="detailVisible"
      :title="detailMode === 'approve' ? 'Одобрение пользователя' : 'Карточка пользователя и документы'"
      width="720px"
    >
      <template v-if="detailUser">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="Статус">
            {{ userStatusLabel(detailUser.status) }}
          </el-descriptions-item>
          <el-descriptions-item label="Роли">
            {{ (detailUser.roles || []).map(roleLabel).join(', ') || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="ИНН">{{ detailUser.inn }}</el-descriptions-item>
          <el-descriptions-item label="Email">{{ detailUser.email }}</el-descriptions-item>
          <el-descriptions-item label="Тип субъекта">
            {{ entityTypeLabel(profileOf(detailUser)?.entity_type) }}
          </el-descriptions-item>
          <el-descriptions-item label="Организация / ФИО">
            {{ profileOf(detailUser)?.name || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="Телефон">
            {{ profileOf(detailUser)?.phone || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="Руководитель">
            {{ profileOf(detailUser)?.director_name || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="Дата рождения руководителя">
            {{ profileOf(detailUser)?.director_birth_date || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="Контактные лица">
            <span class="pre-wrap">{{ profileOf(detailUser)?.contact_persons || '—' }}</span>
          </el-descriptions-item>
        </el-descriptions>

        <h3 class="docs-title">Документы организации (профиль)</h3>
        <p class="docs-hint">Файлы, которые участник загрузил в личном кабинете (устав, реквизиты и т.п.).</p>
        <el-table
          v-loading="detailDocsLoading"
          :data="detailDocuments"
          size="small"
          empty-text="Документов пока нет"
        >
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
                  @click="onOpenUserDoc(row)"
                >
                  <View />
                </EtpIconButton>
                <EtpIconButton title="Скачать" @click="onDownloadUserDoc(row)">
                  <Download />
                </EtpIconButton>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <p v-if="detailMode === 'approve'" class="approve-hint">
          Проверьте данные регистрации. После одобрения пользователь сможет войти в кабинет.
        </p>
      </template>
      <template #footer>
        <el-button @click="detailVisible = false">Закрыть</el-button>
        <el-button
          v-if="detailMode === 'approve'"
          type="success"
          :loading="approving"
          @click="confirmApprove"
        >
          Одобрить доступ
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="blockVisible" title="Блокировка" width="420px">
      <el-form label-position="top">
        <el-form-item label="Причина" required>
          <el-input v-model="blockForm.reason" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="До (необязательно)">
          <el-date-picker
            v-model="blockForm.blocked_until"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="blockVisible = false">Отмена</el-button>
        <el-button type="danger" @click="submitBlock">Заблокировать</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="rolesVisible" title="Назначение ролей" width="420px">
      <div class="roles-group">
        <el-checkbox
          v-for="r in ASSIGNABLE_ROLES"
          :key="r.value"
          :model-value="rolesSelected.includes(r.value)"
          @change="(checked) => onToggleRole(r.value, checked)"
        >
          {{ roleLabel(r.value) }}
        </el-checkbox>
      </div>
      <template #footer>
        <el-button @click="rolesVisible = false">Отмена</el-button>
        <el-button type="primary" @click="submitRoles">Сохранить</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.filters {
  margin-bottom: 1rem;
}

.tag {
  margin-right: 0.25rem;
}

.pager {
  margin-top: 1rem;
  display: flex;
  justify-content: flex-end;
}

.approve-hint {
  margin: 1rem 0 0;
  color: #6b7280;
  font-size: 0.875rem;
}

.pre-wrap {
  white-space: pre-wrap;
}

.roles-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-start;
}

.docs-title {
  margin: 1.25rem 0 0.35rem;
  font-size: 1rem;
}

.docs-hint {
  margin: 0 0 0.75rem;
  color: #6b7280;
  font-size: 0.875rem;
}
</style>
