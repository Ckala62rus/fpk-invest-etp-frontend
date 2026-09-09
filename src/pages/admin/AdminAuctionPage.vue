<script setup>
/**
 * Админка аукциона: настройки (с русскими подписями), lifecycle, ставки, presence.
 */
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import adminAuctionApi from '@/api/modules/adminAuction';
import adminProceduresApi from '@/api/modules/adminProcedures';
import { ROLES } from '@/constants/roles';
import { useAuthStore } from '@/stores/auth';
import { auctionTradeBadge } from '@/helpers/auctionTrade';
import { formatDateTime } from '@/helpers/format';
import { openBlobInNewTab, saveBlobAsFile } from '@/helpers/files';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const procedureId = computed(() => route.params.id);
const canWrite = computed(() => auth.hasRole([ROLES.SUPER_ADMIN, ROLES.TRADE_ADMIN]));

/** Режим проверки шага ставки (bid_mode). */
const BID_MODES = [
    {
        value: 'standard',
        label: 'Стандартный',
        hint: 'Ставка должна быть лучше текущей цены (выше или ниже — по направлению аукциона). Шаг лота не проверяется строго.',
    },
    {
        value: 'step_minimum',
        label: 'Не меньше шага лота',
        hint: 'Разница с текущей ценой должна быть не меньше «Шага ставки» у лота. Рекомендуется для большинства торгов.',
    },
];

/** Направление торгов (auction_mode). */
const AUCTION_MODES = [
    {
        value: 'decrease',
        label: 'На понижение',
        hint: 'Типичная закупка: кто предложит меньшую цену. Новая ставка должна быть ниже текущей.',
    },
    {
        value: 'increase',
        label: 'На повышение',
        hint: 'Кто даст больше (продажа / торги вверх). Новая ставка должна быть выше текущей.',
    },
];

/** Как выбрать победителя при финише (winner_mode). */
const WINNER_MODES = [
    {
        value: 'per_lot',
        label: 'Победитель по каждому лоту',
        hint: 'У каждого лота свой победитель — лучшая неотменённая ставка по этому лоту.',
    },
    {
        value: 'total_sum',
        label: 'Победитель по сумме лотов',
        hint: 'Ищет участника с лучшей суммой по всем лотам (нужны ставки по каждому лоту); иначе запасной расчёт как «по лотам».',
    },
];

const loading = ref(false);
/** Карточка ТЗП: status + фаза торгов (пауза отдельно от in_progress). */
const procedure = ref(null);
const isPaused = ref(false);
const settings = reactive({
    bid_mode: 'step_minimum',
    auction_mode: 'decrease',
    extension_minutes: 5,
    extension_trigger_minutes: 5,
    idle_timeout_minutes: 30,
    forbid_equal_bids: true,
    winner_mode: 'per_lot',
    only_admitted_from_rfp: false,
});
const lots = ref([]);
const selectedLotId = ref(null);
const bids = ref([]);
const presenceData = ref(null);
const protocols = ref([]);
const cancelReason = ref('');
const cancelBidId = ref(null);
const cancelVisible = ref(false);

const tradeBadge = computed(() =>
    auctionTradeBadge(procedure.value?.auction_trade_status),
);

/** Фаза торгов с учётом is_paused из настроек (если карточка ещё не подгрузилась). */
const tradePhase = computed(() => {
    const fromProc = procedure.value?.auction_trade_status;
    if (fromProc) {
        return fromProc;
    }
    if (isPaused.value) {
        return 'paused';
    }
    return '';
});

/** Старт: только из «ожидает аукциона» (бэкенд не примет из черновика). */
const showStart = computed(
    () => tradePhase.value === 'pending' && procedure.value?.status === 'auction_pending',
);
/** Пауза: торги идут. */
const showPause = computed(() => tradePhase.value === 'running');
/** Продолжить: только на паузе. */
const showResume = computed(() => tradePhase.value === 'paused');
/** Финиш: пока торги активны (идут или на паузе). */
const showFinish = computed(
    () => tradePhase.value === 'running' || tradePhase.value === 'paused',
);
/** PDF: после старта (в т.ч. после финиша — перегенерация). */
const showProtocol = computed(
    () => ['running', 'paused', 'finished'].includes(tradePhase.value),
);

/** Лоты с назначенным победителем (после финиша). */
const lotsWithWinners = computed(() =>
    (lots.value || []).filter((lot) => lot.winner_user_id || lot.winner),
);

/**
 * @param {Array<{ value: string, label: string }>} options Список
 * @param {string} value Текущее значение
 * @returns {string}
 */
