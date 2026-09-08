<script setup>
/**
 * Настройки email-оповещений участника.
 */
import { onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import cabinetApi from '@/api/modules/cabinet';

const loading = ref(false);
const saving = ref(false);

const form = reactive({
    all_disabled: false,
    notify_new_auctions: true,
    notify_new_procedures: true,
    notify_day_before: true,
    notify_hour_before: true,
});

/**
 * Загружает настройки с API.
 * @returns {Promise<void>}
 */
async function load() {
    loading.value = true;
    try {
        const { data } = await cabinetApi.getNotificationSettings();
        const s = data.data ?? {};
        form.all_disabled = Boolean(s.all_disabled);
        form.notify_new_auctions = Boolean(s.notify_new_auctions);
        form.notify_new_procedures = Boolean(s.notify_new_procedures);
        form.notify_day_before = Boolean(s.notify_day_before);
        form.notify_hour_before = Boolean(s.notify_hour_before);
    } catch (e) {
        ElMessage.error(e?.response?.data?.message || 'Не удалось загрузить настройки');
    } finally {
        loading.value = false;
    }
}

/**
 * Сохраняет флаги оповещений.
 * @returns {Promise<void>}
 */
async function onSave() {
    saving.value = true;
    try {
        await cabinetApi.updateNotificationSettings({ ...form });
        ElMessage.success('Настройки сохранены');
    } catch (e) {
        ElMessage.error(e?.response?.data?.message || 'Ошибка сохранения');
    } finally {
        saving.value = false;
    }
}

onMounted(load);
</script>

<template>
  <div class="etp-card" v-loading="loading">
    <h1>Уведомления</h1>
    <p class="muted">Какие письма присылать на email учётной записи.</p>

    <el-form label-position="top" @submit.prevent="onSave">
      <el-form-item>
        <el-switch v-model="form.all_disabled" active-text="Отключить все рассылки" />
      </el-form-item>
      <el-form-item>
        <el-switch
          v-model="form.notify_new_procedures"
          :disabled="form.all_disabled"
          active-text="Новые ТЗП (торгово-закупочные процедуры)"
        />
      </el-form-item>
      <el-form-item>
        <el-switch
          v-model="form.notify_new_auctions"
          :disabled="form.all_disabled"
          active-text="Новые аукционы"
        />
      </el-form-item>
      <el-form-item>
        <el-switch
          v-model="form.notify_day_before"
          :disabled="form.all_disabled"
          active-text="Напоминание за день"
        />
      </el-form-item>
      <el-form-item>
        <el-switch
          v-model="form.notify_hour_before"
          :disabled="form.all_disabled"
          active-text="Напоминание за час"
        />
      </el-form-item>
      <el-button type="primary" native-type="submit" :loading="saving">Сохранить</el-button>
    </el-form>
  </div>
</template>

<style scoped>
.muted {
  color: #6b7280;
  margin-bottom: 1rem;
}
</style>
