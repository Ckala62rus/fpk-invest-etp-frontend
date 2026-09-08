<script setup>
/**
 * Страница аукциона участника: лоты, свои ставки, Echo-тикер, heartbeat.
 * Presence-канал не подключаем (только админка).
 */
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import auctionApi from '@/api/modules/auction';
import proceduresApi from '@/api/modules/procedures';
import { formatDateTime } from '@/helpers/format';
import { disconnectEcho, getEcho } from '@/realtime/echo';

const route = useRoute();
const procedureId = computed(() => route.params.id);

const loading = ref(false);
const procedure = ref(null);
const lots = ref([]);
const myBidsByLot = ref(/** @type {Record<number, unknown[]>} */ ({}));
const bidAmounts = ref(/** @type {Record<number, number|null>} */ ({}));
const placingLotId = ref(null);
const endsAt = ref(null);
const auctionStatus = ref('');
const wsHint = ref('');

/** @type {ReturnType<typeof setInterval>|null} */
let heartbeatTimer = null;
/** @type {import('laravel-echo').default|null} */
let echo = null;
/** @type {{ stopListening?: Function, unsubscribe?: Function }|null} */
let channel = null;

/**
 * Загружает процедуру, лоты и свои ставки.
 * @returns {Promise<void>}
 */
async function load() {
    loading.value = true;
    try {
        const [procRes, lotsRes] = await Promise.all([
            proceduresApi.show(procedureId.value).catch(() => null),
            auctionApi.listLots(procedureId.value),
        ]);
        procedure.value = procRes?.data?.data ?? null;
        if (procedure.value?.ends_at) {
            endsAt.value = procedure.value.ends_at;
        }
        if (procedure.value?.status) {
            auctionStatus.value = procedure.value.status_label || procedure.value.status;
        }

        lots.value = Array.isArray(lotsRes.data.data) ? lotsRes.data.data : [];
        const bidsMap = {};
        await Promise.all(
            lots.value.map(async (lot) => {
                try {
                    const { data } = await auctionApi.listMyBids(procedureId.value, lot.id);
                    bidsMap[lot.id] = Array.isArray(data.data) ? data.data : [];
                } catch {
                    bidsMap[lot.id] = [];
                }
                if (bidAmounts.value[lot.id] == null) {
                    bidAmounts.value[lot.id] = null;
                }
            }),
        );
        myBidsByLot.value = bidsMap;
    } catch (e) {
        ElMessage.error(e?.response?.data?.message || 'Не удалось открыть аукцион');
        lots.value = [];
    } finally {
        loading.value = false;
    }
}

/**
 * Подать ставку по лоту.
 * @param {number} lotId ID лота
 * @returns {Promise<void>}
 */
async function onPlaceBid(lotId) {
    const amount = bidAmounts.value[lotId];
    if (amount == null || Number(amount) <= 0) {
        ElMessage.warning('Укажите сумму ставки');
        return;
    }
    placingLotId.value = lotId;
    try {
        await auctionApi.placeBid(procedureId.value, lotId, { amount: Number(amount) });
        ElMessage.success('Ставка принята');
        bidAmounts.value[lotId] = null;
        await load();
    } catch (e) {
        ElMessage.error(e?.response?.data?.message || 'Ставка отклонена');
    } finally {
        placingLotId.value = null;
    }
}

/**
 * HTTP presence heartbeat.
 * @returns {Promise<void>}
 */
async function sendHeartbeat() {
    try {
        await auctionApi.heartbeat(procedureId.value);
    } catch {
        // не шумим — сеть/права
    }
}

/**
 * Подписка на private auction.{id}.
 * @returns {void}
 */
