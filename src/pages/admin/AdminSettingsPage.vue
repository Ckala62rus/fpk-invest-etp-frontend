<script setup>
/**
 * Админка (super_admin): логотип площадки для публичной шапки.
 */
import { computed, onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import adminSettingsApi from '@/api/modules/adminSettings';
import brandingApi from '@/api/modules/siteLogo';
import { ROLES } from '@/constants/roles';
import { useAuthStore } from '@/stores/auth';
import { apiErrorMessage } from '@/helpers/format';
import { confirmAction } from '@/helpers/confirm';

const auth = useAuthStore();
const isSuperAdmin = computed(() => auth.hasRole(ROLES.SUPER_ADMIN));

const loading = ref(false);
const uploading = ref(false);
const deleting = ref(false);
const hasCustomLogo = ref(false);
/** @type {import('vue').Ref<string|null>} */
const logoPreviewUrl = ref(null);

/**
 * @returns {Promise<void>}
 */
async function loadBranding() {
    loading.value = true;
    try {
        const { data } = await brandingApi.show();
        const payload = data.data ?? {};
        hasCustomLogo.value = Boolean(payload.has_custom_logo);
        logoPreviewUrl.value = payload.logo_url
            ? `${payload.logo_url}?t=${Date.now()}`
            : null;
    } catch (e) {
        ElMessage.error(apiErrorMessage(e, 'Не удалось загрузить брендинг'));
    } finally {
        loading.value = false;
    }
}

/**
 * @param {{ raw: File }} uploadFile
 * @returns {Promise<void>}
 */
async function onUpload({ raw }) {
    if (!raw || !isSuperAdmin.value) {
        return;
    }
    uploading.value = true;
    try {
        await adminSettingsApi.uploadLogo(raw);
        ElMessage.success('Логотип обновлён');
        await loadBranding();
    } catch (e) {
        ElMessage.error(apiErrorMessage(e, 'Не удалось загрузить логотип'));
    } finally {
        uploading.value = false;
    }
}

/**
 * @returns {Promise<void>}
 */
async function onDelete() {
    const ok = await confirmAction(
        'На витрине снова будет значок «ФИ» по умолчанию.',
        'Удалить логотип?',
    );
    if (!ok) {
        return;
    }
    deleting.value = true;
    try {
        await adminSettingsApi.deleteLogo();
        ElMessage.success('Логотип удалён');
        await loadBranding();
    } catch (e) {
        ElMessage.error(apiErrorMessage(e, 'Не удалось удалить логотип'));
    } finally {
        deleting.value = false;
    }
}

onMounted(loadBranding);
</script>

<template>
  <div class="etp-card" v-loading="loading">
    <h1>Настройки площадки</h1>
    <p class="muted">
      Логотип компании в шапке публичной части. Если удалить — отображается дефолтный значок «ФИ».
    </p>

    <template v-if="isSuperAdmin">
      <div class="logo-preview">
        <img v-if="logoPreviewUrl" :src="logoPreviewUrl" alt="Логотип" class="logo-img">
        <div v-else class="logo-fallback">ФИ</div>
      </div>

      <el-space wrap class="mt">
        <el-upload
          :auto-upload="false"
          :show-file-list="false"
          accept=".png,.jpg,.jpeg,.webp,.svg"
          :disabled="uploading"
          @change="onUpload"
        >
          <el-button type="primary" :loading="uploading">Загрузить логотип</el-button>
        </el-upload>
        <el-button
          v-if="hasCustomLogo"
          type="danger"
          plain
          :loading="deleting"
          @click="onDelete"
        >
          Удалить (вернуть по умолчанию)
        </el-button>
      </el-space>
      <p class="hint mt">PNG, JPG, WEBP или SVG, до 2 МБ.</p>
    </template>
    <el-alert
      v-else
      type="warning"
      :closable="false"
      title="Изменение логотипа доступно только главному администратору."
    />
  </div>
</template>

<style scoped>
.muted {
  color: #6b7280;
}

.hint {
  color: #6b7280;
  font-size: 0.85rem;
}

.mt {
  margin-top: 1rem;
}

.logo-preview {
  width: auto;
  max-width: 420px;
  height: 72px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #dbeafe;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 8px 12px;
}

.logo-img {
  height: 100%;
  width: auto;
  max-width: 100%;
  object-fit: contain;
  background: #fff;
}

.logo-fallback {
  width: 64px;
  height: 64px;
  border-radius: 10px;
  background: #eff6ff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.5rem;
  color: #1976d2;
}
</style>
