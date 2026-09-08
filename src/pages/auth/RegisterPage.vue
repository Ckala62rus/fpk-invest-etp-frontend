<script setup>
/**
 * Полная регистрация участника ЭТП (фаза F1).
 * После успеха — письмо подтверждения (MailHog в dev); вход без verify/approve недоступен.
 */
import { reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '@/stores/auth';
import { ENTITY_TYPES } from '@/constants/procedure';
import { mapLaravelErrorsToFields } from '@/helpers/format';

const auth = useAuthStore();
const router = useRouter();
const formRef = ref(null);

/** Поля формы — имена как в RegistrationRequest на бэке */
const form = reactive({
    inn: '',
    email: '',
    password: '',
    password_confirmation: '',
    entity_type: 'legal',
    name: '',
    phone: '',
    director_name: '',
    director_birth_date: '',
    contact_persons: '',
    extra_emails_text: '',
    pd_consent: false,
});

/** Ошибки валидации с бэка (prop → текст) для :error у el-form-item */
const serverErrors = reactive(/** @type {Record<string, string>} */ ({}));

const rules = {
    inn: [{ required: true, message: 'Укажите ИНН', trigger: 'blur' }],
    email: [
        { required: true, message: 'Укажите email', trigger: 'blur' },
        { type: 'email', message: 'Некорректный email', trigger: 'blur' },
    ],
    password: [
        { required: true, message: 'Укажите пароль', trigger: 'blur' },
        { min: 8, message: 'Минимум 8 символов', trigger: 'blur' },
    ],
    password_confirmation: [{ required: true, message: 'Повторите пароль', trigger: 'blur' }],
    entity_type: [{ required: true, message: 'Выберите тип субъекта', trigger: 'change' }],
    name: [{ required: true, message: 'Укажите наименование или ФИО', trigger: 'blur' }],
    phone: [{ required: true, message: 'Укажите телефон', trigger: 'blur' }],
    director_name: [{ required: true, message: 'Укажите ФИО руководителя', trigger: 'blur' }],
    contact_persons: [{ required: true, message: 'Укажите контактные лица', trigger: 'blur' }],
    pd_consent: [
        {
            validator: (_rule, value, callback) => {
                if (!value) {
                    callback(new Error('Нужно согласие на обработку персональных данных'));
                    return;
                }
                callback();
            },
            trigger: 'change',
        },
    ],
};

/** Успешная регистрация — показать инструкцию про письмо */
const registeredOk = ref(false);

/**
 * Проставляет ошибки бэка в serverErrors для отображения под полями.
 * @returns {void}
 */
function applyServerErrors() {
    Object.keys(serverErrors).forEach((key) => {
        delete serverErrors[key];
    });

    const fields = mapLaravelErrorsToFields(auth.authError);
    Object.assign(serverErrors, fields);

    if (fields._form) {
        ElMessage.error(fields._form);
    }
}

watch(() => auth.authError, applyServerErrors);

/**
 * Собирает payload для POST /auth/register.
 * @returns {Record<string, unknown>}
 */
function buildPayload() {
    const extra = form.extra_emails_text
        .split(/[\n,;]+/)
        .map((s) => s.trim())
        .filter(Boolean);

    return {
        inn: form.inn.trim(),
        email: form.email.trim(),
        password: form.password,
        password_confirmation: form.password_confirmation,
        entity_type: form.entity_type,
        name: form.name.trim(),
        phone: form.phone.trim(),
        director_name: form.director_name.trim(),
        director_birth_date: form.director_birth_date || null,
        contact_persons: form.contact_persons.trim(),
        extra_emails: extra.length ? extra : undefined,
        pd_consent: form.pd_consent,
    };
}

/**
 * Отправка регистрации.
 * @returns {Promise<void>}
 */
async function onSubmit() {
    const valid = await formRef.value?.validate().catch(() => false);
    if (!valid) {
        return;
    }

    const { ok } = await auth.register(buildPayload());
    if (!ok) {
        applyServerErrors();
        ElMessage.error('Проверьте поля формы');
        return;
    }

    registeredOk.value = true;
    ElMessage.success('Регистрация принята. Проверьте почту.');
}
</script>

<template>
  <div class="etp-page">
    <div class="etp-card register-card">
      <template v-if="registeredOk">
        <h1>Проверьте email</h1>
        <p>
          Мы отправили письмо для подтверждения адреса.
          После подтверждения администратор одобрит доступ к площадке.
        </p>
        <p class="muted">В dev письма смотрите в MailHog: http://localhost:8025</p>
        <el-button type="primary" @click="$router.push({ name: 'login' })">
          К входу
        </el-button>
      </template>

      <template v-else>
        <h1>Регистрация участника</h1>
        <p class="muted">Все поля обязательны, кроме даты рождения руководителя и доп. email.</p>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="top"
          @submit.prevent="onSubmit"
        >
          <el-row :gutter="16">
            <el-col :md="12" :sm="24">
              <el-form-item label="ИНН" prop="inn" :error="serverErrors.inn">
                <el-input v-model="form.inn" maxlength="12" />
              </el-form-item>
            </el-col>
            <el-col :md="12" :sm="24">
              <el-form-item label="Email" prop="email" :error="serverErrors.email">
                <el-input v-model="form.email" type="email" autocomplete="email" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="16">
            <el-col :md="12" :sm="24">
              <el-form-item label="Пароль" prop="password" :error="serverErrors.password">
                <el-input v-model="form.password" type="password" show-password autocomplete="new-password" />
              </el-form-item>
            </el-col>
            <el-col :md="12" :sm="24">
              <el-form-item
                label="Повтор пароля"
                prop="password_confirmation"
                :error="serverErrors.password_confirmation"
              >
                <el-input
                  v-model="form.password_confirmation"
                  type="password"
                  show-password
                  autocomplete="new-password"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="Тип субъекта" prop="entity_type" :error="serverErrors.entity_type">
            <el-radio-group v-model="form.entity_type">
              <el-radio
                v-for="item in ENTITY_TYPES"
                :key="item.value"
                :value="item.value"
              >
                {{ item.label }}
              </el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item
            :label="form.entity_type === 'legal' ? 'Наименование организации' : 'ФИО'"
            prop="name"
            :error="serverErrors.name"
          >
            <el-input v-model="form.name" />
          </el-form-item>

          <el-row :gutter="16">
            <el-col :md="12" :sm="24">
              <el-form-item label="Телефон" prop="phone" :error="serverErrors.phone">
                <el-input v-model="form.phone" />
              </el-form-item>
            </el-col>
            <el-col :md="12" :sm="24">
              <el-form-item
                label="Дата рождения руководителя"
                prop="director_birth_date"
                :error="serverErrors.director_birth_date"
              >
                <el-date-picker
                  v-model="form.director_birth_date"
                  type="date"
                  value-format="YYYY-MM-DD"
                  placeholder="Необязательно"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="ФИО руководителя" prop="director_name" :error="serverErrors.director_name">
            <el-input v-model="form.director_name" />
          </el-form-item>

          <el-form-item
            label="Контактные лица"
            prop="contact_persons"
            :error="serverErrors.contact_persons"
          >
            <el-input v-model="form.contact_persons" type="textarea" :rows="3" />
          </el-form-item>

          <el-form-item
            label="Дополнительные email (через запятую или с новой строки)"
            :error="serverErrors.extra_emails || serverErrors['extra_emails.0']"
          >
            <el-input v-model="form.extra_emails_text" type="textarea" :rows="2" />
          </el-form-item>

          <el-form-item prop="pd_consent" :error="serverErrors.pd_consent">
            <el-checkbox v-model="form.pd_consent">
              Согласен на обработку персональных данных
            </el-checkbox>
          </el-form-item>

          <el-button
            type="primary"
            native-type="submit"
            :loading="auth.isSubmitting"
            style="width: 100%"
          >
            Зарегистрироваться
          </el-button>
        </el-form>

        <p class="footer-link">
          Уже есть аккаунт?
          <router-link :to="{ name: 'login' }">Войти</router-link>
        </p>
      </template>
    </div>
  </div>
</template>

<style scoped>
.register-card {
  max-width: 720px;
}

.muted,
.footer-link {
  color: #6b7280;
  font-size: 0.9rem;
}

.footer-link {
  margin-top: 1rem;
}
</style>
