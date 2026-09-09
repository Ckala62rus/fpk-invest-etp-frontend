<script setup>
/**
 * Страница аукциона участника: лоты, свои ставки, Echo-тикер, heartbeat.
 * Presence-канал не подключаем (только админка).
 */
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import auctionApi from '@/api/modules/auction';
import proceduresApi from '@/api/modules/procedures';
import { formatDateTime } from '@/helpers/format';
import { auctionTradeBadge } from '@/helpers/auctionTrade';
import { disconnectEcho, getEcho } from '@/realtime/echo';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const procedureId = computed(() => route.params.id);

const loading = ref(false);
const procedure = ref(null);
const lots = ref([]);
const myBidsByLot = ref(/** @type {Record<number, unknown[]>} */ ({}));
const bidAmounts = ref(/** @type {Record<number, number|null>} */ ({}));
const placingLotId = ref(null);
const endsAt = ref(null);
/** Фаза торгов: pending|running|paused|finished|cancelled */
const tradeStatus = ref('');
const tradeStatusLabel = ref('');
const procedureStatusLabel = ref('');
/** Текущий пользователь — победитель хотя бы по одному лоту. */
const iAmWinner = ref(false);
const wsHint = ref('');

const tradeBadge = computed(() => auctionTradeBadge(tradeStatus.value));
/** Можно ли подавать ставку (торги идут и не на паузе). */
const canPlaceBids = computed(() => tradeStatus.value === 'running');

/** @type {ReturnType<typeof setInterval>|null} */
let heartbeatTimer = null;
/** Heartbeat только для роли participant; админ на «Вид участника» его не шлёт. */
let heartbeatAllowed = true;
/** @type {import('laravel-echo').default|null} */
let echo = null;
/** @type {{ stopListening?: Function, unsubscribe?: Function }|null} */
let channel = null;

/**
 * Применяет meta лотов / карточку процедуры к статусу торгов.
 * Приоритет: явный auction_trade_status, иначе вывод из status ТЗП (completed → finished).
 *
 * @param {Record<string, unknown>|null|undefined} meta Meta из GET lots
 * @param {Record<string, unknown>|null|undefined} proc Карточка процедуры
 * @returns {void}
 */
function applyTradeMeta(meta, proc) {
    if (meta?.ends_at) {
        endsAt.value = meta.ends_at;
    } else if (proc?.ends_at) {
        endsAt.value = proc.ends_at;
    }

    const procedureStatus = meta?.status || proc?.status || '';
    if (meta?.status_label || meta?.status) {
        procedureStatusLabel.value = meta.status_label || meta.status;
    } else if (proc?.status_label || proc?.status) {
        procedureStatusLabel.value = proc.status_label || proc.status;
    }

    const tradeCode =
        meta?.auction_trade_status ||
        proc?.auction_trade_status ||
        (procedureStatus === 'completed'
            ? 'finished'
            : procedureStatus === 'cancelled'
              ? 'cancelled'
              : meta?.is_paused || proc?.auction_is_paused
                ? 'paused'
                : procedureStatus === 'in_progress'
                  ? 'running'
                  : procedureStatus === 'auction_pending' || procedureStatus === 'draft'
                    ? 'pending'
                    : '');

    const tradeLabel =
        meta?.auction_trade_status_label ||
        proc?.auction_trade_status_label ||
        auctionTradeBadge(tradeCode).label;

    // Всегда перезаписываем — иначе после WS «Идут торги» залипает при уже завершённом аукционе
    tradeStatus.value = tradeCode || '';
    tradeStatusLabel.value = tradeCode ? tradeLabel : '';

    if (typeof meta?.i_am_winner === 'boolean') {
        iAmWinner.value = meta.i_am_winner;
    }
}

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
        const envelope = lotsRes?.data ?? {};
        applyTradeMeta(envelope.meta, procedure.value);

        lots.value = Array.isArray(envelope.data) ? envelope.data : [];
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
 * Карточка процедуры: админ — в админку (черновик на витрине не виден),
 * участник — на публичную витрину.
 * @returns {void}
 */
function openProcedureCard() {
    if (auth.isAdminArea) {
        router.push({ name: 'admin.procedures.show', params: { id: procedureId.value } });
        return;
    }
    router.push({ name: 'procedures.show', params: { id: procedureId.value } });
}

/**
 * HTTP presence heartbeat (только участник; без спиннера).
 * @returns {Promise<void>}
 */
