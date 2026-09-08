<script setup>
/**
 * Обращение к администратору для восстановления доступа по ИНН.
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
  <div class="etp-page">
    <div class="etp-card card">
      <h1>Обращение к администратору</h1>
      <p class="hint">
        Если нет доступа к email — укажите ИНН (идентификационный номер налогоплательщика)
        и кратко опишите проблему.
      </p>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="onSubmit"
      >
        <el-form-item label="ИНН" prop="inn">
          <el-input v-model="form.inn" maxlength="12" autocomplete="username" />
        </el-form-item>
        <el-form-item label="Сообщение">
          <el-input v-model="form.message" type="textarea" :rows="4" maxlength="5000" />
        </el-form-item>
        <el-button type="primary" native-type="submit" :loading="loading" style="width: 100%">
          Отправить
        </el-button>
      </el-form>

      <p class="footer">
        <router-link :to="{ name: 'password.forgot' }">Восстановить по email</router-link>
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
