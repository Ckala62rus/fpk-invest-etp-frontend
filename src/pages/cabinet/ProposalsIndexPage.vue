<script setup>
/**
 * Список своих КП с API + переход к подаче нового.
 */
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { View } from '@element-plus/icons-vue';
import proposalsApi from '@/api/modules/proposals';
import { formatDateTime } from '@/helpers/format';
import EtpIconButton from '@/components/ui/EtpIconButton.vue';

const router = useRouter();
const loading = ref(false);
const rows = ref([]);

/**
 * @returns {Promise<void>}
 */
async function load() {
    loading.value = true;
    try {
        const { data } = await proposalsApi.index();
        rows.value = Array.isArray(data.data) ? data.data : [];
    } catch (e) {
        ElMessage.error(e?.response?.data?.message || 'Не удалось загрузить КП');
        rows.value = [];
    } finally {
        loading.value = false;
    }
}

onMounted(load);
</script>

<template>
  <div class="etp-card" v-loading="loading">
    <div class="head">
      <div>
        <h1>Мои коммерческие предложения</h1>
        <p class="muted">
          Здесь все КП, которые вы подали. Чтобы подать новое — откройте процедуру на витрине
          и нажмите «Подать КП», либо перейдите к списку процедур.
        </p>
      </div>
      <el-button type="primary" @click="router.push({ name: 'procedures.index' })">
        К процедурам на витрине
      </el-button>
    </div>

    <el-table :data="rows" stripe empty-text="Вы ещё не подавали КП" style="width: 100%">
      <el-table-column label="Процедура" min-width="220">
        <template #default="{ row }">
          <div>{{ row.procedure?.number || `№${row.procedure_id}` }}</div>
          <div class="sub">{{ row.procedure?.title || '—' }}</div>
        </template>
      </el-table-column>
      <el-table-column label="Тип" width="160">
        <template #default="{ row }">
          {{ row.procedure?.type_label || row.procedure?.type || '—' }}
        </template>
      </el-table-column>
      <el-table-column label="Статус" width="160">
        <template #default="{ row }">{{ row.status_label || row.status }}</template>
      </el-table-column>
      <el-table-column label="Подано" width="160">
        <template #default="{ row }">{{ formatDateTime(row.submitted_at) }}</template>
      </el-table-column>
      <el-table-column label="" width="70">
        <template #default="{ row }">
          <div class="etp-table-actions">
            <EtpIconButton
              title="Открыть"
              @click="router.push({ name: 'cabinet.proposals.show', params: { id: row.id } })"
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
.head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.muted {
  color: #6b7280;
  max-width: 40rem;
}

.sub {
  color: #6b7280;
  font-size: 0.85rem;
}
</style>
