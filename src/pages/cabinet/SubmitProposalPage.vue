<script setup>
/**
 * Подача КП (коммерческого предложения) по запросу предложений.
 */
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import proposalsApi from '@/api/modules/proposals';
import proceduresApi from '@/api/modules/procedures';
import { rememberProposalId } from '@/helpers/myProposals';
import { mapLaravelErrorsToFields } from '@/helpers/format';

const route = useRoute();
const router = useRouter();
const procedureId = computed(() => route.params.id);

const loading = ref(false);
const submitting = ref(false);
const procedure = ref(null);
const form = reactive({
    contract_form_agreed: false,
});

/**
 * Загружает карточку процедуры для заголовка.
 * @returns {Promise<void>}
 */
async function loadProcedure() {
    loading.value = true;
    try {
        const { data } = await proceduresApi.show(procedureId.value);
        procedure.value = data.data ?? null;
    } catch (e) {
        ElMessage.error(e?.response?.data?.message || 'Процедура недоступна');
    } finally {
        loading.value = false;
    }
}

/**
 * Отправка КП.
 * @returns {Promise<void>}
 */
async function onSubmit() {
    if (!form.contract_form_agreed) {
        ElMessage.warning('Нужно согласие с формой договора');
        return;
    }
    submitting.value = true;
    try {
        const { data } = await proposalsApi.submit(procedureId.value, {
            contract_form_agreed: true,
        });
        const proposal = data.data ?? {};
        if (proposal.id) {
            rememberProposalId(proposal.id);
            ElMessage.success('КП подано');
            await router.push({ name: 'cabinet.proposals.show', params: { id: proposal.id } });
        } else {
            ElMessage.success(data.message || 'КП подано');
        }
    } catch (e) {
        const fields = mapLaravelErrorsToFields(e?.response?.data?.errors || [e?.response?.data?.message]);
        ElMessage.error(fields.contract_form_agreed || fields._form || Object.values(fields)[0] || 'Ошибка подачи');
    } finally {
        submitting.value = false;
    }
}

onMounted(loadProcedure);
</script>

<template>
  <div class="etp-card" v-loading="loading">
    <h1>Подача КП</h1>
    <p v-if="procedure" class="muted">
      {{ procedure.number }} — {{ procedure.title }}
      ({{ procedure.type_label || procedure.type }})
    </p>
    <el-alert
      type="info"
      :closable="false"
      show-icon
      title="Схема доп. полей процедуры на API участника пока не отдаётся — подаём согласие с формой договора. Файлы и переписка — на карточке КП после подачи."
      class="mb"
    />
    <el-checkbox v-model="form.contract_form_agreed">
      Согласен с формой договора
    </el-checkbox>
    <div class="actions">
      <el-button type="primary" :loading="submitting" @click="onSubmit">Подать КП</el-button>
      <el-button @click="$router.back()">Назад</el-button>
    </div>
  </div>
</template>

<style scoped>
.muted {
  color: #6b7280;
}

.mb {
  margin: 1rem 0;
}

.actions {
  margin-top: 1.25rem;
  display: flex;
  gap: 0.5rem;
}
</style>