function subscribeRealtime() {
    echo = getEcho();
    if (!echo) {
        wsHint.value = 'WebSocket выключен (нет VITE_REVERB_APP_KEY или VITE_REVERB_ENABLED=false). Цены обновляйте вручную / после ставки.';
        return;
    }

    wsHint.value = 'Подключено к каналу аукциона (Reverb).';
    channel = echo.private(`auction.${procedureId.value}`);

    channel.listen('.BidPlaced', (payload) => {
        const lot = lots.value.find((l) => l.id === payload.lot_id);
        if (lot) {
            lot.current_price = payload.current_price;
        }
        if (payload.ends_at) {
            endsAt.value = payload.ends_at;
        }
    });

    channel.listen('.AuctionExtended', (payload) => {
        if (payload.ends_at) {
            endsAt.value = payload.ends_at;
        }
        ElMessage.info(`Аукцион продлён на ${payload.extension_minutes || '?'} мин.`);
    });

    channel.listen('.AuctionStateChanged', (payload) => {
        auctionStatus.value = payload.status || payload.action || auctionStatus.value;
        ElMessage.info(`Статус аукциона: ${payload.action || payload.status}`);
    });

    channel.listen('.BidCancelled', (payload) => {
        const lot = lots.value.find((l) => l.id === payload.lot_id);
        if (lot && payload.current_price != null) {
            lot.current_price = payload.current_price;
        }
        load();
    });
}

/**
 * Отписка и leave.
 * @returns {Promise<void>}
 */
async function teardown() {
    if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
    }
    try {
        await auctionApi.leave(procedureId.value);
    } catch {
        // ignore
    }
    if (echo && procedureId.value) {
        echo.leave(`auction.${procedureId.value}`);
    }
    disconnectEcho();
    echo = null;
    channel = null;
}

onMounted(async () => {
    await load();
    await sendHeartbeat();
    heartbeatTimer = setInterval(sendHeartbeat, 30000);
    subscribeRealtime();
});

onUnmounted(() => {
    teardown();
});

watch(procedureId, async () => {
    await teardown();
    await load();
    await sendHeartbeat();
    heartbeatTimer = setInterval(sendHeartbeat, 30000);
    subscribeRealtime();
});
</script>

<template>
  <div class="etp-card" v-loading="loading">
    <h1>Аукцион</h1>
    <p v-if="procedure" class="muted">
      {{ procedure.number }} — {{ procedure.title }}
    </p>
    <p class="meta">
      Статус: {{ auctionStatus || '—' }}
      · Окончание: {{ formatDateTime(endsAt) }}
    </p>
    <el-alert :title="wsHint" type="info" :closable="false" show-icon class="mb" />

    <el-alert
      type="warning"
      :closable="false"
      show-icon
      class="mb"
      title="Показаны только ваши ставки. Чужие ставки и победитель до правил ТЗ не отображаются."
    />

    <div v-for="lot in lots" :key="lot.id" class="lot">
      <div class="lot__head">
        <strong>{{ lot.name }}</strong>
        <span>Текущая цена: {{ lot.current_price ?? lot.start_price }}</span>
        <span>Шаг: {{ lot.bid_step }}</span>
      </div>

      <div class="lot__bid">
        <el-input-number
          v-model="bidAmounts[lot.id]"
          :min="0"
          :step="Number(lot.bid_step) || 1"
          controls-position="right"
        />
        <el-button
          type="primary"
          :loading="placingLotId === lot.id"
          @click="onPlaceBid(lot.id)"
        >
          Сделать ставку
        </el-button>
        <el-button @click="load">Обновить</el-button>
      </div>

      <el-table
        :data="myBidsByLot[lot.id] || []"
        size="small"
        empty-text="Нет ваших ставок"
        class="mt"
      >
        <el-table-column prop="amount" label="Сумма" width="120" />
        <el-table-column label="Отменена" width="100">
          <template #default="{ row }">{{ row.is_cancelled ? 'да' : 'нет' }}</template>
        </el-table-column>
        <el-table-column label="Время">
          <template #default="{ row }">{{ formatDateTime(row.created_at) }}</template>
        </el-table-column>
      </el-table>
    </div>

    <el-empty v-if="!loading && !lots.length" description="Нет лотов или нет доступа к аукциону" />
  </div>
</template>

<style scoped>
.muted,
.meta {
  color: #6b7280;
}

.mb {
  margin: 0.75rem 0;
}

.lot {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
}

.lot__head {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.lot__bid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.mt {
  margin-top: 0.75rem;
}
</style>
