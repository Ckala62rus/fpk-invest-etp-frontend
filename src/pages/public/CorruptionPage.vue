<script setup>
/**
 * Форма сообщения о коррупции (публичный POST /corruption-reports + CSRF).
 */
import { reactive, ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import feedbackApi from '@/api/modules/feedback';
import { useAuthStore } from '@/stores/auth';
import { mapLaravelErrorsToFields } from '@/helpers/format';

const auth = useAuthStore();
const formRef = ref(null);
const submitting = ref(false);
const sent = ref(false);

const isGuest = computed(() => !auth.isAuth);

const form = reactive({
    name: '',
    email: '',
    message: '',
});

const serverErrors = reactive(/** @type {Record<string, string>} */ ({}));

const rules = computed(() => ({
    name: isGuest.value
        ? [{ required: true, message: 'Укажите имя', trigger: 'blur' }]
        : [],
    email: isGuest.value
        ? [
              { required: true, message: 'Укажите email', trigger: 'blur' },
              { type: 'email', message: 'Некорректный email', trigger: 'blur' },
          ]
        : [],
    message: [{ required: true, message: 'Опишите ситуацию', trigger: 'blur' }],
}));

/**
 * Сбрасывает серверные ошибки полей.
 * @returns {void}
 */
function clearServerErrors() {
    Object.keys(serverErrors).forEach((key) => {
        delete serverErrors[key];
    });
}

/**
 * Отправка сообщения о коррупции.
 * @returns {Promise<void>}
 */
async function onSubmit() {
    const valid = await formRef.value?.validate().catch(() => false);
    if (!valid) {
        return;
    }

    clearServerErrors();
    submitting.value = true;

    try {
        const payload = {
            message: form.message.trim(),
        };
        if (isGuest.value || form.name) {
            payload.name = form.name.trim();
        }
        if (isGuest.value || form.email) {
            payload.email = form.email.trim();
        }

        await feedbackApi.submitCorruptionReport(payload);
        sent.value = true;
        ElMessage.success('Сообщение отправлено');
    } catch (e) {
        const fields = mapLaravelErrorsToFields(e?.response?.data?.errors || [e?.response?.data?.message || e?.message]);
        Object.assign(serverErrors, fields);
        if (fields._form) {
            ElMessage.error(fields._form);
        } else {
            ElMessage.error('Проверьте поля формы');
        }
    } finally {
        submitting.value = false;
    }
}
</script>

<template>
  <div class="etp-page">
    <div class="etp-card form-card">
      <template v-if="sent">
        <h1>Сообщение принято</h1>
        <p>Спасибо. Обращение будет рассмотрено уполномоченными лицами.</p>
        <el-button type="primary" @click="$router.push({ name: 'home' })">На главную</el-button>
      </template>

      <template v-else>
        <h1>Сообщить о коррупции</h1>
        <p class="muted">Канал для сообщений о возможных коррупционных нарушениях.</p>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="top"
          @submit.prevent="onSubmit"
        >
          <template v-if="isGuest">
            <el-form-item label="Имя" prop="name" :error="serverErrors.name">
              <el-input v-model="form.name" />
            </el-form-item>
            <el-form-item label="Email" prop="email" :error="serverErrors.email">
              <el-input v-model="form.email" type="email" />
            </el-form-item>
          </template>

          <el-form-item label="Сообщение" prop="message" :error="serverErrors.message">
            <el-input v-model="form.message" type="textarea" :rows="8" maxlength="5000" show-word-limit />
          </el-form-item>

          <el-button type="primary" native-type="submit" :loading="submitting" style="width: 100%">
            Отправить
          </el-button>
        </el-form>
      </template>
    </div>
  </div>
</template>

<style scoped>
.form-card {
  max-width: 640px;
}

.muted {
  color: #6b7280;
  margin-bottom: 1rem;
}
</style>
