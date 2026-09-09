<script setup>
/**
 * Админка: список пользователей, одобрение, блок, роли.
 */
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { CircleCheck, Lock, Setting, Unlock } from '@element-plus/icons-vue';
import adminUsersApi from '@/api/modules/adminUsers';
import { ASSIGNABLE_ROLES, USER_STATUSES } from '@/constants/admin';
import { ROLES } from '@/constants/roles';
import { useAuthStore } from '@/stores/auth';
import EtpIconButton from '@/components/ui/EtpIconButton.vue';

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
 * @param {number} id ID пользователя
 * @returns {Promise<void>}
 */
async function onApprove(id) {
    try {
        await adminUsersApi.approve(id);
        ElMessage.success('Пользователь одобрен');
        await load();
    } catch (e) {
        ElMessage.error(e?.response?.data?.message || 'Ошибка одобрения');
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

onMounted(load);
watch(() => pagination.page, load);
</script>

<template>
  <div class="etp-card" v-loading="loading">
    <h1>Пользователи</h1>

    <el-form inline class="filters" @submit.prevent="onFilter">
      <el-form-item label="Поиск">
        <el-input v-model="filters.search" clearable placeholder="ИНН / email" />
      </el-form-item>
      <el-form-item label="Статус">
        <el-select v-model="filters.status" clearable placeholder="Все" style="width: 200px">
          <el-option v-for="s in USER_STATUSES" :key="s.value" :label="s.label" :value="s.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="Роль">
        <el-select v-model="filters.role" clearable placeholder="Все" style="width: 160px">
          <el-option v-for="r in ASSIGNABLE_ROLES" :key="r.value" :label="r.label" :value="r.value" />
        </el-select>
      </el-form-item>
      <el-button type="primary" @click="onFilter">Найти</el-button>
    </el-form>

    <el-table :data="items" stripe style="width: 100%">
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="inn" label="ИНН" width="130" />
      <el-table-column prop="email" label="Email" min-width="180" />
      <el-table-column label="Статус" width="140">
        <template #default="{ row }">{{ row.status }}</template>
      </el-table-column>
      <el-table-column label="Роли" min-width="160">
        <template #default="{ row }">
          <el-tag v-for="r in (row.roles || [])" :key="r" size="small" class="tag">{{ r }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Действия" width="150" fixed="right">
        <template #default="{ row }">
          <div class="etp-table-actions">
            <EtpIconButton
              v-if="canModerate && row.status === 'pending_approval'"
              type="success"
              title="Одобрить"
              @click="onApprove(row.id)"
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

    <el-dialog v-model="rolesVisible" title="Роли" width="420px">
      <el-checkbox-group v-model="rolesSelected">
        <el-checkbox
          v-for="r in ASSIGNABLE_ROLES"
          :key="r.value"
          :value="r.value"
        >
          {{ r.label }}
        </el-checkbox>
      </el-checkbox-group>
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
</style>