function optionLabel(options, value) {
    return options.find((o) => o.value === value)?.label || value || '—';
}

/**
 * @returns {Promise<void>}
 */
async function load() {
    loading.value = true;
    try {
        const [s, l, p, pr, proc] = await Promise.all([
            adminAuctionApi.getSettings(procedureId.value),
            adminAuctionApi.listLots(procedureId.value),
            adminAuctionApi.presence(procedureId.value).catch(() => ({ data: { data: null } })),
            adminAuctionApi.listProtocols(procedureId.value).catch(() => ({ data: { data: [] } })),
            adminProceduresApi.show(procedureId.value).catch(() => null),
        ]);
        const st = s.data.data ?? {};
        Object.assign(settings, {
            bid_mode: st.bid_mode || 'step_minimum',
            auction_mode: st.auction_mode || 'decrease',
            extension_minutes: st.extension_minutes ?? 5,
            extension_trigger_minutes: st.extension_trigger_minutes ?? 5,
            idle_timeout_minutes: st.idle_timeout_minutes ?? 30,
            forbid_equal_bids: Boolean(st.forbid_equal_bids),
            winner_mode: st.winner_mode || 'per_lot',
            only_admitted_from_rfp: Boolean(st.only_admitted_from_rfp),
        });
        isPaused.value = Boolean(st.is_paused);
        procedure.value = proc?.data?.data ?? null;
        if (procedure.value && procedure.value.auction_is_paused != null) {
            isPaused.value = Boolean(procedure.value.auction_is_paused);
        }
        lots.value = Array.isArray(l.data.data) ? l.data.data : [];
        if (!selectedLotId.value && lots.value.length) {
            selectedLotId.value = lots.value[0].id;
        }
        presenceData.value = p.data.data ?? null;
        protocols.value = Array.isArray(pr.data.data) ? pr.data.data : [];
        if (selectedLotId.value) {
            await loadBids();
        }
    } catch (e) {
        ElMessage.error(e?.response?.data?.message || 'Не удалось загрузить аукцион');
    } finally {
        loading.value = false;
    }
}

/**
 * @returns {Promise<void>}
 */
async function loadBids() {
    if (!selectedLotId.value) {
        bids.value = [];
        return;
    }
    try {
        const { data } = await adminAuctionApi.listLotBids(procedureId.value, selectedLotId.value);
        bids.value = Array.isArray(data.data) ? data.data : [];
    } catch (e) {
        ElMessage.error(e?.response?.data?.message || 'Ошибка загрузки ставок');
        bids.value = [];
    }
}

/**
 * @returns {Promise<void>}
 */
async function saveSettings() {
    try {
        await adminAuctionApi.updateSettings(procedureId.value, { ...settings });
        ElMessage.success('Настройки сохранены');
    } catch (e) {
        ElMessage.error(e?.response?.data?.message || 'Ошибка сохранения');
    }
}

/**
 * @param {'start'|'pause'|'resume'|'finish'} action Действие
 * @returns {Promise<void>}
 */
async function onLifecycle(action) {
    const winnerLabel = optionLabel(WINNER_MODES, settings.winner_mode);
    const labels = {
        start: 'Запустить торги? Участники смогут подавать ставки.',
        pause: 'Поставить на паузу? Новые ставки временно нельзя.',
        resume: 'Снять паузу и продолжить торги?',
        finish: `Завершить торги и назначить победителей по правилу «${winnerLabel}»?`,
    };
    await ElMessageBox.confirm(labels[action], 'Аукцион');
    try {
        await adminAuctionApi.lifecycle(procedureId.value, action);
        ElMessage.success('Готово');
        await load();
    } catch (e) {
        if (e !== 'cancel') {
            ElMessage.error(e?.response?.data?.message || 'Ошибка');
        }
    }
}

/**
 * @param {number} bidId ID ставки
 * @returns {void}
 */
function openCancel(bidId) {
    cancelBidId.value = bidId;
    cancelReason.value = '';
    cancelVisible.value = true;
}

/**
 * @returns {Promise<void>}
 */
async function submitCancel() {
    try {
        await adminAuctionApi.cancelBid(procedureId.value, cancelBidId.value, {
            reason: cancelReason.value,
        });
        cancelVisible.value = false;
        ElMessage.success('Ставка отменена');
        await loadBids();
    } catch (e) {
        ElMessage.error(e?.response?.data?.message || 'Ошибка отмены');
    }
}

/**
 * @returns {Promise<void>}
 */
async function onProtocol() {
    try {
        await adminAuctionApi.generateProtocol(procedureId.value);
        ElMessage.success('Протокол поставлен в очередь');
        await load();
    } catch (e) {
        ElMessage.error(e?.response?.data?.message || 'Ошибка');
    }
}

