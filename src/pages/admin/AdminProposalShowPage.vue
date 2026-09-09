<script setup>
/**
 * Админка: карточка КП — допуск, документы (открыть/скачать), чат.
 */
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Download, User, View } from '@element-plus/icons-vue';
import adminProposalsApi from '@/api/modules/adminProposals';
import adminUsersApi from '@/api/modules/adminUsers';
import { ROLES } from '@/constants/roles';
import { useAuthStore } from '@/stores/auth';
import { formatDateTime } from '@/helpers/format';
import { isPdfFile, openBlobInNewTab, saveBlobAsFile } from '@/helpers/files';
import EtpIconButton from '@/components/ui/EtpIconButton.vue';
import ProposalChat from '@/components/ui/ProposalChat.vue';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

const procedureId = computed(() => route.params.id);
const proposalId = computed(() => route.params.proposalId);
const canDecide = computed(() => auth.hasRole([ROLES.SUPER_ADMIN, ROLES.TRADE_ADMIN]));

const loading = ref(false);
const proposal = ref(null);
const messages = ref([]);
const messageText = ref('');
const sending = ref(false);

/** Документы профиля организации (не файлы КП) */
const profileDocuments = ref(/** @type {Array<Record<string, unknown>>} */ ([]));
const profileDocsLoading = ref(false);

const decisionForm = reactive({
    decision: 'admit',
    reason: '',
});
const deciding = ref(false);
/** @type {ReturnType<typeof setInterval>|null} */
let pollTimer = null;

/**
 * @returns {Promise<void>}
 */
async function loadMessagesQuiet() {
    try {
        const m = await adminProposalsApi.listMessages(
            procedureId.value,
            proposalId.value,
            { skipGlobalLoader: true },
        );
        messages.value = Array.isArray(m.data.data) ? m.data.data : [];
    } catch {
        // ignore poll errors
    }
}

/**
 * @returns {Promise<void>}
 */
async function loadProfileDocuments() {
    const userId = proposal.value?.user_id;
    if (!userId) {
        profileDocuments.value = [];
        return;
    }
    profileDocsLoading.value = true;
    try {
        const { data } = await adminUsersApi.listDocuments(userId);
        profileDocuments.value = Array.isArray(data.data) ? data.data : [];
    } catch {
        profileDocuments.value = [];
    } finally {
        profileDocsLoading.value = false;
    }
}

/**
 * @returns {Promise<void>}
 */
async function load() {
    loading.value = true;
    try {
        const [p, m] = await Promise.all([
            adminProposalsApi.show(procedureId.value, proposalId.value),
            adminProposalsApi.listMessages(procedureId.value, proposalId.value),
        ]);
        proposal.value = p.data.data ?? null;
        messages.value = Array.isArray(m.data.data) ? m.data.data : [];
        await loadProfileDocuments();
    } catch (e) {
        ElMessage.error(e?.response?.data?.message || 'Не удалось открыть КП');
        proposal.value = null;
        profileDocuments.value = [];
    } finally {
        loading.value = false;
    }
}

/**
 * @returns {Promise<void>}
 */
async function onDecision() {
    if (!decisionForm.reason.trim() || decisionForm.reason.trim().length < 3) {
        ElMessage.warning('Укажите причину (мин. 3 символа)');
        return;
    }
    deciding.value = true;
    try {
        await adminProposalsApi.admission(procedureId.value, proposalId.value, {
            decision: decisionForm.decision,
            reason: decisionForm.reason.trim(),
        });
        ElMessage.success('Решение сохранено');
        decisionForm.reason = '';
        await load();
    } catch (e) {
        ElMessage.error(e?.response?.data?.message || 'Ошибка решения');
    } finally {
        deciding.value = false;
    }
}

/**
 * @param {Record<string, unknown>} row Документ
 * @returns {Promise<void>}
 */
async function onOpenDoc(row) {
    try {
        const { data } = await adminProposalsApi.downloadDocument(
            procedureId.value,
            proposalId.value,
            row.id,
            { inline: true },
        );
        openBlobInNewTab(data);
    } catch (e) {
        ElMessage.error(e?.response?.data?.message || 'Не удалось открыть файл');
    }
}

/**
 * @param {Record<string, unknown>} row Документ
 * @returns {Promise<void>}
 */
async function onDownloadDoc(row) {
    try {
        const { data } = await adminProposalsApi.downloadDocument(
            procedureId.value,
            proposalId.value,
            row.id,
        );
        saveBlobAsFile(data, String(row.file_name || 'document'));
    } catch (e) {
        ElMessage.error(e?.response?.data?.message || 'Не удалось скачать файл');
    }
}

/**
 * @param {Record<string, unknown>} row Документ профиля
 * @returns {Promise<void>}
 */
async function onOpenProfileDoc(row) {
    const userId = proposal.value?.user_id;
    if (!userId) {
        return;
    }
    try {
        const { data } = await adminUsersApi.downloadDocument(userId, row.id, { inline: true });
        openBlobInNewTab(data);
    } catch (e) {
        ElMessage.error(e?.response?.data?.message || 'Не удалось открыть файл');
    }
}

/**
 * @param {Record<string, unknown>} row Документ профиля
 * @returns {Promise<void>}
 */
async function onDownloadProfileDoc(row) {
    const userId = proposal.value?.user_id;
    if (!userId) {
        return;
    }
    try {
        const { data } = await adminUsersApi.downloadDocument(userId, row.id);
        saveBlobAsFile(data, String(row.file_name || 'document'));
    } catch (e) {
        ElMessage.error(e?.response?.data?.message || 'Не удалось скачать файл');
    }
}

/**
 * @returns {void}
 */
