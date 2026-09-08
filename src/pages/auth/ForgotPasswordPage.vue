<script setup>
/**
 * Запрос инструкции восстановления пароля по email.
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
  <div class="etp-page">
    <div class="etp-card card">
      <h1>Восстановление пароля</h1>
      <p class="hint">Укажите email учётной записи — пришлём токен для смены пароля.</p>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="onSubmit"
      >
        <el-form-item label="Email" prop="email">
          <el-input v-model="form.email" type="email" autocomplete="email" />
        </el-form-item>
        <el-button type="primary" native-type="submit" :loading="loading" style="width: 100%">
          Отправить
        </el-button>
      </el-form>

      <p class="footer">
        <router-link :to="{ name: 'password.reset' }">Уже есть токен</router-link>
        ·
        <router-link :to="{ name: 'password.admin-request' }">Обратиться к администратору</router-link>
        ·
        <router-link :to="{ name: 'login' }">Вход</router-link>
      </p>
    </div>
  </div>
</template>

<style scoped>
.card {
  max-width: 420px;
}

.hint,
.footer {
  color: #6b7280;
  font-size: 0.9rem;
}

.footer {
  margin-top: 1rem;
}
</style>
