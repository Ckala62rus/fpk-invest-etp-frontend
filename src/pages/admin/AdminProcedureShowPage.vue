<script setup>
/**
 * Админка: карточка ТЗП — просмотр, правка базовых полей, публикация.
 */
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Delete, Download, View } from '@element-plus/icons-vue';
import adminProceduresApi from '@/api/modules/adminProcedures';
import adminProcedureDocumentsApi from '@/api/modules/adminProcedureDocuments';
import adminProcedureExtrasApi from '@/api/modules/adminProcedureExtras';
import { DOCUMENT_ACCEPT, DOCUMENT_FORMATS_HINT } from '@/constants/documents';
import { ROLES } from '@/constants/roles';
import { useAuthStore } from '@/stores/auth';
import { apiErrorMessage, formatDateTime, toNaiveDateTimeMoscow } from '@/helpers/format';
import { auctionTradeBadge } from '@/helpers/auctionTrade';
import { confirmAction } from '@/helpers/confirm';
import { isPdfFile, openBlobInNewTab, saveBlobAsFile } from '@/helpers/files';
import EtpIconButton from '@/components/ui/EtpIconButton.vue';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const id = computed(() => route.params.id);

const canWrite = computed(() => auth.hasRole([ROLES.SUPER_ADMIN, ROLES.TRADE_ADMIN]));
const loading = ref(false);
const saving = ref(false);
const procedure = ref(null);
/** Лоты и тикер — только для type=auction (не для запроса КП). */
const isAuction = computed(() => procedure.value?.type === 'auction');
const tradeBadge = computed(() =>
    auctionTradeBadge(procedure.value?.auction_trade_status),
);
const inviteVisible = ref(false);
const inviteEmailsText = ref('');
const inviteSending = ref(false);

const procedureDocuments = ref(/** @type {Array<Record<string, unknown>>} */ ([]));
const docsLoading = ref(false);
const docUploading = ref(false);

const form = reactive({
    title: '',
    description: '',
    customer_contact_name: '',
    customer_contact_email: '',
    starts_at: '',
    ends_at: '',
});

/**
 * @returns {Promise<void>}
 */
async function loadDocuments() {
    docsLoading.value = true;
    try {
        const { data } = await adminProcedureDocumentsApi.list(id.value);
        procedureDocuments.value = Array.isArray(data.data) ? data.data : [];
    } catch (e) {
        procedureDocuments.value = [];
        ElMessage.error(apiErrorMessage(e, 'Не удалось загрузить документы'));
    } finally {
        docsLoading.value = false;
    }
}

/**
 * @returns {Promise<void>}
 */
async function load() {
    loading.value = true;
    try {
        const { data } = await adminProceduresApi.show(id.value);
        procedure.value = data.data ?? null;
        if (procedure.value) {
            form.title = procedure.value.title || '';
            form.description = procedure.value.description || '';
            form.customer_contact_name = procedure.value.customer_contact_name || '';
            form.customer_contact_email = procedure.value.customer_contact_email || '';
            form.starts_at = toNaiveDateTimeMoscow(procedure.value.starts_at);
            form.ends_at = toNaiveDateTimeMoscow(procedure.value.ends_at);
        }
        await loadDocuments();
    } catch (e) {
        ElMessage.error(e?.response?.data?.message || 'Не найдено');
        procedure.value = null;
        procedureDocuments.value = [];
    } finally {
        loading.value = false;
    }
}

/**
 * @param {{ raw: File }} uploadFile Файл
 * @returns {Promise<void>}
 */
async function onUploadDocument({ raw }) {
    if (!raw || !canWrite.value) {
        return;
    }
    docUploading.value = true;
    try {
        await adminProcedureDocumentsApi.upload(id.value, raw);
        ElMessage.success('Документ загружен');
        await loadDocuments();
    } catch (e) {
        ElMessage.error(apiErrorMessage(e, 'Не удалось загрузить документ'));
    } finally {
        docUploading.value = false;
    }
}

/**
 * @param {Record<string, unknown>} row Документ
 * @returns {Promise<void>}
 */
async function onOpenDocument(row) {
    try {
        const { data } = await adminProcedureDocumentsApi.download(id.value, row.id, { inline: true });
        openBlobInNewTab(data);
    } catch (e) {
        ElMessage.error(apiErrorMessage(e, 'Не удалось открыть файл'));
    }
}

/**
 * @param {Record<string, unknown>} row Документ
 * @returns {Promise<void>}
 */
async function onDownloadDocument(row) {
    try {
        const { data } = await adminProcedureDocumentsApi.download(id.value, row.id);
        saveBlobAsFile(data, String(row.file_name || 'document'));
    } catch (e) {
        ElMessage.error(apiErrorMessage(e, 'Не удалось скачать файл'));
    }
}

