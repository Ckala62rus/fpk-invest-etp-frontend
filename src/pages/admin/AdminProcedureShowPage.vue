<script setup>
/**
 * Админка: карточка ТЗП — просмотр, правка базовых полей, публикация.
 */
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import adminProceduresApi from '@/api/modules/adminProcedures';
import adminProcedureExtrasApi from '@/api/modules/adminProcedureExtras';
import { ROLES } from '@/constants/roles';
import { useAuthStore } from '@/stores/auth';
import { formatDateTime } from '@/helpers/format';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const id = computed(() => route.params.id);

const canWrite = computed(() => auth.hasRole([ROLES.SUPER_ADMIN, ROLES.TRADE_ADMIN]));
const loading = ref(false);
const saving = ref(false);
const procedure = ref(null);
const inviteVisible = ref(false);
const inviteEmailsText = ref('');
const inviteSending = ref(false);

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
            form.starts_at = procedure.value.starts_at
                ? String(procedure.value.starts_at).slice(0, 19).replace('T', ' ')
                : '';
            form.ends_at = procedure.value.ends_at
                ? String(procedure.value.ends_at).slice(0, 19).replace('T', ' ')
                : '';
        }
    } catch (e) {
        ElMessage.error(e?.response?.data?.message || 'Не найдено');
        procedure.value = null;
    } finally {
        loading.value = false;
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

      <el-space wrap class="mb">
        <el-button
          v-if="canWrite && procedure.status === 'draft'"
          type="success"
          @click="onPublish"
        >
          Опубликовать
        </el-button>
        <el-button
          @click="router.push({ name: 'admin.proposals', params: { id: procedure.id } })"
        >
          КП процедуры
        </el-button>
        <el-button
          @click="router.push({ name: 'admin.lots', params: { id: procedure.id } })"
        >
          Лоты
        </el-button>
        <el-button
          @click="router.push({ name: 'admin.customFields', params: { id: procedure.id } })"
        >
          Настраиваемые поля
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
          v-if="procedure.type === 'auction'"
          type="warning"
          @click="router.push({ name: 'admin.auction', params: { id: procedure.id } })"
        >
          Управление аукционом
        </el-button>
        <el-button
          v-if="procedure.type === 'auction'"
          @click="router.push({ name: 'cabinet.auction', params: { id: procedure.id } })"
        >
          Вид участника
        </el-button>
      </el-space>

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

      <el-alert
        class="mt"
        type="info"
        :closable="false"
        show-icon
        title="КП, лоты, поля, приглашения, согласование и аукцион — кнопки выше."
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

.mb,
.mt {
  margin: 1rem 0;
}
</style>
