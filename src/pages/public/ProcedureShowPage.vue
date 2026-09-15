<script setup>
/**
 * Публичная карточка одной ТЗП (без контактов заказчика).
 */
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import proceduresApi from '@/api/modules/procedures';
import apiClient from '@/api/axios';
import urls from '@/api/urls';
import { apiErrorMessage, formatDateTime } from '@/helpers/format';
import { saveBlobAsFile } from '@/helpers/files';
import { useAuthStore } from '@/stores/auth';
import { Download } from '@element-plus/icons-vue';
import EtpIconButton from '@/components/ui/EtpIconButton.vue';
import { ElMessage } from 'element-plus';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

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

/**
 * @param {Record<string, unknown>} row Документ процедуры
 * @returns {Promise<void>}
 */
async function onDownloadProcedureDoc(row) {
    try {
        const { data } = await apiClient.get(
            urls.publicProcedureDocumentDownload(procedureId.value, row.id),
            { responseType: 'blob' },
        );
        saveBlobAsFile(data, String(row.file_name || 'document'));
    } catch (e) {
        ElMessage.error(apiErrorMessage(e, 'Не удалось скачать файл'));
    }
}
</script>

<template>
  <div class="etp-page">
    <div class="etp-card" v-loading="loading">
      <el-button link type="primary" @click="router.push({ name: 'home' })">
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

        <template v-if="auth.isAuth && procedure.documents?.length">
          <h2 class="docs-title">Документация процедуры</h2>
          <p class="muted docs-hint">Конкурсные файлы доступны после входа.</p>
          <el-table :data="procedure.documents" size="small" class="mt">
            <el-table-column prop="file_name" label="Файл" min-width="220" />
            <el-table-column label="" width="80" fixed="right">
              <template #default="{ row }">
                <EtpIconButton title="Скачать" @click="onDownloadProcedureDoc(row)">
                  <Download />
                </EtpIconButton>
              </template>
            </el-table-column>
          </el-table>
        </template>

        <el-alert
          class="mt"
          type="info"
          show-icon
          :closable="false"
          title="Участие после входа в кабинет."
        />

        <div v-if="auth.isAuth" class="actions mt">
          <el-button
            v-if="procedure.type === 'request_for_proposal'"
            type="primary"
            @click="router.push({ name: 'cabinet.propose', params: { id: procedure.id } })"
          >
            Подать КП
          </el-button>
          <el-button
            v-if="procedure.type === 'auction'"
            type="primary"
            @click="router.push({ name: 'cabinet.auction', params: { id: procedure.id } })"
          >
            Перейти к аукциону
          </el-button>
        </div>
        <p v-else class="mt">
          <router-link :to="{ name: 'login' }">Войдите</router-link>, чтобы подать КП или участвовать в аукционе.
        </p>
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

.actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.description h2 {
  font-size: 1.1rem;
}

.docs-title {
  font-size: 1.1rem;
  margin-top: 1rem;
}

.docs-hint {
  margin: 0.25rem 0 0;
}
</style>