async function sendHeartbeat() {
    if (!heartbeatAllowed || !auth.isParticipant) {
        return;
    }
    try {
        await auctionApi.heartbeat(procedureId.value);
    } catch (e) {
        const status = e?.response?.status;
        // 403 — нет роли participant / нет доступа: прекращаем опрос, экран не дёргаем
        if (status === 403 || status === 401) {
            heartbeatAllowed = false;
            stopHeartbeatTimer();
        }
    }
}

/**
 * @returns {void}
 */
function stopHeartbeatTimer() {
    if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
    }
}

/**
 * @returns {void}
 */
function startHeartbeatTimer() {
    stopHeartbeatTimer();
    if (!auth.isParticipant) {
        heartbeatAllowed = false;
        return;
    }
    heartbeatAllowed = true;
    sendHeartbeat();
    heartbeatTimer = setInterval(sendHeartbeat, 30000);
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
        // Сначала мгновенно обновляем по событию, затем сверяем с API (источник истины)
        const code =
            payload.auction_trade_status ||
            (payload.action === 'finish'
                ? 'finished'
                : payload.is_paused || payload.action === 'pause'
                  ? 'paused'
                  : payload.action === 'resume' || payload.action === 'start'
                    ? 'running'
                    : '');
        if (code) {
            tradeStatus.value = code;
            tradeStatusLabel.value =
                payload.auction_trade_status_label || auctionTradeBadge(code).label;
        }
        if (payload.status_label || payload.status) {
            procedureStatusLabel.value = payload.status_label || payload.status;
        }
        ElMessage.info(
            `Статус аукциона: ${payload.auction_trade_status_label || payload.action_label || payload.action}`,
        );
        load();
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
    stopHeartbeatTimer();
    if (auth.isParticipant) {
        try {
            await auctionApi.leave(procedureId.value);
        } catch {
            // ignore
        }
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
    startHeartbeatTimer();
    subscribeRealtime();
});

onUnmounted(() => {
    teardown();
});

watch(procedureId, async () => {
    await teardown();
    await load();
    startHeartbeatTimer();
    subscribeRealtime();
});
</script>

<template>
  <div class="etp-card" v-loading="loading">
    <div class="nav">
      <el-button link type="primary" @click="router.back()">← Назад</el-button>
      <el-button link type="primary" @click="router.push({ name: 'cabinet' })">В кабинет</el-button>
      <el-button link type="primary" @click="openProcedureCard">
        {{ auth.isAdminArea ? 'Карточка в админке' : 'Карточка процедуры' }}
      </el-button>
    </div>
    <h1>Аукцион</h1>
    <p v-if="procedure" class="muted">
      {{ procedure.number }} — {{ procedure.title }}
    </p>
    <div class="status-row">
      <el-tag :type="tradeBadge.tagType" size="large" effect="dark">
        {{ tradeStatusLabel || tradeBadge.label || '—' }}
      </el-tag>
      <span class="meta">
        <template v-if="procedureStatusLabel">ТЗП: {{ procedureStatusLabel }} · </template>
        Окончание: {{ formatDateTime(endsAt) }}
      </span>
    </div>
    <el-alert
      v-if="iAmWinner"
      type="success"
      :closable="false"
      show-icon
      class="mb"
      title="Поздравляем! Вы победитель по одному или нескольким лотам этого аукциона."
    />
    <el-alert
      v-if="tradeStatus === 'paused'"
      type="warning"
      :closable="false"
      show-icon
      class="mb"
      title="Торги на паузе. Ставки сейчас не принимаются — дождитесь возобновления."
    />
    <el-alert
      v-else-if="tradeStatus === 'pending'"
      type="info"
      :closable="false"
      show-icon
      class="mb"
      title="Аукцион ещё не запущен. Ставки будут доступны после старта торгов."
    />
    <el-alert
      v-else-if="tradeStatus === 'finished'"
      type="info"
      :closable="false"
      show-icon
      class="mb"
      title="Торги завершены. Новые ставки не принимаются."
    />
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
        <el-tag v-if="lot.i_am_winner" type="success" effect="dark" size="small">Вы победитель</el-tag>
        <span>Текущая цена: {{ lot.current_price ?? lot.start_price }}</span>
        <span>Шаг: {{ lot.bid_step }}</span>
      </div>

      <div class="lot__bid">
        <el-input-number
          v-model="bidAmounts[lot.id]"
          :min="0"
          :step="Number(lot.bid_step) || 1"
          :disabled="!canPlaceBids"
          controls-position="right"
        />
        <el-button
          type="primary"
          :loading="placingLotId === lot.id"
          :disabled="!canPlaceBids"
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
.nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.muted,
.meta {
  color: #6b7280;
}

.status-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  margin: 0.5rem 0 0.75rem;
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
