<script setup>
/**
 * Список своих КП: ID хранятся локально (на бэке нет index участника).
 */
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import proposalsApi from '@/api/modules/proposals';
import { forgetProposalId, getMyProposalIds } from '@/helpers/myProposals';
import { formatDateTime } from '@/helpers/format';

const router = useRouter();
const loading = ref(false);
const rows = ref([]);
const manualId = ref(null);

/**
 * Подтягивает карточки по сохранённым ID.
 * @returns {Promise<void>}
 */
async function load() {
    loading.value = true;
    const ids = getMyProposalIds();
    const result = [];
    for (const id of ids) {
        try {
            const { data } = await proposalsApi.show(id);
            if (data.data) {
                result.push(data.data);
            }
        } catch {
            forgetProposalId(id);
        }
    }
    rows.value = result;
    loading.value = false;
}

/**
 * Открыть КП по введённому ID.
 * @returns {void}
 */
function openManual() {
    const id = Number(manualId.value);
    if (!id) {
        ElMessage.warning('Укажите ID заявки');
        return;
    }
    router.push({ name: 'cabinet.proposals.show', params: { id } });
}

onMounted(load);
</script>

<template>
  <div class="etp-card" v-loading="loading">
    <h1>Мои КП</h1>
    <p class="muted">
      Список строится из локально сохранённых ID после подачи.
      Можно открыть заявку по номеру, если он известен из письма.
    </p>

    <div class="manual">
      <el-input-number v-model="manualId" :min="1" controls-position="right" />
      <el-button type="primary" @click="openManual">Открыть по ID</el-button>
      <el-button @click="$router.push({ name: 'procedures.index' })">К процедурам</el-button>
    </div>

    <el-table :data="rows" stripe empty-text="Пока нет сохранённых КП" style="width: 100%; margin-top: 1rem">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="procedure_id" label="Процедура" width="110" />
      <el-table-column label="Статус" width="160">
        <template #default="{ row }">{{ row.status_label || row.status }}</template>
      </el-table-column>
      <el-table-column label="Подано">
        <template #default="{ row }">{{ formatDateTime(row.submitted_at) }}</template>
      </el-table-column>
      <el-table-column label="" width="120">
        <template #default="{ row }">
          <el-button link type="primary" @click="$router.push({ name: 'cabinet.proposals.show', params: { id: row.id } })">
            Открыть
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style scoped>
.muted {
  color: #6b7280;
}

.manual {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  align-items: center;
}
</style>