/**
 * Скачать PDF-протокол.
 *
 * @param {{ id: number }} row Строка протокола
 * @returns {Promise<void>}
 */
async function onDownloadProtocol(row) {
    try {
        const { data } = await adminAuctionApi.downloadProtocol(procedureId.value, row.id);
        if (data instanceof Blob && data.type && data.type.includes('json')) {
            const text = await data.text();
            const parsed = JSON.parse(text);
            throw new Error(parsed.message || 'Не удалось скачать протокол');
        }
        saveBlobAsFile(data, `protocol-${procedureId.value}-${row.id}.pdf`);
        ElMessage.success('Файл скачан');
    } catch (e) {
        let msg = e?.message || e?.response?.data?.message || 'Не удалось скачать протокол';
        if (e?.response?.data instanceof Blob) {
            try {
                const text = await e.response.data.text();
                msg = JSON.parse(text)?.message || msg;
            } catch {
                // ignore
            }
        }
        ElMessage.error(msg);
    }
}

/**
 * Открыть PDF в новой вкладке.
 *
 * @param {{ id: number }} row Строка протокола
 * @returns {Promise<void>}
 */
async function onOpenProtocol(row) {
    try {
        const { data } = await adminAuctionApi.downloadProtocol(procedureId.value, row.id);
        if (data instanceof Blob && data.type && data.type.includes('json')) {
            const text = await data.text();
            const parsed = JSON.parse(text);
            throw new Error(parsed.message || 'Не удалось открыть протокол');
        }
        openBlobInNewTab(data);
    } catch (e) {
        let msg = e?.message || e?.response?.data?.message || 'Не удалось открыть протокол';
        if (e?.response?.data instanceof Blob) {
            try {
                const text = await e.response.data.text();
                msg = JSON.parse(text)?.message || msg;
            } catch {
                // ignore
            }
        }
        ElMessage.error(msg);
    }
}

onMounted(load);
watch(procedureId, load);
watch(selectedLotId, loadBids);
</script>

