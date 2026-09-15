<script setup>
/**
 * Карточка своего КП: документация ТЗП, файлы КП и переписка.
 */
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Delete, Download, View } from '@element-plus/icons-vue';
import proposalsApi from '@/api/modules/proposals';
import apiClient from '@/api/axios';
import urls from '@/api/urls';
import { DOCUMENT_ACCEPT, DOCUMENT_FORMATS_HINT } from '@/constants/documents';
import { rememberProposalId } from '@/helpers/myProposals';
import { apiErrorMessage, formatDateTime } from '@/helpers/format';
import { confirmAction } from '@/helpers/confirm';
import { isPdfFile, openBlobInNewTab, saveBlobAsFile } from '@/helpers/files';
import { useAuthStore } from '@/stores/auth';
import EtpIconButton from '@/components/ui/EtpIconButton.vue';
import ProposalChat from '@/components/ui/ProposalChat.vue';

const auth = useAuthStore();
const route = useRoute();
const proposalId = computed(() => route.params.id);

const loading = ref(false);
const proposal = ref(null);
const documents = ref([]);
const messages = ref([]);
const messageText = ref('');
const sending = ref(false);
const uploading = ref(false);
/** @type {ReturnType<typeof setInterval>|null} */
let pollTimer = null;

/** Документы ТЗП, загруженные администратором */
const procedureDocuments = computed(() => {
    const list = proposal.value?.procedure?.documents;
    return Array.isArray(list) ? list : [];
});

/**
 * @returns {Promise<void>}
 */
async function loadMessagesQuiet() {
    try {
        const msgRes = await proposalsApi.listMessages(proposalId.value, { skipGlobalLoader: true });
        messages.value = Array.isArray(msgRes.data.data) ? msgRes.data.data : [];
    } catch {
        // polling ignore
    }
}

/**
 * @returns {Promise<void>}
 */
async function load() {
    loading.value = true;
    try {
        const { data } = await proposalsApi.show(proposalId.value);
        proposal.value = data.data ?? null;
        if (proposal.value?.id) {
            rememberProposalId(proposal.value.id);
        }

        const [docsRes, msgRes] = await Promise.all([
            proposalsApi.listDocuments(proposalId.value),
            proposalsApi.listMessages(proposalId.value),
        ]);
        documents.value = Array.isArray(docsRes.data.data) ? docsRes.data.data : [];
        messages.value = Array.isArray(msgRes.data.data) ? msgRes.data.data : [];
    } catch (e) {
        ElMessage.error(apiErrorMessage(e, 'Не удалось открыть КП'));
        proposal.value = null;
    } finally {
        loading.value = false;
    }
}

/**
 * @param {{ raw: File }} uploadFile Файл
 * @returns {Promise<void>}
 */
async function onUpload({ raw }) {
    if (!raw) {
        return;
    }
    uploading.value = true;
    try {
        await proposalsApi.uploadDocument(proposalId.value, raw);
        ElMessage.success('Файл загружен');
        await load();
    } catch (e) {
        ElMessage.error(apiErrorMessage(e, 'Ошибка загрузки'));
    } finally {
        uploading.value = false;
    }
}

/**
 * @param {Record<string, unknown>} row Документ КП
 * @returns {Promise<void>}
 */
async function onOpenDoc(row) {
    try {
        const { data } = await proposalsApi.downloadDocument(proposalId.value, row.id, { inline: true });
        openBlobInNewTab(data);
    } catch (e) {
        ElMessage.error(apiErrorMessage(e, 'Не удалось открыть файл'));
    }
}

/**
 * @param {Record<string, unknown>} row Документ КП
 * @returns {Promise<void>}
 */
async function onDownloadDoc(row) {
    try {
        const { data } = await proposalsApi.downloadDocument(proposalId.value, row.id);
        saveBlobAsFile(data, String(row.file_name || 'document'));
    } catch (e) {
        ElMessage.error(apiErrorMessage(e, 'Не удалось скачать файл'));
    }
}

/**
 * Скачать конкурсный файл ТЗП (загружен админом).
 *
 * @param {Record<string, unknown>} row Документ процедуры
 * @returns {Promise<void>}
 */
async function onDownloadProcedureDoc(row) {
    const procedureId = proposal.value?.procedure_id || proposal.value?.procedure?.id;
    if (!procedureId) {
        return;
    }
    try {
        const { data } = await apiClient.get(
            urls.publicProcedureDocumentDownload(procedureId, row.id),
            { responseType: 'blob' },
        );
        saveBlobAsFile(data, String(row.file_name || 'document'));
    } catch (e) {
        ElMessage.error(apiErrorMessage(e, 'Не удалось скачать файл процедуры'));
    }
}

/**
 * @param {Record<string, unknown>} row Документ процедуры
 * @returns {Promise<void>}
 */
