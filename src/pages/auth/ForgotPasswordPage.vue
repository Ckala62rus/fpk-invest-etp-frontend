<script setup>
/**
 * Запрос инструкции восстановления пароля по email (AuthLayout Metronic).
 */
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import authApi from '@/api/modules/auth';

const router = useRouter();
const formRef = ref(null);
const loading = ref(false);

const form = reactive({
    email: '',
});

const rules = {
    email: [
        { required: true, message: 'Укажите email', trigger: 'blur' },
        { type: 'email', message: 'Некорректный email', trigger: 'blur' },
    ],
};

/**
 * @returns {Promise<void>}
 */
async function onSubmit() {
    const valid = await formRef.value?.validate().catch(() => false);
    if (!valid) {
        return;
    }

    loading.value = true;
    try {
        const { data } = await authApi.passwordForgot({ email: form.email.trim() });
        ElMessage.success(data.message || 'Если email зарегистрирован, инструкция отправлена.');
        await router.push({ name: 'password.reset' });
    } catch (e) {
        ElMessage.error(e?.response?.data?.message || 'Ошибка отправки');
    } finally {
        loading.value = false;
    }
}
</script>

<template>
  <div class="text-center mb-10">
    <h1 class="text-dark mb-3">Восстановление пароля</h1>
    <div class="text-gray-400 fw-bold fs-6">
      Укажите email — пришлём токен для смены пароля
    </div>
  </div>

  <el-form
    ref="formRef"
    :model="form"
    :rules="rules"
    label-position="top"
    @submit.prevent="onSubmit"
  >
    <el-form-item label="Email" prop="email">
      <el-input v-model="form.email" type="email" size="large" autocomplete="email" />
    </el-form-item>
    <el-button type="primary" native-type="submit" size="large" :loading="loading" class="w-100">
      Отправить
    </el-button>
  </el-form>

  <div class="text-center mt-8 text-gray-400 fw-bold fs-6">
    <router-link :to="{ name: 'password.reset' }" class="link-primary">Уже есть токен</router-link>
    ·
    <router-link :to="{ name: 'password.admin-request' }" class="link-primary">К администратору</router-link>
    ·
    <router-link :to="{ name: 'login' }" class="link-primary">Вход</router-link>
  </div>
</template>