/**
 * @param {number|string} documentId ID документа
 * @returns {Promise<void>}
 */
async function onDeleteDocument(documentId) {
    const ok = await confirmAction('Удалить этот файл документации?', 'Удаление');
    if (!ok) {
        return;
    }
    try {
        await adminProcedureDocumentsApi.destroy(id.value, documentId);
        ElMessage.success('Документ удалён');
        await loadDocuments();
    } catch (e) {
        ElMessage.error(apiErrorMessage(e, 'Не удалось удалить документ'));
    }
}

/**
 * @returns {Promise<void>}
 */
async function onSave() {
    saving.value = true;
    try {
        await adminProceduresApi.update(id.value, {
            title: form.title,
            description: form.description,
            customer_contact_name: form.customer_contact_name || null,
            customer_contact_email: form.customer_contact_email || null,
            starts_at: form.starts_at || null,
            ends_at: form.ends_at || null,
        });
        ElMessage.success('Сохранено');
        await load();
    } catch (e) {
        ElMessage.error(e?.response?.data?.message || 'Ошибка сохранения');
    } finally {
        saving.value = false;
    }
}

/**
 * @returns {Promise<void>}
 */
async function onPublish() {
    await ElMessageBox.confirm('Опубликовать?', 'Публикация');
    try {
        await adminProceduresApi.publish(id.value);
        ElMessage.success('Опубликовано');
        await load();
    } catch (e) {
        if (e !== 'cancel') {
            ElMessage.error(e?.response?.data?.message || 'Ошибка');
        }
    }
}

/**
 * @returns {void}
 */
function openInvites() {
    inviteEmailsText.value = '';
    inviteVisible.value = true;
}

/**
 * Массовая рассылка внешних приглашений по email.
 * @returns {Promise<void>}
 */
async function sendInvites() {
    const emails = inviteEmailsText.value
        .split(/[\n,;]+/)
        .map((s) => s.trim())
        .filter(Boolean);

    if (!emails.length) {
        ElMessage.warning('Укажите хотя бы один email');
        return;
    }

    inviteSending.value = true;
    try {
        const { data } = await adminProcedureExtrasApi.sendExternalInvites(id.value, { emails });
        ElMessage.success(data.message || `Приглашения поставлены в очередь (${emails.length})`);
        inviteVisible.value = false;
    } catch (e) {
        ElMessage.error(e?.response?.data?.message || 'Ошибка рассылки');
    } finally {
        inviteSending.value = false;
    }
}

onMounted(load);
watch(id, load);
</script>

