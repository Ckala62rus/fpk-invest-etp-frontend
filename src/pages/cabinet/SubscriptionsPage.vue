<script setup>
/**
 * Подписки участника на категории и группы компаний (рассылки о ТЗП).
 * Справочник категорий — только admin API; здесь управление уже выбранными ID.
 */
import { onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import cabinetApi from '@/api/modules/cabinet';

const loading = ref(false);
const saving = ref(false);

/** @type {import('vue').Ref<Array<{ id: number, name: string }>>} */
const categories = ref([]);
/** @type {import('vue').Ref<Array<{ id: number, name: string }>>} */
const companyGroups = ref([]);

const selectedCategoryIds = ref(/** @type {number[]} */ ([]));
const selectedGroupIds = ref(/** @type {number[]} */ ([]));

const addCategoryId = ref(null);
const addGroupId = ref(null);

/**
 * Загружает текущие подписки.
 * @returns {Promise<void>}
 */
async function load() {
    loading.value = true;
    try {
        const { data } = await cabinetApi.getSubscriptions();
        const payload = data.data ?? {};
        categories.value = Array.isArray(payload.categories) ? payload.categories : [];
        companyGroups.value = Array.isArray(payload.company_groups) ? payload.company_groups : [];
        selectedCategoryIds.value = categories.value.map((c) => c.id);
        selectedGroupIds.value = companyGroups.value.map((g) => g.id);
    } catch (e) {
        ElMessage.error(e?.response?.data?.message || 'Не удалось загрузить подписки');
    } finally {
        loading.value = false;
    }
}

/**
 * Добавляет ID категории в выбор (если ещё нет).
 * @returns {void}
 */
function pushCategory() {
    const id = Number(addCategoryId.value);
    if (!id || selectedCategoryIds.value.includes(id)) {
        return;
    }
    selectedCategoryIds.value = [...selectedCategoryIds.value, id];
    if (!categories.value.some((c) => c.id === id)) {
        categories.value = [...categories.value, { id, name: `Категория #${id}` }];
    }
    addCategoryId.value = null;
}

/**
 * Добавляет ID группы компаний.
 * @returns {void}
 */
function pushGroup() {
    const id = Number(addGroupId.value);
    if (!id || selectedGroupIds.value.includes(id)) {
        return;
    }
    selectedGroupIds.value = [...selectedGroupIds.value, id];
    if (!companyGroups.value.some((g) => g.id === id)) {
        companyGroups.value = [...companyGroups.value, { id, name: `Группа #${id}` }];
    }
    addGroupId.value = null;
}

/**
 * Сохраняет sync подписок.
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
    <h1>Подписки</h1>
    <p class="muted">
      Письма о новых ТЗП (торгово-закупочных процедурах) по выбранным категориям и группам компаний.
      Полный справочник категорий — в админке; здесь можно снять галочки и добавить ID вручную.
    </p>

    <h2>Категории</h2>
    <el-checkbox-group v-model="selectedCategoryIds" class="checks">
      <el-checkbox
        v-for="c in categories"
        :key="c.id"
        :label="c.id"
        :value="c.id"
      >
        {{ c.name }} (#{{ c.id }})
      </el-checkbox>
    </el-checkbox-group>
    <div class="add-row">
      <el-input-number v-model="addCategoryId" :min="1" controls-position="right" />
      <el-button @click="pushCategory">Добавить категорию по ID</el-button>
    </div>

    <h2>Группы компаний</h2>
    <el-checkbox-group v-model="selectedGroupIds" class="checks">
      <el-checkbox
        v-for="g in companyGroups"
        :key="g.id"
        :label="g.id"
        :value="g.id"
      >
        {{ g.name }} (#{{ g.id }})
      </el-checkbox>
    </el-checkbox-group>
    <div class="add-row">
      <el-input-number v-model="addGroupId" :min="1" controls-position="right" />
      <el-button @click="pushGroup">Добавить группу по ID</el-button>
    </div>

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

.add-row {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  align-items: center;
}

.save {
  margin-top: 1.5rem;
}
</style>
