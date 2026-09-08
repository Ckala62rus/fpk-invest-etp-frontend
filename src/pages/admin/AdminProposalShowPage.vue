<script setup>
/**
 * Админка: карточка КП — допуск/отклонение и переписка.
 */
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import adminProposalsApi from '@/api/modules/adminProposals';
import { ROLES } from '@/constants/roles';
import { useAuthStore } from '@/stores/auth';
import { formatDateTime } from '@/helpers/format';

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

const decisionForm = reactive({
    decision: 'admit',
    reason: '',
});
const deciding = ref(false);

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
        ElMessage.error(e?.response?.data?.message || 'Не удалось открыть КП');
        proposal.value = null;
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
        await load();
    } catch (e) {
        ElMessage.error(e?.response?.data?.message || 'Ошибка отправки');
    } finally {
        sending.value = false;
    }
}

onMounted(load);
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

      <el-alert
        v-if="proposal.content_hidden"
        type="warning"
        :closable="false"
        show-icon
        :title="`Полное содержимое будет доступно после ${formatDateTime(proposal.content_available_after)}`"
        class="mb"
      />

      <template v-else>
        <el-descriptions :column="1" border class="mb">
          <el-descriptions-item label="user_id">{{ proposal.user_id }}</el-descriptions-item>
          <el-descriptions-item label="Согласие с договором">
            {{ formatDateTime(proposal.contract_form_agreed_at) }}
          </el-descriptions-item>
          <el-descriptions-item v-if="proposal.admission_decision" label="Допуск">
            {{ proposal.admission_decision.decision }} — {{ proposal.admission_decision.reason }}
          </el-descriptions-item>
        </el-descriptions>

        <h2>Документы</h2>
        <el-table :data="proposal.documents || []" size="small" empty-text="Нет файлов" class="mb">
          <el-table-column prop="file_name" label="Файл" />
          <el-table-column prop="type" label="Тип" width="120" />
        </el-table>
      </template>

      <div v-if="canDecide" class="decision mb">
        <h2>Решение о допуске</h2>
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
      <div v-for="m in messages" :key="m.id" class="msg">
        <div class="msg__meta">{{ formatDateTime(m.created_at) }} · sender {{ m.sender_id }}</div>
        <div>{{ m.message }}</div>
      </div>
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

.decision {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
}

.msg {
  border-left: 3px solid #94a3b8;
  padding: 0.5rem 0.75rem;
  margin: 0.5rem 0;
  background: #f8fafc;
}

.msg__meta {
  font-size: 0.8rem;
  color: #6b7280;
}
</style>
