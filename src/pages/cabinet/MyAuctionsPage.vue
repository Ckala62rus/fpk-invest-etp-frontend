<script setup>
/**
 * Кабинет: список аукционов участника и признак «Вы победитель».
 */
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import auctionApi from '@/api/modules/auction';
import { auctionTradeBadge } from '@/helpers/auctionTrade';
import { formatDateTime } from '@/helpers/format';

const router = useRouter();
const loading = ref(false);
const rows = ref([]);

/**
 * @returns {Promise<void>}
 */
async function load() {
    loading.value = true;
    try {
        const { data } = await auctionApi.listMyAuctions();
        rows.value = Array.isArray(data.data) ? data.data : [];
    } catch (e) {
        ElMessage.error(e?.response?.data?.message || 'Не удалось загрузить аукционы');
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
        <h1>Мои аукционы</h1>
        <p class="muted">
          Аукционы, в которых вы ставили или были приглашены. После завершения торгов здесь видно,
          победили ли вы (чужие победители не показываются).
        </p>
      </div>
      <el-button type="primary" @click="router.push({ name: 'procedures.index' })">
        К процедурам на витрине
      </el-button>
    </div>

    <el-table :data="rows" stripe empty-text="Пока нет аукционов с вашим участием" style="width: 100%">
      <el-table-column label="Процедура" min-width="220">
        <template #default="{ row }">
          <div>{{ row.number || `№${row.id}` }}</div>
          <div class="sub">{{ row.title || '—' }}</div>
        </template>
      </el-table-column>
      <el-table-column label="Фаза торгов" width="160">
        <template #default="{ row }">
          <el-tag :type="auctionTradeBadge(row.auction_trade_status).tagType" size="small">
            {{ row.auction_trade_status_label || auctionTradeBadge(row.auction_trade_status).label }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Итог для вас" min-width="200">
        <template #default="{ row }">
          <template v-if="row.is_winner">
            <el-tag type="success" effect="dark">Вы победитель</el-tag>
            <div class="sub mt">
              Лоты:
              {{ (row.won_lots || []).map((l) => l.name).join(', ') || '—' }}
            </div>
          </template>
          <span v-else-if="row.auction_trade_status === 'finished'" class="muted-inline">
            Торги завершены
          </span>
          <span v-else class="muted-inline">—</span>
        </template>
      </el-table-column>
      <el-table-column label="Окончание" width="160">
        <template #default="{ row }">{{ formatDateTime(row.ends_at || row.completed_at) }}</template>
      </el-table-column>
      <el-table-column label="" width="120">
        <template #default="{ row }">
          <el-button
            link
            type="primary"
            @click="router.push({ name: 'cabinet.auction', params: { id: row.id } })"
          >
            Открыть
          </el-button>
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

.muted-inline {
  color: #6b7280;
}

.sub {
  color: #6b7280;
  font-size: 0.85rem;
}

.mt {
  margin-top: 0.35rem;
}
</style>
