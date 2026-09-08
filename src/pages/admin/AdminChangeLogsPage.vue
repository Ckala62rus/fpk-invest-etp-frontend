<script setup>
/**
 * F4: согласование изменений документации ТЗП (auditor / super_admin).
 */
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import adminProcedureExtrasApi from '@/api/modules/adminProcedureExtras';
import { ROLES } from '@/constants/roles';
import { useAuthStore } from '@/stores/auth';
import { formatDateTime } from '@/helpers/format';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const procedureId = computed(() => route.params.id);
const canApprove = computed(() => auth.hasRole([ROLES.SUPER_ADMIN, ROLES.AUDITOR]));

const loading = ref(false);
const items = ref([]);
const rejectVisible = ref(false);
const rejectId = ref(null);
const rejectReason = ref('');
const acting = ref(false);

/**
 * @returns {Promise<void>}
 */
async function load() {
    loading.value = true;
    try {
        const { data } = await adminProcedureExtrasApi.listChangeLogs(procedureId.value);
        items.value = Array.isArray(data.data) ? data.data : [];
    } catch (e) {
        ElMessage.error(e?.response?.data?.message || 'Ошибка загрузки');
    } finally {
        loading.value = false;
    }
}

/**
 * @param {number} changeLogId ID записи
 * @returns {Promise<void>}
 */
async function onApprove(changeLogId) {
    acting.value = true;
    try {
        await adminProcedureExtrasApi.approveChange(procedureId.value, changeLogId);
        ElMessage.success('Согласовано');
        await load();
    } catch (e) {
        ElMessage.error(e?.response?.data?.message || 'Ошибка');
    } finally {
        acting.value = false;
    }
}

/**
 * @param {number} changeLogId ID
 * @returns {void}
 */
function openReject(changeLogId) {
    rejectId.value = changeLogId;
    rejectReason.value = '';
    rejectVisible.value = true;
}

/**
 * @returns {Promise<void>}
 */
async function submitReject() {
    if (!rejectReason.value || rejectReason.value.length < 3) {
        ElMessage.warning('Укажите причину');
        return;
    }
    acting.value = true;
    try {
        await adminProcedureExtrasApi.rejectChange(procedureId.value, rejectId.value, {
            reason: rejectReason.value,
        });
        rejectVisible.value = false;
        ElMessage.success('Отклонено');
        await load();
    } catch (e) {
        ElMessage.error(e?.response?.data?.message || 'Ошибка');
    } finally {
        acting.value = false;
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
    <h1>Изменения документации #{{ procedureId }}</h1>
    <p class="muted">Согласование правок опубликованной ТЗП (роль auditor / super_admin).</p>

    <el-table :data="items" stripe empty-text="Нет записей">
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="change_summary" label="Суть" min-width="200" />
      <el-table-column label="Статус" width="140">
        <template #default="{ row }">{{ row.approval_status_label || row.approval_status }}</template>
      </el-table-column>
      <el-table-column label="Создано" width="150">
        <template #default="{ row }">{{ formatDateTime(row.created_at) }}</template>
      </el-table-column>
      <el-table-column v-if="canApprove" label="" width="200">
        <template #default="{ row }">
          <template v-if="row.approval_status === 'pending'">
            <el-button link type="success" :loading="acting" @click="onApprove(row.id)">
              Согласовать
            </el-button>
            <el-button link type="danger" @click="openReject(row.id)">Отклонить</el-button>
          </template>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="rejectVisible" title="Отклонение" width="420px">
      <el-input v-model="rejectReason" type="textarea" :rows="3" placeholder="Причина" />
      <template #footer>
        <el-button @click="rejectVisible = false">Отмена</el-button>
        <el-button type="danger" :loading="acting" @click="submitReject">Отклонить</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.muted {
  color: #6b7280;
}
</style>
