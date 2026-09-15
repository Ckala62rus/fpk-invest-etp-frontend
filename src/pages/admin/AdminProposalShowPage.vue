<script setup>
/**
 * Админка: карточка КП — документы (открыть/скачать), ответы полей, чат, профиль участника.
 */
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Download, User, View } from '@element-plus/icons-vue';
import adminProposalsApi from '@/api/modules/adminProposals';
import { ROLES } from '@/constants/roles';
import { useAuthStore } from '@/stores/auth';
import { apiErrorMessage, formatDateTime } from '@/helpers/format';
import { isPdfFile, openBlobInNewTab, saveBlobAsFile } from '@/helpers/files';
import EtpIconButton from '@/components/ui/EtpIconButton.vue';
import ProposalChat from '@/components/ui/ProposalChat.vue';
import UserOrgDialog from '@/components/admin/UserOrgDialog.vue';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

const procedureId = computed(() => route.params.id);
const proposalId = computed(() => route.params.proposalId);
const canMessage = computed(() => auth.hasRole([ROLES.SUPER_ADMIN, ROLES.TRADE_ADMIN]));

const loading = ref(false);
const proposal = ref(null);
const messages = ref([]);
const messageText = ref('');
const sending = ref(false);

const orgDialogVisible = ref(false);
/** @type {import('vue').Ref<number|string|null>} */
const orgDialogUserId = ref(null);

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
async function load() {
    loading.value = true;
    try {
        const [p, m] = await Promise.all([
            adminProposalsApi.show(procedureId.value, proposalId.value),
            adminProposalsApi.listMessages(procedureId.value, proposalId.value),
        ]);
        proposal.value = p.data.data ?? null;
        messages.value = Array.isArray(m.data.data) ? m.data.data : [];
    } catch (e) {
        ElMessage.error(apiErrorMessage(e, 'Не удалось открыть КП'));
        proposal.value = null;
    } finally {
        loading.value = false;
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
        ElMessage.error(apiErrorMessage(e, 'Не удалось открыть файл'));
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
        ElMessage.error(apiErrorMessage(e, 'Не удалось скачать файл'));
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
    orgDialogUserId.value = userId;
    orgDialogVisible.value = true;
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
        ElMessage.error(apiErrorMessage(e, 'Ошибка отправки'));
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
        </el-descriptions>

        <template v-if="proposal.field_values?.length">
          <h2>Ответы по полям анкеты</h2>
          <el-descriptions :column="1" border class="mb">
            <el-descriptions-item
              v-for="(fv, idx) in proposal.field_values"
              :key="fv.procedure_custom_field_id ?? idx"
              :label="fv.label || `Поле #${fv.procedure_custom_field_id}`"
            >
              {{ fv.value || '—' }}
            </el-descriptions-item>
          </el-descriptions>
        </template>

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

      <h2>Переписка</h2>
      <ProposalChat :messages="messages" :current-user-id="auth.user?.id" />
      <template v-if="canMessage">
        <el-input v-model="messageText" type="textarea" :rows="3" class="mt" />
        <el-button type="primary" class="mt" :loading="sending" @click="onSend">Отправить</el-button>
      </template>
    </template>

    <UserOrgDialog v-model="orgDialogVisible" :user-id="orgDialogUserId" />
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

.mr {
  margin-right: 0.35rem;
}
</style>
