<script setup>
/**
 * Публичная карточка одной ТЗП (без контактов заказчика).
 */
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import proceduresApi from '@/api/modules/procedures';
import { formatDateTime } from '@/helpers/format';

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const procedure = ref(null);
const errorMessage = ref('');

const procedureId = computed(() => route.params.id);

/**
 * Загружает карточку по id из маршрута.
 * @returns {Promise<void>}
 */
async function load() {
    loading.value = true;
    errorMessage.value = '';
    procedure.value = null;
    try {
        const { data } = await proceduresApi.show(procedureId.value);
        procedure.value = data.data ?? null;
        if (!procedure.value) {
            errorMessage.value = 'Процедура не найдена';
        }
    } catch (e) {
        errorMessage.value = e?.response?.data?.message || 'Не удалось открыть процедуру';
    } finally {
        loading.value = false;
    }
}

onMounted(load);
watch(procedureId, load);
</script>

<template>
  <div class="etp-page">
    <div class="etp-card" v-loading="loading">
      <el-button link type="primary" @click="router.push({ name: 'procedures.index' })">
        ← К списку
      </el-button>

      <el-alert
        v-if="errorMessage"
        type="error"
        :title="errorMessage"
        show-icon
        :closable="false"
        class="mt"
      />

      <template v-if="procedure">
        <h1>{{ procedure.title }}</h1>
        <p class="meta">
          № {{ procedure.number }}
          · {{ procedure.type_label || procedure.type }}
          · <el-tag size="small">{{ procedure.status_label || procedure.status }}</el-tag>
        </p>

        <el-descriptions :column="1" border class="mt">
          <el-descriptions-item label="Заказчик (организация)">
            {{ procedure.company?.name || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="Категория">
            {{ procedure.classifier_category?.name || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="Начало">
            {{ formatDateTime(procedure.starts_at) }}
          </el-descriptions-item>
          <el-descriptions-item label="Окончание приёма / торгов">
            {{ formatDateTime(procedure.ends_at) }}
          </el-descriptions-item>
          <el-descriptions-item label="Опубликована">
            {{ formatDateTime(procedure.published_at) }}
          </el-descriptions-item>
        </el-descriptions>

        <div v-if="procedure.description" class="description mt">
          <h2>Описание</h2>
          <p style="white-space: pre-wrap">{{ procedure.description }}</p>
        </div>

        <el-alert
          class="mt"
          type="info"
          show-icon
          :closable="false"
          title="Подача КП и участие в аукционе — после входа в кабинет участника (фаза F2)."
        />
      </template>
    </div>
  </div>
</template>

<style scoped>
.meta {
  color: #6b7280;
}

.mt {
  margin-top: 1rem;
}

.description h2 {
  font-size: 1.1rem;
}
</style>
