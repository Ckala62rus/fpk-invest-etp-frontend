<script setup>
/**
 * Подписки: выбор категорий и групп из справочника (без ручного ID).
 */
import { onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import cabinetApi from '@/api/modules/cabinet';

const loading = ref(false);
const saving = ref(false);

/** @type {import('vue').Ref<Array<{ id: number, name: string }>>} */
const catalogCategories = ref([]);
/** @type {import('vue').Ref<Array<{ id: number, name: string }>>} */
const catalogGroups = ref([]);

const selectedCategoryIds = ref(/** @type {number[]} */ ([]));
const selectedGroupIds = ref(/** @type {number[]} */ ([]));

/**
 * @returns {Promise<void>}
 */
async function load() {
    loading.value = true;
    try {
        const [subs, cats, groups] = await Promise.all([
            cabinetApi.getSubscriptions(),
            cabinetApi.catalogCategories(),
            cabinetApi.catalogCompanyGroups(),
        ]);

        catalogCategories.value = Array.isArray(cats.data.data) ? cats.data.data : [];
        catalogGroups.value = Array.isArray(groups.data.data) ? groups.data.data : [];

        const payload = subs.data.data ?? {};
        const myCats = Array.isArray(payload.categories) ? payload.categories : [];
        const myGroups = Array.isArray(payload.company_groups) ? payload.company_groups : [];
        selectedCategoryIds.value = myCats.map((c) => c.id);
        selectedGroupIds.value = myGroups.map((g) => g.id);
    } catch (e) {
        ElMessage.error(e?.response?.data?.message || 'Не удалось загрузить подписки');
    } finally {
        loading.value = false;
    }
}

/**
 * @returns {Promise<void>}
 */
async function onSave() {
    saving.value = true;
    try {
        await cabinetApi.updateSubscriptions({
            category_ids: selectedCategoryIds.value,
            company_group_ids: selectedGroupIds.value,
        });
        ElMessage.success('Подписки сохранены');
        await load();
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
    <h1>Подписки на рассылки</h1>
    <p class="muted">
      Отметьте категории закупок и группы компаний — на почту будут приходить письма о новых
      ТЗП (торгово-закупочных процедурах) по выбранным направлениям.
      Справочник заполняет администратор площадки.
    </p>

    <h2>Категории</h2>
    <el-alert
      v-if="!catalogCategories.length"
      type="info"
      :closable="false"
      show-icon
      title="Пока нет доступных категорий. Обратитесь к администратору."
      class="mb"
    />
    <el-checkbox-group v-else v-model="selectedCategoryIds" class="checks">
      <el-checkbox
        v-for="c in catalogCategories"
        :key="c.id"
        :label="c.id"
        :value="c.id"
      >
        {{ c.name }}
      </el-checkbox>
    </el-checkbox-group>

    <h2>Группы компаний (заказчики)</h2>
    <el-alert
      v-if="!catalogGroups.length"
      type="info"
      :closable="false"
      show-icon
      title="Пока нет доступных групп компаний."
      class="mb"
    />
    <el-checkbox-group v-else v-model="selectedGroupIds" class="checks">
      <el-checkbox
        v-for="g in catalogGroups"
        :key="g.id"
        :label="g.id"
        :value="g.id"
      >
        {{ g.name }}
      </el-checkbox>
    </el-checkbox-group>

    <el-button type="primary" class="save" :loading="saving" @click="onSave">
      Сохранить подписки
    </el-button>
  </div>
</template>

<style scoped>
.muted {
  color: #6b7280;
}

h2 {
  font-size: 1.05rem;
  margin-top: 1.25rem;
}

.checks {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin: 0.5rem 0 0.75rem;
}

.mb {
  margin: 0.5rem 0 1rem;
}

.save {
  margin-top: 1.5rem;
}
</style>