async function onOpenProcedureDoc(row) {
    const procedureId = proposal.value?.procedure_id || proposal.value?.procedure?.id;
    if (!procedureId) {
        return;
    }
    try {
        const { data } = await apiClient.get(
            urls.publicProcedureDocumentDownload(procedureId, row.id),
            {
                responseType: 'blob',
                params: { inline: 1 },
            },
        );
        openBlobInNewTab(data);
    } catch (e) {
        ElMessage.error(apiErrorMessage(e, 'Не удалось открыть файл процедуры'));
    }
}

/**
 * @param {number} documentId ID файла
 * @returns {Promise<void>}
 */
async function onDeleteDoc(documentId) {
    const ok = await confirmAction('Удалить этот файл?', 'Удаление документа');
    if (!ok) {
        return;
    }
    try {
        await proposalsApi.deleteDocument(proposalId.value, documentId);
        ElMessage.success('Файл удалён');
        await load();
    } catch (e) {
        ElMessage.error(apiErrorMessage(e, 'Не удалось удалить'));
    }
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
        await proposalsApi.sendMessage(proposalId.value, { message: text });
        messageText.value = '';
        ElMessage.success('Сообщение отправлено');
        await loadMessagesQuiet();
    } catch (e) {
        ElMessage.error(apiErrorMessage(e, 'Не удалось отправить'));
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
watch(proposalId, load);
</script>

<template>
  <div class="etp-card" v-loading="loading">
    <el-button link type="primary" @click="$router.push({ name: 'cabinet.proposals' })">
      ← К списку КП
    </el-button>

    <template v-if="proposal">
      <h1>КП #{{ proposal.id }}</h1>
      <p class="muted">
        {{ proposal.procedure?.number || `Процедура ${proposal.procedure_id}` }}
        · {{ proposal.status_label || proposal.status }}
        · подано {{ formatDateTime(proposal.submitted_at) }}
      </p>

      <template v-if="proposal.field_values?.length">
        <h2>Ответы по полям анкеты</h2>
        <el-descriptions :column="1" border class="mt">
          <el-descriptions-item
            v-for="(fv, idx) in proposal.field_values"
            :key="fv.procedure_custom_field_id ?? idx"
            :label="fv.label || `Поле #${fv.procedure_custom_field_id}`"
          >
            {{ fv.value || '—' }}
          </el-descriptions-item>
        </el-descriptions>
      </template>

      <h2>Документация процедуры</h2>
      <p class="muted hint">
        Файлы ТЗ и конкурсной документации, которые загрузил администратор. Только скачивание / просмотр.
      </p>
      <el-table
        :data="procedureDocuments"
        size="small"
        empty-text="Администратор ещё не загрузил документы по процедуре"
        class="mt"
      >
        <el-table-column prop="file_name" label="Файл" min-width="220" />
        <el-table-column label="Действия" width="120" fixed="right">
          <template #default="{ row }">
            <div class="etp-table-actions">
              <EtpIconButton
                v-if="isPdfFile(row.file_name)"
                title="Открыть PDF"
                @click="onOpenProcedureDoc(row)"
              >
                <View />
              </EtpIconButton>
              <EtpIconButton title="Скачать" @click="onDownloadProcedureDoc(row)">
                <Download />
              </EtpIconButton>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <h2>Ваши документы КП</h2>
      <p class="muted hint">{{ DOCUMENT_FORMATS_HINT }}</p>
      <el-upload
        :auto-upload="false"
        :show-file-list="false"
        :accept="DOCUMENT_ACCEPT"
        :disabled="uploading"
        @change="onUpload"
      >
        <el-button :loading="uploading">Загрузить файл</el-button>
      </el-upload>
      <el-table :data="documents" size="small" empty-text="Нет файлов" class="mt">
        <el-table-column prop="file_name" label="Файл" min-width="200" />
        <el-table-column prop="type" label="Тип" width="120" />
        <el-table-column label="Действия" width="150" fixed="right">
          <template #default="{ row }">
            <div class="etp-table-actions">
              <EtpIconButton
                v-if="isPdfFile(row.file_name)"
                title="Открыть в новой вкладке"
                @click="onOpenDoc(row)"
              >
                <View />
              </EtpIconButton>
              <EtpIconButton title="Скачать" @click="onDownloadDoc(row)">
                <Download />
              </EtpIconButton>
              <EtpIconButton type="danger" title="Удалить" @click="onDeleteDoc(row.id)">
                <Delete />
              </EtpIconButton>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <h2 class="mt">Переписка с администратором</h2>
      <ProposalChat :messages="messages" :current-user-id="auth.user?.id" />
      <el-input v-model="messageText" type="textarea" :rows="3" placeholder="Текст сообщения" class="mt" />
      <el-button type="primary" class="mt" :loading="sending" @click="onSend">Отправить</el-button>
    </template>
  </div>
</template>

<style scoped>
.muted {
  color: #6b7280;
}

h2 {
  font-size: 1.05rem;
  margin-top: 1.25rem;
}

.mt {
  margin-top: 0.75rem;
}

.hint {
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}
</style>
