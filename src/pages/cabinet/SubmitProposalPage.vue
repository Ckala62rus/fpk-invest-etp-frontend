<script setup>
/**
 * Подача КП с настраиваемыми полями участника (custom fields).
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
/** @type {import('vue').Ref<Array<Record<string, unknown>>>} */
const customFields = ref([]);
const fieldValues = reactive({});
const form = reactive({
    contract_form_agreed: false,
});

/**
 * @returns {Promise<void>}
 */
async function loadProcedure() {
    loading.value = true;
    try {
        const { data } = await proceduresApi.show(procedureId.value);
        procedure.value = data.data ?? null;
        const fields = Array.isArray(procedure.value?.custom_fields)
            ? procedure.value.custom_fields
            : [];
        customFields.value = fields;
        fields.forEach((f) => {
            fieldValues[f.id] = fieldValues[f.id] ?? '';
        });
    } catch (e) {
        ElMessage.error(e?.response?.data?.message || 'Процедура недоступна');
    } finally {
        loading.value = false;
    }
}

/**
 * @returns {Array<{ procedure_custom_field_id: number, value: string|null }>}
 */
function buildFieldValuesPayload() {
    return customFields.value.map((f) => ({
        procedure_custom_field_id: f.id,
        value: fieldValues[f.id] === '' || fieldValues[f.id] === undefined
            ? null
            : String(fieldValues[f.id]),
    }));
}

/**
 * @returns {Promise<void>}
 */
async function onSubmit() {
    if (!form.contract_form_agreed) {
        ElMessage.warning('Нужно согласие с формой договора');
        return;
    }

    for (const f of customFields.value) {
        if (f.is_required && (fieldValues[f.id] === '' || fieldValues[f.id] == null)) {
            ElMessage.warning(`Заполните поле «${f.label}»`);
            return;
        }
    }

    submitting.value = true;
    try {
        const { data } = await proposalsApi.submit(procedureId.value, {
            contract_form_agreed: true,
            field_values: buildFieldValuesPayload(),
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

    <el-form label-position="top" class="mt">
      <template v-for="field in customFields" :key="field.id">
        <el-form-item :label="field.label + (field.is_required ? ' *' : '')">
          <el-select
            v-if="field.field_type === 'select'"
            v-model="fieldValues[field.id]"
            style="width: 100%"
            clearable
          >
            <el-option
              v-for="opt in (field.options || [])"
              :key="opt"
              :label="opt"
              :value="opt"
            />
          </el-select>
          <el-switch
            v-else-if="field.field_type === 'boolean'"
            v-model="fieldValues[field.id]"
            active-value="1"
            inactive-value="0"
          />
          <el-input
            v-else-if="field.field_type === 'number' || field.field_type === 'decimal'"
            v-model="fieldValues[field.id]"
            type="number"
          />
          <el-date-picker
            v-else-if="field.field_type === 'date'"
            v-model="fieldValues[field.id]"
            type="date"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
          <el-input
            v-else
            v-model="fieldValues[field.id]"
            type="textarea"
            :rows="2"
          />
        </el-form-item>
      </template>

      <el-checkbox v-model="form.contract_form_agreed">
        Согласен с формой договора
      </el-checkbox>
    </el-form>

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

.mt {
  margin-top: 1rem;
}

.actions {
  margin-top: 1.25rem;
  display: flex;
  gap: 0.5rem;
}
</style>
