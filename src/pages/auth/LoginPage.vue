<script setup>
/**
 * Форма входа по ИНН и паролю (Sanctum SPA).
 */
import { reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

/** Поля формы */
const form = reactive({
    inn: '',
    password: '',
});

const formRef = ref(null);

/** Правила Element Plus Form */
const rules = {
    inn: [{ required: true, message: 'Укажите ИНН', trigger: 'blur' }],
    password: [{ required: true, message: 'Укажите пароль', trigger: 'blur' }],
};

/**
 * Отправка формы входа.
 * @returns {Promise<void>}
 */
async function onSubmit() {
    const valid = await formRef.value?.validate().catch(() => false);
    if (!valid) {
        return;
    }

    const ok = await auth.login({
        inn: form.inn.trim(),
        password: form.password,
    });

    if (!ok) {
        ElMessage.error('Не удалось войти. Проверьте ИНН и пароль.');
        return;
    }

    ElMessage.success('Вход выполнен');

    const redirect = typeof route.query.redirect === 'string'
        ? route.query.redirect
        : null;

    if (redirect) {
        await router.replace(redirect);
        return;
    }

    await router.replace(
        auth.isAdminArea ? { name: 'admin.dashboard' } : { name: 'cabinet' },
    );
}
</script>

<template>
  <div class="etp-page">
    <div class="etp-card login-card">
      <h1>Вход</h1>
      <p class="login-card__hint">ИНН и пароль учётной записи ЭТП</p>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="onSubmit"
      >
        <el-form-item label="ИНН" prop="inn">
          <el-input v-model="form.inn" autocomplete="username" />
        </el-form-item>
        <el-form-item label="Пароль" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            show-password
            autocomplete="current-password"
          />
        </el-form-item>
        <el-button
          type="primary"
          native-type="submit"
          :loading="auth.isSubmitting"
          style="width: 100%"
        >
          Войти
        </el-button>
      </el-form>

      <p class="login-card__footer">
        Нет аккаунта?
        <router-link :to="{ name: 'register' }">Регистрация</router-link>
      </p>
    </div>
  </div>
</template>

<style scoped>
.login-card {
  max-width: 420px;
}

.login-card__hint,
.login-card__footer {
  color: #6b7280;
  font-size: 0.9rem;
}

.login-card__footer {
  margin-top: 1rem;
}
</style>
