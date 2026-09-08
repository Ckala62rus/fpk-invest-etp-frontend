<script setup>
/**
 * Значения доп. условий на черновике ТЗП (sync по шаблонам).
 */
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import adminExtraConditionsApi from '@/api/modules/adminExtraConditions';
import { ROLES } from '@/constants/roles';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const procedureId = computed(() => route.params.id);
const canWrite = computed(() => auth.hasRole([ROLES.SUPER_ADMIN, ROLES.TRADE_ADMIN]));

const loading = ref(false);
const saving = ref(false);
const templates = ref([]);
/** @type {import('vue').Ref<Record<number, string>>} */
const valuesByTemplate = reactive({});

/**
 * @returns {Promise<void>}
 */
async function load() {
    loading.value = true;
    try {
        const [tplRes, valRes] = await Promise.all([
            adminExtraConditionsApi.listTemplates(),
            adminExtraConditionsApi.listProcedureConditions(procedureId.value),
        ]);
        templates.value = (Array.isArray(tplRes.data.data) ? tplRes.data.data : [])
            .filter((t) => t.is_active);
        const values = Array.isArray(valRes.data.data) ? valRes.data.data : [];
        Object.keys(valuesByTemplate).forEach((k) => delete valuesByTemplate[k]);
        templates.value.forEach((t) => {
            valuesByTemplate[t.id] = '';
        });
        values.forEach((v) => {
            valuesByTemplate[v.template_id] = v.value ?? '';
        });
    } catch (e) {
        ElMessage.error(e?.response?.data?.message || 'Ошибка загрузки');
    } finally {
        loading.value = false;
    }
}

/**
 * @returns {Promise<void>}
 */
async function onSave() {
    const conditions = templates.value
        .filter((t) => valuesByTemplate[t.id] !== '' && valuesByTemplate[t.id] != null)
        .map((t) => ({
            template_id: t.id,
            value: String(valuesByTemplate[t.id]),
        }));

    saving.value = true;
    try {
        await adminExtraConditionsApi.syncProcedureConditions(procedureId.value, { conditions });
        ElMessage.success('Сохранено');
        await load();
    } catch (e) {
        ElMessage.error(e?.response?.data?.message || 'Ошибка (только черновик)');
    } finally {
        saving.value = false;
    }
}

onMounted(load);
watch(procedureId, load);
</script>

<template>
  <div class="etp-card" v-loading="loading">
    <el-button
      link
      type="primary"
      @click="router.push({ name: 'admin.procedures.show', params: { id: procedureId } })"
    >
      ← К процедуре
    </el-button>
    <h1>Доп. условия процедуры</h1>
    <p class="muted">Менять можно только у черновика. Пустые значения не отправляются.</p>

    <el-form v-if="templates.length" label-position="top" class="mt">
      <el-form-item
        v-for="t in templates"
        :key="t.id"
        :label="t.name + (t.field_type_label ? ` (${t.field_type_label})` : '')"
      >
        <el-input v-model="valuesByTemplate[t.id]" />
      </el-form-item>
      <el-button v-if="canWrite" type="primary" :loading="saving" @click="onSave">
        Сохранить
      </el-button>
    </el-form>
    <el-empty v-else description="Нет активных шаблонов — создайте в «Доп. условия»" />
  </div>
</template>

<style scoped>
.muted {
  color: #6b7280;
}

.mt {
  margin-top: 1rem;
}
</style>
