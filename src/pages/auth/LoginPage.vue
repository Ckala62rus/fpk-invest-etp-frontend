<script setup>
/**
 * Форма входа по ИНН и паролю — полноэкранный Metronic-каркас (AuthLayout).
 */
import { reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

const form = reactive({
    inn: '',
    password: '',
});

const formRef = ref(null);

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
  <div class="text-center mb-10">
    <h1 class="text-dark mb-3">Вход на ЭТП</h1>
    <div class="text-gray-400 fw-bold fs-4">
      Нет аккаунта?
      <router-link :to="{ name: 'register' }" class="link-primary fw-bolder">
        Регистрация
      </router-link>
    </div>
  </div>

  <el-form
    ref="formRef"
    :model="form"
    :rules="rules"
    label-position="top"
    class="form w-100"
    @submit.prevent="onSubmit"
  >
    <el-form-item label="ИНН" prop="inn" class="mb-8">
      <el-input
        v-model="form.inn"
        size="large"
        autocomplete="username"
        placeholder="ИНН организации"
      />
    </el-form-item>
    <el-form-item prop="password" class="mb-8">
      <template #label>
        <div class="d-flex flex-stack w-100">
          <span>Пароль</span>
          <router-link :to="{ name: 'password.forgot' }" class="link-primary fs-6 fw-bolder">
            Забыли пароль?
          </router-link>
        </div>
      </template>
      <el-input
        v-model="form.password"
        type="password"
        size="large"
        show-password
        autocomplete="current-password"
        placeholder="Пароль"
      />
    </el-form-item>
    <div class="text-center">
      <el-button
        type="primary"
        size="large"
        native-type="submit"
        :loading="auth.isSubmitting"
        class="w-100"
      >
        Войти
      </el-button>
    </div>
  </el-form>
</template>
