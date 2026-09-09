<script setup>
/**
 * Карточка своего КП: документы и переписка.
 */
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Delete } from '@element-plus/icons-vue';
import proposalsApi from '@/api/modules/proposals';
import { rememberProposalId } from '@/helpers/myProposals';
import { formatDateTime } from '@/helpers/format';
import EtpIconButton from '@/components/ui/EtpIconButton.vue';

const route = useRoute();
const proposalId = computed(() => route.params.id);

const loading = ref(false);
const proposal = ref(null);
const documents = ref([]);
const messages = ref([]);
const messageText = ref('');
const sending = ref(false);
const uploading = ref(false);

/**
 * Загружает КП, документы и сообщения.
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
        ElMessage.error(e?.response?.data?.message || 'Не удалось открыть КП');
        proposal.value = null;
    } finally {
        loading.value = false;
    }
}

/**
 * Загрузка файла к КП.
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
        ElMessage.error(e?.response?.data?.message || 'Ошибка загрузки');
    } finally {
        uploading.value = false;
    }
}

/**
 * Удаление документа.
 * @param {number} documentId ID файла
 * @returns {Promise<void>}
 */
async function onDeleteDoc(documentId) {
    try {
        await proposalsApi.deleteDocument(proposalId.value, documentId);
        ElMessage.success('Файл удалён');
        await load();
    } catch (e) {
        ElMessage.error(e?.response?.data?.message || 'Не удалось удалить');
    }
}

/**
 * Отправка сообщения в переписке.
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
        await load();
    } catch (e) {
        ElMessage.error(e?.response?.data?.message || 'Не удалось отправить');
    } finally {
        sending.value = false;
    }
}

onMounted(load);
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
        Процедура {{ proposal.procedure_id }} · {{ proposal.status_label || proposal.status }}
        · подано {{ formatDateTime(proposal.submitted_at) }}
      </p>

      <h2>Документы</h2>
      <el-upload :auto-upload="false" :show-file-list="false" :disabled="uploading" @change="onUpload">
        <el-button :loading="uploading">Загрузить файл</el-button>
      </el-upload>
      <el-table :data="documents" size="small" empty-text="Нет файлов" class="mt">
        <el-table-column prop="file_name" label="Файл" />
        <el-table-column prop="type" label="Тип" width="120" />
        <el-table-column label="" width="70">
          <template #default="{ row }">
            <div class="etp-table-actions">
              <EtpIconButton type="danger" title="Удалить" @click="onDeleteDoc(row.id)">
                <Delete />
              </EtpIconButton>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <h2 class="mt">Переписка</h2>
      <div v-for="m in messages" :key="m.id" class="msg">
        <div class="msg__meta">{{ formatDateTime(m.created_at) }}</div>
        <div class="msg__body">{{ m.message || m.body || m.text }}</div>
      </div>
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

.msg {
  border-left: 3px solid #cbd5e1;
  padding: 0.5rem 0.75rem;
  margin: 0.5rem 0;
  background: #f8fafc;
}

.msg__meta {
  font-size: 0.8rem;
  color: #6b7280;
}
</style>