<template>
  <div class="etp-card" v-loading="loading">
    <el-button link type="primary" @click="router.push({ name: 'admin.procedures.show', params: { id: procedureId } })">
      ← К процедуре
    </el-button>
    <h1>Управление аукционом #{{ procedureId }}</h1>
    <div class="status-row mb">
      <el-tag :type="tradeBadge.tagType" size="large" effect="dark">
        {{ procedure?.auction_trade_status_label || tradeBadge.label }}
      </el-tag>
      <span v-if="procedure" class="status-meta">
        Статус ТЗП: {{ procedure.status_label || procedure.status }}
        <template v-if="isPaused && procedure.auction_setting?.paused_at">
          · пауза с {{ formatDateTime(procedure.auction_setting.paused_at) }}
        </template>
      </span>
    </div>
    <el-alert
      v-if="isPaused"
      type="warning"
      :closable="false"
      show-icon
      class="mb"
      title="Торги на паузе — участники не могут подавать ставки, пока не нажмёте «Продолжить»."
    />
    <p class="intro">
      <template v-if="showStart">
        Сохраните настройки и лоты, затем нажмите <strong>Старт</strong> — участники смогут ставить.
      </template>
      <template v-else-if="showPause">
        Торги идут. Можно поставить <strong>Паузу</strong> или завершить кнопкой <strong>Финиш</strong>.
      </template>
      <template v-else-if="showResume">
        Торги на паузе. Нажмите <strong>Продолжить</strong> или завершите кнопкой <strong>Финиш</strong>.
      </template>
      <template v-else-if="tradePhase === 'finished'">
        Торги завершены. При необходимости перегенерируйте PDF-протокол.
      </template>
      <template v-else>
        Сначала сохраните настройки и убедитесь, что есть лоты. Затем опубликуйте процедуру
        (статус «ожидает аукциона») и нажмите <strong>Старт</strong>.
      </template>
    </p>

    <div v-if="canWrite" class="actions mb">
      <el-button v-if="showStart" type="success" @click="onLifecycle('start')">Старт</el-button>
      <el-button v-if="showPause" @click="onLifecycle('pause')">Пауза</el-button>
      <el-button v-if="showResume" type="warning" @click="onLifecycle('resume')">Продолжить</el-button>
      <el-button v-if="showFinish" type="danger" @click="onLifecycle('finish')">Финиш</el-button>
      <el-button v-if="showProtocol" @click="onProtocol">Сгенерировать PDF-протокол</el-button>
      <span
        v-if="!showStart && !showPause && !showResume && !showFinish && !showProtocol"
        class="status-meta"
      >
        Нет доступных действий для текущего статуса.
      </span>
    </div>

    <h2>Настройки торгов</h2>
    <el-form v-if="canWrite" label-position="top" class="mb settings-form" @submit.prevent="saveSettings">
      <el-row :gutter="16">
        <el-col :md="12" :sm="24">
          <el-form-item label="Направление аукциона">
            <el-select v-model="settings.auction_mode" style="width: 100%">
              <el-option
                v-for="opt in AUCTION_MODES"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
            <div class="field-hint">
              {{ AUCTION_MODES.find((o) => o.value === settings.auction_mode)?.hint }}
            </div>
          </el-form-item>
        </el-col>
        <el-col :md="12" :sm="24">
          <el-form-item label="Правило шага ставки">
            <el-select v-model="settings.bid_mode" style="width: 100%">
              <el-option
                v-for="opt in BID_MODES"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
            <div class="field-hint">
              {{ BID_MODES.find((o) => o.value === settings.bid_mode)?.hint }}
            </div>
          </el-form-item>
        </el-col>
        <el-col :md="12" :sm="24">
          <el-form-item label="Как определить победителя">
            <el-select v-model="settings.winner_mode" style="width: 100%">
              <el-option
                v-for="opt in WINNER_MODES"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
            <div class="field-hint">
              {{ WINNER_MODES.find((o) => o.value === settings.winner_mode)?.hint }}
            </div>
          </el-form-item>
        </el-col>
        <el-col :md="12" :sm="24">
          <el-form-item label="Запретить равные ставки">
            <el-switch v-model="settings.forbid_equal_bids" />
            <div class="field-hint">
              Если включено — нельзя поставить ту же сумму, что уже есть у другого участника
              (нужно улучшить цену).
            </div>
          </el-form-item>
        </el-col>
        <el-col :md="8" :sm="12">
          <el-form-item label="Продление, минут">
            <el-input-number v-model="settings.extension_minutes" :min="1" style="width: 100%" />
            <div class="field-hint">
              На сколько минут сдвигается окончание торгов, если ставка пришла в «зоне продления».
            </div>
          </el-form-item>
        </el-col>
        <el-col :md="8" :sm="12">
          <el-form-item label="Зона продления, минут до конца">
            <el-input-number v-model="settings.extension_trigger_minutes" :min="1" style="width: 100%" />
            <div class="field-hint">
              За сколько минут до конца ставка уже запускает автопродление.
              Пример: 5 — ставка в последние 5 минут продлевает торги.
            </div>
          </el-form-item>
        </el-col>
        <el-col :md="8" :sm="12">
          <el-form-item label="Таймаут бездействия, минут">
            <el-input-number v-model="settings.idle_timeout_minutes" :min="0" :max="1440" style="width: 100%" />
            <div class="field-hint">
              Сколько минут без ставок до автозавершения торгов.
              <strong>0 — выкл</strong> (не закрывать из‑за простоя; останутся только срок окончания
              и кнопка «Финиш»). По умолчанию 30. Меняется до старта торгов.
            </div>
          </el-form-item>
        </el-col>
        <el-col :md="12" :sm="24">
          <el-form-item label="Только допущенные с этапа КП">
            <el-switch v-model="settings.only_admitted_from_rfp" />
            <div class="field-hint">
              Включайте, если к аукциону пускают только участников, которых допустили
              по связанному запросу коммерческих предложений. Для обычного аукциона оставьте выкл.
            </div>
          </el-form-item>
        </el-col>
      </el-row>
      <el-button type="primary" native-type="submit">Сохранить настройки</el-button>
    </el-form>

    <el-descriptions v-else :column="1" border class="mb">
      <el-descriptions-item label="Направление">
        {{ optionLabel(AUCTION_MODES, settings.auction_mode) }}
      </el-descriptions-item>
      <el-descriptions-item label="Правило шага">
        {{ optionLabel(BID_MODES, settings.bid_mode) }}
      </el-descriptions-item>
      <el-descriptions-item label="Победитель">
        {{ optionLabel(WINNER_MODES, settings.winner_mode) }}
      </el-descriptions-item>
    </el-descriptions>

    <h2>Победители по лотам</h2>
    <el-table
      v-if="lotsWithWinners.length"
      :data="lotsWithWinners"
      size="small"
      class="mb"
      empty-text="Победители ещё не назначены"
    >
      <el-table-column prop="name" label="Лот" min-width="160" />
      <el-table-column label="Итог. цена" width="110">
        <template #default="{ row }">{{ row.current_price ?? row.start_price }}</template>
      </el-table-column>
      <el-table-column label="ИНН" width="130">
        <template #default="{ row }">{{ row.winner?.inn || '—' }}</template>
      </el-table-column>
      <el-table-column label="Организация / ФИО" min-width="180">
        <template #default="{ row }">{{ row.winner?.organization_name || '—' }}</template>
      </el-table-column>
      <el-table-column label="Email" min-width="180">
        <template #default="{ row }">{{ row.winner?.email || '—' }}</template>
      </el-table-column>
    </el-table>
    <p v-else class="field-hint mb">
      Появятся после «Финиш» (или автозавершения). Пока идут торги — смотрите ставки ниже.
    </p>

    <h2>Ставки по лоту</h2>
    <p class="field-hint mb">Выберите лот — ниже все ставки с контактами авторов (только для админа).</p>
    <el-select v-model="selectedLotId" placeholder="Лот" style="width: 280px; margin-bottom: 0.75rem">
      <el-option
        v-for="lot in lots"
        :key="lot.id"
        :label="`${lot.name} (#${lot.id})`"
        :value="lot.id"
      />
    </el-select>
    <el-table :data="bids" size="small" empty-text="Нет ставок" class="mb">
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="amount" label="Сумма" width="100" />
      <el-table-column label="" width="120">
        <template #default="{ row }">
          <el-tag v-if="row.is_lot_winner" type="success" effect="dark" size="small">Победитель</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="ИНН" width="130">
        <template #default="{ row }">{{ row.user?.inn || '—' }}</template>
      </el-table-column>
      <el-table-column label="Организация / ФИО" min-width="160">
        <template #default="{ row }">{{ row.user?.organization_name || '—' }}</template>
      </el-table-column>
      <el-table-column label="Email" min-width="160">
        <template #default="{ row }">{{ row.user?.email || '—' }}</template>
      </el-table-column>
      <el-table-column label="Отменена" width="90">
        <template #default="{ row }">{{ row.is_cancelled ? 'да' : 'нет' }}</template>
      </el-table-column>
      <el-table-column label="Время" width="150">
        <template #default="{ row }">{{ formatDateTime(row.created_at) }}</template>
      </el-table-column>
      <el-table-column v-if="canWrite" label="" width="110">
        <template #default="{ row }">
          <el-button
            v-if="!row.is_cancelled"
            link
            type="danger"
            @click="openCancel(row.id)"
          >
            Отменить
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <h2>Кто онлайн</h2>
    <p class="field-hint">Участники на странице аукциона сейчас и приглашённые, кто ещё не заходил.</p>
    <pre class="json mb">{{ JSON.stringify(presenceData, null, 2) }}</pre>

    <h2>Протоколы</h2>
    <p class="field-hint mb">
      PDF формируется при финише и по кнопке «Сгенерировать». Скачайте нужную версию ниже.
    </p>
    <el-table :data="protocols" size="small" empty-text="Нет протоколов">
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column label="Сформирован" width="170">
        <template #default="{ row }">{{ formatDateTime(row.generated_at) }}</template>
      </el-table-column>
      <el-table-column label="Кем" width="120">
        <template #default="{ row }">
          {{ row.generated_by ? `user #${row.generated_by}` : 'авто' }}
        </template>
      </el-table-column>
      <el-table-column label="" width="200" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="onOpenProtocol(row)">Открыть</el-button>
          <el-button link type="primary" @click="onDownloadProtocol(row)">Скачать</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="cancelVisible" title="Отмена ставки" width="420px">
      <el-input v-model="cancelReason" type="textarea" :rows="3" placeholder="Причина" />
      <template #footer>
        <el-button @click="cancelVisible = false">Отмена</el-button>
        <el-button type="danger" @click="submitCancel">Отменить ставку</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
h2 {
  font-size: 1.05rem;
  margin-top: 1.25rem;
}

.intro {
  color: #6b7280;
  font-size: 0.95rem;
  line-height: 1.45;
  margin: 0 0 1rem;
}

.status-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}

.status-meta {
  color: #6b7280;
  font-size: 0.9rem;
}

.mb {
  margin-bottom: 1rem;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.field-hint {
  margin-top: 0.35rem;
  color: #6b7280;
  font-size: 0.8rem;
  line-height: 1.35;
  width: 100%;
}

.settings-form :deep(.el-form-item) {
  margin-bottom: 1.1rem;
}

.json {
  font-size: 0.8rem;
  background: #f8fafc;
  padding: 0.75rem;
  max-height: 240px;
  overflow: auto;
}
</style>