<template>
  <div class="etp-card" v-loading="loading">
    <el-button link type="primary" @click="router.push({ name: 'admin.procedures' })">
      ← К списку
    </el-button>

    <template v-if="procedure">
      <h1>{{ procedure.title }}</h1>
      <p class="muted">
        № {{ procedure.number }} · {{ procedure.type_label || procedure.type }}
        · {{ procedure.status_label || procedure.status }}
        · создана {{ formatDateTime(procedure.created_at) }}
      </p>
      <p v-if="isAuction" class="trade-status">
        <el-tag :type="tradeBadge.tagType" effect="dark">
          {{ procedure.auction_trade_status_label || tradeBadge.label }}
        </el-tag>
        <span v-if="procedure.auction_is_paused" class="muted">
          Ставки временно не принимаются
        </span>
      </p>

      <el-space wrap class="mb">
        <el-button
          v-if="canWrite && procedure.status === 'draft'"
          type="success"
          @click="onPublish"
        >
          Опубликовать
        </el-button>
        <el-button
          v-if="!isAuction"
          @click="router.push({ name: 'admin.proposals', params: { id: procedure.id } })"
        >
          КП процедуры
        </el-button>
        <el-button
          v-if="isAuction"
          @click="router.push({ name: 'admin.lots', params: { id: procedure.id } })"
        >
          Лоты
        </el-button>
        <el-tooltip
          v-else
          content="Лоты только для аукциона. У запроса КП (коммерческих предложений) лоты не используются."
          placement="top"
        >
          <span class="btn-disabled-wrap">
            <el-button disabled>Лоты</el-button>
          </span>
        </el-tooltip>
        <el-button
          @click="router.push({ name: 'admin.customFields', params: { id: procedure.id } })"
        >
          Настраиваемые поля
        </el-button>
        <el-button
          @click="router.push({ name: 'admin.procedureExtraConditions', params: { id: procedure.id } })"
        >
          Доп. условия
        </el-button>
        <el-button
          @click="router.push({ name: 'admin.changeLogs', params: { id: procedure.id } })"
        >
          Согласование правок
        </el-button>
        <el-button v-if="canWrite" @click="openInvites">
          Внешние приглашения
        </el-button>
        <el-button
          v-if="isAuction"
          type="warning"
          @click="router.push({ name: 'admin.auction', params: { id: procedure.id } })"
        >
          Управление аукционом / ставки
        </el-button>
        <el-button
          v-if="isAuction"
          @click="router.push({ name: 'cabinet.auction', params: { id: procedure.id } })"
        >
          Вид участника
        </el-button>
      </el-space>

      <el-alert
        class="mb"
        type="info"
        :closable="false"
        show-icon
        title="Настраиваемые поля — анкета участника при подаче КП (ответы видны в карточке КП). Доп. условия — параметры самой процедуры (сроки поставки и т.п.), их задаёт администратор, участник их не заполняет."
      />

      <el-form v-if="canWrite" label-position="top" @submit.prevent="onSave">
        <el-form-item label="Название">
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="Описание">
          <el-input v-model="form.description" type="textarea" :rows="4" />
        </el-form-item>
        <el-form-item label="Контакт заказчика (ФИО)">
          <el-input v-model="form.customer_contact_name" />
        </el-form-item>
        <el-form-item label="Контакт заказчика (email)">
          <el-input v-model="form.customer_contact_email" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="Начало">
              <el-date-picker
                v-model="form.starts_at"
                type="datetime"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Окончание">
              <el-date-picker
                v-model="form.ends_at"
                type="datetime"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-button type="primary" native-type="submit" :loading="saving">Сохранить</el-button>
      </el-form>

      <el-descriptions v-else :column="1" border class="mt">
        <el-descriptions-item label="Описание">{{ procedure.description || '—' }}</el-descriptions-item>
        <el-descriptions-item label="Заказчик">{{ procedure.company?.name || procedure.company_id }}</el-descriptions-item>
        <el-descriptions-item label="Категория">{{ procedure.classifier_category?.name || procedure.classifier_category_id }}</el-descriptions-item>
      </el-descriptions>

      <h2 class="section-title">Конкурсная документация</h2>
      <p class="muted">{{ DOCUMENT_FORMATS_HINT }}</p>
      <el-upload
        v-if="canWrite"
        :auto-upload="false"
        :show-file-list="false"
        :accept="DOCUMENT_ACCEPT"
        :disabled="docUploading"
        @change="onUploadDocument"
      >
        <el-button :loading="docUploading">Загрузить файл</el-button>
      </el-upload>
      <el-table
        v-loading="docsLoading"
        :data="procedureDocuments"
        size="small"
        empty-text="Документов пока нет"
        class="mt"
      >
        <el-table-column prop="file_name" label="Файл" min-width="220" />
        <el-table-column label="Загружен" width="160">
          <template #default="{ row }">{{ formatDateTime(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="Действия" width="150" fixed="right">
          <template #default="{ row }">
            <div class="etp-table-actions">
              <EtpIconButton
                v-if="isPdfFile(row.file_name)"
                title="Открыть PDF"
                @click="onOpenDocument(row)"
              >
                <View />
              </EtpIconButton>
              <EtpIconButton title="Скачать" @click="onDownloadDocument(row)">
                <Download />
              </EtpIconButton>
              <EtpIconButton
                v-if="canWrite"
                type="danger"
                title="Удалить"
                @click="onDeleteDocument(row.id)"
              >
                <Delete />
              </EtpIconButton>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <el-alert
        class="mt"
        type="info"
        :closable="false"
        show-icon
        title="КП — для запроса предложений. Лоты и аукцион — только если тип ТЗП «Электронный аукцион»."
      />

      <el-dialog v-model="inviteVisible" title="Внешние приглашения" width="520px">
        <p class="muted">
          Email через запятую, точку с запятой или с новой строки (до 500 адресов).
        </p>
        <el-input
          v-model="inviteEmailsText"
          type="textarea"
          :rows="8"
          placeholder="user@example.com"
        />
        <template #footer>
          <el-button @click="inviteVisible = false">Отмена</el-button>
          <el-button type="primary" :loading="inviteSending" @click="sendInvites">
            Отправить
          </el-button>
        </template>
      </el-dialog>
    </template>
  </div>
</template>

<style scoped>
.muted {
  color: #6b7280;
}

.trade-status {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  margin: 0.5rem 0 1rem;
}

.mb,
.mt {
  margin: 1rem 0;
}

/* Обёртка нужна, чтобы tooltip работал на disabled-кнопке */
.btn-disabled-wrap {
  display: inline-block;
}

.section-title {
  font-size: 1.05rem;
  margin: 1.25rem 0 0.5rem;
}
</style>
