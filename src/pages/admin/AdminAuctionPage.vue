<script setup>
/**
 * Админка аукциона: настройки, lifecycle, ставки с контактами, presence.
 */
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import adminAuctionApi from '@/api/modules/adminAuction';
import { ROLES } from '@/constants/roles';
import { useAuthStore } from '@/stores/auth';
import { formatDateTime } from '@/helpers/format';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const procedureId = computed(() => route.params.id);
const canWrite = computed(() => auth.hasRole([ROLES.SUPER_ADMIN, ROLES.TRADE_ADMIN]));

const loading = ref(false);
const settings = reactive({
    bid_mode: '',
    auction_mode: '',
    extension_minutes: 5,
    extension_trigger_minutes: 5,
    idle_timeout_minutes: 30,
    forbid_equal_bids: true,
    winner_mode: '',
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

/**
 * @returns {Promise<void>}
 */
async function load() {
    loading.value = true;
    try {
        const [s, l, p, pr] = await Promise.all([
            adminAuctionApi.getSettings(procedureId.value),
            adminAuctionApi.listLots(procedureId.value),
            adminAuctionApi.presence(procedureId.value).catch(() => ({ data: { data: null } })),
            adminAuctionApi.listProtocols(procedureId.value).catch(() => ({ data: { data: [] } })),
        ]);
        const st = s.data.data ?? {};
        Object.assign(settings, {
            bid_mode: st.bid_mode ?? '',
            auction_mode: st.auction_mode ?? '',
            extension_minutes: st.extension_minutes ?? 5,
            extension_trigger_minutes: st.extension_trigger_minutes ?? 5,
            idle_timeout_minutes: st.idle_timeout_minutes ?? 30,
            forbid_equal_bids: Boolean(st.forbid_equal_bids),
            winner_mode: st.winner_mode ?? '',
            only_admitted_from_rfp: Boolean(st.only_admitted_from_rfp),
        });
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
    const labels = {
        start: 'Запустить торги?',
        pause: 'Поставить на паузу?',
        resume: 'Снять паузу?',
        finish: 'Завершить торги и назначить победителей?',
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

onMounted(load);
watch(procedureId, load);
watch(selectedLotId, loadBids);
</script>

<template>
  <div class="etp-card" v-loading="loading">
    <el-button link type="primary" @click="router.push({ name: 'admin.procedures.show', params: { id: procedureId } })">
      ← К процедуре
    </el-button>
    <h1>Аукцион #{{ procedureId }}</h1>

    <div v-if="canWrite" class="actions mb">
      <el-button type="success" @click="onLifecycle('start')">Старт</el-button>
      <el-button @click="onLifecycle('pause')">Пауза</el-button>
      <el-button @click="onLifecycle('resume')">Продолжить</el-button>
      <el-button type="danger" @click="onLifecycle('finish')">Финиш</el-button>
      <el-button @click="onProtocol">Сгенерировать PDF-протокол</el-button>
    </div>

    <h2>Настройки</h2>
    <el-form v-if="canWrite" label-position="top" class="mb" @submit.prevent="saveSettings">
      <el-row :gutter="16">
        <el-col :md="8" :sm="12">
          <el-form-item label="bid_mode">
            <el-input v-model="settings.bid_mode" />
          </el-form-item>
        </el-col>
        <el-col :md="8" :sm="12">
          <el-form-item label="auction_mode">
            <el-input v-model="settings.auction_mode" />
          </el-form-item>
        </el-col>
        <el-col :md="8" :sm="12">
          <el-form-item label="winner_mode">
            <el-input v-model="settings.winner_mode" />
          </el-form-item>
        </el-col>
        <el-col :md="8" :sm="12">
          <el-form-item label="extension_minutes">
            <el-input-number v-model="settings.extension_minutes" :min="1" />
          </el-form-item>
        </el-col>
        <el-col :md="8" :sm="12">
          <el-form-item label="idle_timeout_minutes">
            <el-input-number v-model="settings.idle_timeout_minutes" :min="1" />
          </el-form-item>
        </el-col>
        <el-col :md="8" :sm="12">
          <el-form-item label="forbid_equal_bids">
            <el-switch v-model="settings.forbid_equal_bids" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-button type="primary" native-type="submit">Сохранить настройки</el-button>
    </el-form>
    <el-descriptions v-else :column="2" border class="mb">
      <el-descriptions-item label="bid_mode">{{ settings.bid_mode }}</el-descriptions-item>
      <el-descriptions-item label="auction_mode">{{ settings.auction_mode }}</el-descriptions-item>
      <el-descriptions-item label="winner_mode">{{ settings.winner_mode }}</el-descriptions-item>
    </el-descriptions>

    <h2>Ставки по лоту</h2>
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
      <el-table-column label="Участник" min-width="160">
        <template #default="{ row }">
          {{ row.user?.email || row.user?.inn || row.user_id || '—' }}
        </template>
      </el-table-column>
      <el-table-column label="Отменена" width="100">
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

    <h2>Presence (онлайн)</h2>
    <pre class="json mb">{{ JSON.stringify(presenceData, null, 2) }}</pre>

    <h2>Протоколы</h2>
    <el-table :data="protocols" size="small" empty-text="Нет протоколов">
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="status" label="Статус" width="120" />
      <el-table-column label="Создан" width="160">
        <template #default="{ row }">{{ formatDateTime(row.created_at) }}</template>
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

.mb {
  margin-bottom: 1rem;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.json {
  font-size: 0.8rem;
  background: #f8fafc;
  padding: 0.75rem;
  max-height: 240px;
  overflow: auto;
}
</style>
