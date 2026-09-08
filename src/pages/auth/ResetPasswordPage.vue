<script setup>
/**
 * Установка нового пароля по одноразовому токену из письма.
 */
import { onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import authApi from '@/api/modules/auth';

const route = useRoute();
const router = useRouter();
const formRef = ref(null);
const loading = ref(false);

const form = reactive({
    token: '',
    password: '',
    password_confirmation: '',
});

const rules = {
    token: [{ required: true, message: 'Укажите токен', trigger: 'blur' }],
    password: [
        { required: true, message: 'Укажите пароль', trigger: 'blur' },
        { min: 8, message: 'Минимум 8 символов', trigger: 'blur' },
    ],
    password_confirmation: [
        { required: true, message: 'Подтвердите пароль', trigger: 'blur' },
        {
            validator: (_r, v, cb) => {
                if (v !== form.password) {
                    cb(new Error('Пароли не совпадают'));
                    return;
                }
                cb();
            },
            trigger: 'blur',
        },
    ],
};

onMounted(() => {
    const q = route.query.token;
    if (typeof q === 'string' && q) {
        form.token = q;
    }
});

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
        const { data } = await authApi.passwordReset({
            token: form.token.trim(),
            password: form.password,
            password_confirmation: form.password_confirmation,
        });
        ElMessage.success(data.message || 'Пароль изменён.');
        await router.push({ name: 'login' });
    } catch (e) {
        ElMessage.error(e?.response?.data?.message || 'Не удалось сменить пароль');
    } finally {
        loading.value = false;
    }
}
</script>

<template>
  <div class="etp-page">
    <div class="etp-card card">
      <h1>Новый пароль</h1>
      <p class="hint">Вставьте токен из письма и задайте новый пароль.</p>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="onSubmit"
      >
        <el-form-item label="Токен" prop="token">
          <el-input v-model="form.token" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="Новый пароль" prop="password">
          <el-input v-model="form.password" type="password" show-password autocomplete="new-password" />
        </el-form-item>
        <el-form-item label="Подтверждение" prop="password_confirmation">
          <el-input
            v-model="form.password_confirmation"
            type="password"
            show-password
            autocomplete="new-password"
          />
        </el-form-item>
        <el-button type="primary" native-type="submit" :loading="loading" style="width: 100%">
          Сохранить пароль
        </el-button>
      </el-form>

      <p class="footer">
        <router-link :to="{ name: 'password.forgot' }">Запросить токен снова</router-link>
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
