<script setup>
/**
 * Админка: группы компаний, категории классификатора, заказчики (super_admin).
 */
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Delete } from '@element-plus/icons-vue';
import adminClassifierApi from '@/api/modules/adminClassifier';
import EtpIconButton from '@/components/ui/EtpIconButton.vue';

const loading = ref(false);
const groups = ref([]);
const categories = ref([]);
const companies = ref([]);

const groupForm = reactive({ name: '', sort_order: 0, is_active: true });
const categoryForm = reactive({ company_group_id: null, name: '', sort_order: 0, is_active: true });
const companyForm = reactive({
    company_group_id: null,
    name: '',
    inn: '',
    is_external: false,
    is_active: true,
});

/**
 * Загружает все три справочника (по первой странице с большим per_page).
 * @returns {Promise<void>}
 */
async function loadAll() {
    loading.value = true;
    try {
        const [g, c, co] = await Promise.all([
            adminClassifierApi.listCompanyGroups({ per_page: 100 }),
            adminClassifierApi.listCategories({ per_page: 100 }),
            adminClassifierApi.listCompanies({ per_page: 100 }),
        ]);
        groups.value = Array.isArray(g.data.data) ? g.data.data : [];
        categories.value = Array.isArray(c.data.data) ? c.data.data : [];
        companies.value = Array.isArray(co.data.data) ? co.data.data : [];
    } catch (e) {
        ElMessage.error(e?.response?.data?.message || 'Нет доступа или ошибка загрузки (нужен главный администратор)');
    } finally {
        loading.value = false;
    }
}

/**
 * @returns {Promise<void>}
 */
async function createGroup() {
    try {
        await adminClassifierApi.createCompanyGroup({ ...groupForm });
        groupForm.name = '';
        ElMessage.success('Группа создана');
        await loadAll();
    } catch (e) {
        ElMessage.error(e?.response?.data?.message || 'Ошибка');
    }
}

/**
 * @param {number} id ID
 * @returns {Promise<void>}
 */
async function removeGroup(id) {
    await ElMessageBox.confirm('Удалить группу?', 'Подтверждение');
    try {
        await adminClassifierApi.deleteCompanyGroup(id);
        ElMessage.success('Удалено');
        await loadAll();
    } catch (e) {
        if (e !== 'cancel') {
            ElMessage.error(e?.response?.data?.message || 'Ошибка удаления');
        }
    }
}

/**
 * @returns {Promise<void>}
 */
async function createCategory() {
    try {
        await adminClassifierApi.createCategory({ ...categoryForm });
        categoryForm.name = '';
        ElMessage.success('Категория создана');
        await loadAll();
    } catch (e) {
        ElMessage.error(e?.response?.data?.message || 'Ошибка');
    }
}

/**
 * @param {number} id ID
 * @returns {Promise<void>}
 */
async function removeCategory(id) {
    await ElMessageBox.confirm('Удалить категорию?', 'Подтверждение');
    try {
        await adminClassifierApi.deleteCategory(id);
        ElMessage.success('Удалено');
        await loadAll();
    } catch (e) {
        if (e !== 'cancel') {
            ElMessage.error(e?.response?.data?.message || 'Ошибка');
        }
    }
}

/**
 * @returns {Promise<void>}
 */
async function createCompany() {
    try {
        await adminClassifierApi.createCompany({ ...companyForm });
        companyForm.name = '';
        companyForm.inn = '';
        ElMessage.success('Заказчик создан');
        await loadAll();
    } catch (e) {
        ElMessage.error(e?.response?.data?.message || 'Ошибка');
    }
}

/**
 * @param {number} id ID
 * @returns {Promise<void>}
 */
async function removeCompany(id) {
    await ElMessageBox.confirm('Удалить заказчика?', 'Подтверждение');
    try {
        await adminClassifierApi.deleteCompany(id);
        ElMessage.success('Удалено');
        await loadAll();
    } catch (e) {
        if (e !== 'cancel') {
            ElMessage.error(e?.response?.data?.message || 'Ошибка');
        }
    }
}

onMounted(loadAll);
</script>

<template>
  <div class="etp-card" v-loading="loading">
    <h1>Классификатор и заказчики</h1>
    <p class="muted">Доступ: главный администратор. Группы → категории → предприятия-заказчики.</p>

    <h2>Группы компаний</h2>
    <el-form inline @submit.prevent="createGroup">
      <el-form-item label="Название">
        <el-input v-model="groupForm.name" />
      </el-form-item>
      <el-button type="primary" native-type="submit">Добавить</el-button>
    </el-form>
    <el-table :data="groups" size="small" class="mb">
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="name" label="Название" />
      <el-table-column label="" width="70">
        <template #default="{ row }">
          <div class="etp-table-actions">
            <EtpIconButton type="danger" title="Удалить" @click="removeGroup(row.id)">
              <Delete />
            </EtpIconButton>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <h2>Категории</h2>
    <el-form inline @submit.prevent="createCategory">
      <el-form-item label="Группа">
        <el-select v-model="categoryForm.company_group_id" style="width: 200px">
          <el-option v-for="g in groups" :key="g.id" :label="g.name" :value="g.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="Название">
        <el-input v-model="categoryForm.name" />
      </el-form-item>
      <el-button type="primary" native-type="submit">Добавить</el-button>
    </el-form>
    <el-table :data="categories" size="small" class="mb">
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="company_group_id" label="Группа" width="90" />
      <el-table-column prop="name" label="Название" />
      <el-table-column label="" width="70">
        <template #default="{ row }">
          <div class="etp-table-actions">
            <EtpIconButton type="danger" title="Удалить" @click="removeCategory(row.id)">
              <Delete />
            </EtpIconButton>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <h2>Заказчики (компании)</h2>
    <el-form inline @submit.prevent="createCompany">
      <el-form-item label="Группа">
        <el-select v-model="companyForm.company_group_id" style="width: 200px">
          <el-option v-for="g in groups" :key="g.id" :label="g.name" :value="g.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="Название">
        <el-input v-model="companyForm.name" />
      </el-form-item>
      <el-form-item label="ИНН">
        <el-input v-model="companyForm.inn" maxlength="12" />
      </el-form-item>
      <el-button type="primary" native-type="submit">Добавить</el-button>
    </el-form>
    <el-table :data="companies" size="small">
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="name" label="Название" />
      <el-table-column prop="inn" label="ИНН" width="130" />
      <el-table-column label="" width="70">
        <template #default="{ row }">
          <div class="etp-table-actions">
            <EtpIconButton type="danger" title="Удалить" @click="removeCompany(row.id)">
              <Delete />
            </EtpIconButton>
          </div>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style scoped>
.muted {
  color: #6b7280;
}

h2 {
  font-size: 1.05rem;
  margin-top: 1.5rem;
}

.mb {
  margin-bottom: 1rem;
}
</style>
