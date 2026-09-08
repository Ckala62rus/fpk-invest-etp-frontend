<script setup>
/**
 * Публичная страница CMS по slug (HTML из опубликованной ревизии).
 */
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import cmsApi from '@/api/modules/cms';

const route = useRoute();
const loading = ref(false);
const page = ref(null);
const errorMessage = ref('');

const slug = computed(() => String(route.params.slug || ''));

/**
 * Загружает страницу по ЧПУ.
 * @returns {Promise<void>}
 */
async function load() {
    if (!slug.value) {
        return;
    }

    loading.value = true;
    errorMessage.value = '';
    page.value = null;

    try {
        const { data } = await cmsApi.show(slug.value);
        page.value = data.data ?? null;
        if (!page.value) {
            errorMessage.value = 'Страница не найдена';
            return;
        }
        if (page.value.meta_title || page.value.title) {
            document.title = `${page.value.meta_title || page.value.title} — ЭТП ФПК «Инвест»`;
        }
    } catch (e) {
        errorMessage.value = e?.response?.data?.message || 'Не удалось загрузить страницу';
    } finally {
        loading.value = false;
    }
}

onMounted(load);
watch(slug, load);
</script>

<template>
  <div class="etp-page">
    <div class="etp-card" v-loading="loading">
      <el-alert
        v-if="errorMessage"
        type="error"
        :title="errorMessage"
        show-icon
        :closable="false"
      />

      <template v-if="page">
        <h1>{{ page.title }}</h1>
        <!-- Контент CMS — HTML с бэка (админский редактор); доверяем только опубликованным страницам -->
        <div class="cms-html" v-html="page.content_html || ''" />
      </template>
    </div>
  </div>
</template>

<style scoped>
.cms-html {
  margin-top: 1rem;
  line-height: 1.6;
}

.cms-html :deep(img) {
  max-width: 100%;
  height: auto;
}

.cms-html :deep(a) {
  color: #2563eb;
}
</style>