function openParticipantCard() {
    const userId = proposal.value?.user_id;
    if (!userId) {
        ElMessage.warning('Нет ID участника');
        return;
    }
    router.push({ name: 'admin.users', query: { user_id: String(userId) } });
}

/**
 * @returns {Promise<void>}
 */
async function onSend() {
    const text = messageText.value.trim();
    if (!text) {
        return;
    }
    sending.value = true;
    try {
        await adminProposalsApi.sendMessage(procedureId.value, proposalId.value, { message: text });
        messageText.value = '';
        ElMessage.success('Сообщение отправлено');
        await loadMessagesQuiet();
    } catch (e) {
        ElMessage.error(e?.response?.data?.message || 'Ошибка отправки');
    } finally {
        sending.value = false;
    }
}

onMounted(() => {
    load();
    pollTimer = setInterval(loadMessagesQuiet, 5000);
});
onUnmounted(() => {
    if (pollTimer) {
        clearInterval(pollTimer);
    }
});
watch([procedureId, proposalId], load);
</script>

<template>
  <div class="etp-card" v-loading="loading">
    <el-button
      link
      type="primary"
      @click="router.push({ name: 'admin.proposals', params: { id: procedureId } })"
    >
      ← К списку КП
    </el-button>

    <template v-if="proposal">
      <h1>КП #{{ proposal.id }}</h1>
      <p class="muted">
        {{ proposal.participant_name }} · {{ proposal.status_label || proposal.status }}
        · {{ formatDateTime(proposal.submitted_at) }}
      </p>
      <el-button
        v-if="proposal.user_id"
        type="primary"
        link
        class="mb"
        @click="openParticipantCard"
      >
        <el-icon class="mr"><User /></el-icon>
        Профиль участника и документы организации
      </el-button>

      <el-alert
        v-if="proposal.content_hidden"
        type="warning"
        :closable="false"
        show-icon
        class="mb"
        title="Полное содержимое КП временно недоступно."
      />

      <template v-else>
        <el-descriptions :column="1" border class="mb">
          <el-descriptions-item label="Участник">{{ proposal.participant_name }}</el-descriptions-item>
          <el-descriptions-item label="Согласие с формой договора">
            {{ formatDateTime(proposal.contract_form_agreed_at) }}
          </el-descriptions-item>
          <el-descriptions-item v-if="proposal.admission_decision" label="Допуск">
            {{ proposal.admission_decision.decision_label || proposal.admission_decision.decision }}
            — {{ proposal.admission_decision.reason }}
          </el-descriptions-item>
        </el-descriptions>

        <h2>Документы КП</h2>
        <el-table :data="proposal.documents || []" size="small" empty-text="Нет файлов" class="mb">
          <el-table-column prop="file_name" label="Файл" min-width="220" />
          <el-table-column prop="type" label="Тип" width="120" />
          <el-table-column label="Действия" width="120" fixed="right">
            <template #default="{ row }">
              <div class="etp-table-actions">
                <EtpIconButton
                  v-if="isPdfFile(row.file_name)"
                  title="Открыть PDF в новой вкладке"
                  @click="onOpenDoc(row)"
                >
                  <View />
                </EtpIconButton>
                <EtpIconButton title="Скачать" @click="onDownloadDoc(row)">
                  <Download />
                </EtpIconButton>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </template>

      <h2>Документы организации (профиль)</h2>
      <p class="hint mb">Устав и прочие файлы из личного кабинета участника — не путать с файлами КП.</p>
      <el-table
        v-loading="profileDocsLoading"
        :data="profileDocuments"
        size="small"
        empty-text="Участник ещё не загружал документы в профиль"
        class="mb"
      >
        <el-table-column prop="file_name" label="Файл" min-width="220" />
        <el-table-column label="Загружен" width="160">
          <template #default="{ row }">{{ formatDateTime(row.uploaded_at) }}</template>
        </el-table-column>
        <el-table-column label="Действия" width="120" fixed="right">
          <template #default="{ row }">
            <div class="etp-table-actions">
              <EtpIconButton
                v-if="isPdfFile(row.file_name)"
                title="Открыть PDF"
                @click="onOpenProfileDoc(row)"
              >
                <View />
              </EtpIconButton>
              <EtpIconButton title="Скачать" @click="onDownloadProfileDoc(row)">
                <Download />
              </EtpIconButton>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="canDecide" class="decision mb">
        <h2>Решение о допуске</h2>
        <p class="hint">
          (разрешение участнику участвовать дальше: допуск — заявка принята к рассмотрению/торгам;
          отклонение — отказ с обязательной причиной)
        </p>
        <el-radio-group v-model="decisionForm.decision">
          <el-radio value="admit">Допустить</el-radio>
          <el-radio value="reject">Отклонить</el-radio>
        </el-radio-group>
        <el-input
          v-model="decisionForm.reason"
          type="textarea"
          :rows="3"
          placeholder="Причина (обязательно)"
          class="mt"
        />
        <el-button type="primary" class="mt" :loading="deciding" @click="onDecision">
          Сохранить решение
        </el-button>
      </div>

      <h2>Переписка</h2>
      <ProposalChat :messages="messages" :current-user-id="auth.user?.id" />
      <template v-if="canDecide">
        <el-input v-model="messageText" type="textarea" :rows="3" class="mt" />
        <el-button type="primary" class="mt" :loading="sending" @click="onSend">Отправить</el-button>
      </template>
    </template>
  </div>
</template>

<style scoped>
.muted {
  color: #6b7280;
}

h2 {
  font-size: 1.05rem;
}

.mb {
  margin: 1rem 0;
}

.mt {
  margin-top: 0.75rem;
}

.hint {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0.35rem 0 0.75rem;
}

.mr {
  margin-right: 0.35rem;
}

.decision {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
}
</style>
