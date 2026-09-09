<script setup>
/**
 * Админка: список КП по процедуре + переход к допуску/переписке и профилю участника.
 */
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { User, View } from '@element-plus/icons-vue';
import adminProposalsApi from '@/api/modules/adminProposals';
import { formatDateTime } from '@/helpers/format';
import EtpIconButton from '@/components/ui/EtpIconButton.vue';

const route = useRoute();
const router = useRouter();
const procedureId = computed(() => route.params.id);

const loading = ref(false);
const items = ref([]);

/**
 * @returns {Promise<void>}
 */
async function load() {
    loading.value = true;
    try {
        const { data } = await adminProposalsApi.list(procedureId.value);
        items.value = Array.isArray(data.data) ? data.data : [];
    } catch (e) {
        ElMessage.error(e?.response?.data?.message || 'Не удалось загрузить КП');
        items.value = [];
    } finally {
        loading.value = false;
    }
}

/**
 * Карточка пользователя + документы организации из профиля.
 *
 * @param {Record<string, unknown>} row КП
 * @returns {void}
 */
function openParticipant(row) {
    if (!row.user_id) {
        ElMessage.warning('Нет ID участника');
        return;
    }
    router.push({ name: 'admin.users', query: { user_id: String(row.user_id) } });
}

onMounted(load);
watch(procedureId, load);
</script>

<template>
  <div class="etp-card" v-loading="loading">
    <el-button link type="primary" @click="router.push({ name: 'admin.procedures.show', params: { id: procedureId } })">
      ← К процедуре
    </el-button>
    <h1>КП по процедуре #{{ procedureId }}</h1>
    <p class="muted">
      Кнопка «Профиль» открывает карточку участника и документы организации (устав и т.п.) из его ЛК.
    </p>

    <el-table :data="items" stripe>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="participant_name" label="Участник" min-width="160" />
      <el-table-column label="Статус" width="140">
        <template #default="{ row }">{{ row.status_label || row.status }}</template>
      </el-table-column>
      <el-table-column label="Подано" width="150">
        <template #default="{ row }">{{ formatDateTime(row.submitted_at) }}</template>
      </el-table-column>
      <el-table-column label="Контент" width="120">
        <template #default="{ row }">
          <el-tag :type="row.content_hidden ? 'warning' : 'success'" size="small">
            {{ row.content_hidden ? 'скрыт' : 'полный' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="" width="110">
        <template #default="{ row }">
          <div class="etp-table-actions">
            <EtpIconButton
              title="Профиль и документы организации"
              @click="openParticipant(row)"
            >
              <User />
            </EtpIconButton>
            <EtpIconButton
              title="Открыть КП"
              @click="router.push({ name: 'admin.proposals.show', params: { id: procedureId, proposalId: row.id } })"
            >
              <View />
            </EtpIconButton>
          </div>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style scoped>
.muted {
  color: #6b7280;
}
</style>
