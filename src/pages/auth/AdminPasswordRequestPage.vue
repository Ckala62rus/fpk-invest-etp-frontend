<script setup>
/**
 * Обращение к администратору по ИНН (AuthLayout Metronic).
 */
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import authApi from '@/api/modules/auth';

const router = useRouter();
const formRef = ref(null);
const loading = ref(false);

const form = reactive({
    inn: '',
    message: '',
});

const rules = {
    inn: [{ required: true, message: 'Укажите ИНН', trigger: 'blur' }],
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
        const { data } = await authApi.passwordAdminRequest({
            inn: form.inn.trim(),
            message: form.message.trim() || undefined,
        });
        ElMessage.success(data.message || 'Обращение отправлено администратору.');
        await router.push({ name: 'login' });
    } catch (e) {
        ElMessage.error(e?.response?.data?.message || 'Ошибка отправки');
    } finally {
        loading.value = false;
    }
}
</script>

<template>
  <div class="text-center mb-10">
    <h1 class="text-dark mb-3">Обращение к администратору</h1>
    <div class="text-gray-400 fw-bold fs-6">
      Если нет доступа к email — укажите ИНН и опишите проблему
    </div>
  </div>

  <el-form
    ref="formRef"
    :model="form"
    :rules="rules"
    label-position="top"
    @submit.prevent="onSubmit"
  >
    <el-form-item label="ИНН" prop="inn">
      <el-input v-model="form.inn" maxlength="12" size="large" autocomplete="username" />
    </el-form-item>
    <el-form-item label="Сообщение">
      <el-input v-model="form.message" type="textarea" :rows="4" maxlength="5000" />
    </el-form-item>
    <el-button type="primary" native-type="submit" size="large" :loading="loading" class="w-100">
      Отправить
    </el-button>
  </el-form>

  <div class="text-center mt-8 text-gray-400 fw-bold fs-6">
    <router-link :to="{ name: 'password.forgot' }" class="link-primary">По email</router-link>
    ·
    <router-link :to="{ name: 'login' }" class="link-primary">Вход</router-link>
  </div>
</template>
