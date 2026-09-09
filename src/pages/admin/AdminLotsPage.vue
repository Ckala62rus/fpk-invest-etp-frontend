<script setup>
/**
 * CRUD лотов аукционной ТЗП в админке (для запроса КП не используется).
 */
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Delete, Edit } from '@element-plus/icons-vue';
import adminProceduresApi from '@/api/modules/adminProcedures';
import adminProcedureExtrasApi from '@/api/modules/adminProcedureExtras';
import { ROLES } from '@/constants/roles';
import { useAuthStore } from '@/stores/auth';
import EtpIconButton from '@/components/ui/EtpIconButton.vue';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const procedureId = computed(() => route.params.id);
const canWrite = computed(() => auth.hasRole([ROLES.SUPER_ADMIN, ROLES.TRADE_ADMIN]));

const loading = ref(false);
const items = ref([]);
const procedureType = ref(/** @type {string|null} */ (null));
const isAuction = computed(() => procedureType.value === 'auction');
const dialogVisible = ref(false);
const editingId = ref(null);
const saving = ref(false);

const form = reactive({
    name: '',
    unit: '',
    quantity: null,
    start_price: 0,
    bid_step: 1,
    sort_order: 0,
});

/**
 * @returns {Promise<void>}
 */
async function load() {
    loading.value = true;
    try {
        const proc = await adminProceduresApi.show(procedureId.value);
        procedureType.value = proc.data.data?.type ?? null;

        if (procedureType.value !== 'auction') {
            ElMessage.warning(
                'Лоты доступны только для аукциона. У запроса КП (коммерческих предложений) лоты не используются.',
            );
            items.value = [];
            return;
        }

        const { data } = await adminProcedureExtrasApi.listLots(procedureId.value);
        items.value = Array.isArray(data.data) ? data.data : [];
    } catch (e) {
        ElMessage.error(e?.response?.data?.message || 'Ошибка загрузки лотов');
    } finally {
        loading.value = false;
    }
}

/**
 * @returns {void}
 */
function openCreate() {
    if (!isAuction.value) {
        ElMessage.warning('Лоты только для аукциона');
        return;
    }
    editingId.value = null;
    Object.assign(form, {
        name: '',
        unit: '',
        quantity: null,
        start_price: 0,
        bid_step: 1,
        sort_order: items.value.length,
    });
    dialogVisible.value = true;
}

/**
 * @param {Record<string, unknown>} row Лот
 * @returns {void}
 */
function openEdit(row) {
    editingId.value = row.id;
    Object.assign(form, {
        name: row.name,
        unit: row.unit || '',
        quantity: row.quantity,
        start_price: Number(row.start_price) || 0,
        bid_step: Number(row.bid_step) || 1,
        sort_order: row.sort_order ?? 0,
    });
    dialogVisible.value = true;
}

/**
 * @returns {Promise<void>}
 */
async function onSave() {
    saving.value = true;
    try {
        const payload = {
            name: form.name.trim(),
            unit: form.unit || null,
            quantity: form.quantity,
            start_price: form.start_price,
            bid_step: form.bid_step,
            sort_order: form.sort_order,
        };
        if (editingId.value) {
            await adminProcedureExtrasApi.updateLot(procedureId.value, editingId.value, payload);
            ElMessage.success('Лот обновлён');
        } else {
            await adminProcedureExtrasApi.createLot(procedureId.value, payload);
            ElMessage.success('Лот создан');
        }
        dialogVisible.value = false;
        await load();
    } catch (e) {
        ElMessage.error(e?.response?.data?.message || 'Ошибка сохранения');
    } finally {
        saving.value = false;
    }
}

/**
 * @param {number} id ID лота
 * @returns {Promise<void>}
 */
async function onDelete(id) {
    try {
        await ElMessageBox.confirm('Удалить лот?', 'Подтверждение');
        await adminProcedureExtrasApi.deleteLot(procedureId.value, id);
        ElMessage.success('Удалено');
        await load();
    } catch (e) {
        if (e !== 'cancel') {
            ElMessage.error(e?.response?.data?.message || 'Ошибка');
        }
    }
}

onMounted(load);
watch(procedureId, load);
</script>

<template>
  <div class="etp-card" v-loading="loading">
    <el-button link type="primary" @click="router.push({ name: 'admin.procedures.show', params: { id: procedureId } })">
      ← К процедуре
    </el-button>
    <div class="head">
      <h1>Лоты процедуры #{{ procedureId }}</h1>
      <el-button v-if="canWrite && isAuction" type="primary" @click="openCreate">Добавить лот</el-button>
    </div>

    <el-alert
      v-if="procedureType && !isAuction"
      type="warning"
      :closable="false"
      show-icon
      class="mb"
      title="Это запрос КП (коммерческих предложений). Лоты нужны только для аукциона — вернитесь к карточке процедуры."
    />

    <el-table v-else :data="items" stripe>
      <el-table-column prop="sort_order" label="#" width="60" />
      <el-table-column prop="name" label="Название" min-width="180" />
      <el-table-column prop="unit" label="Ед." width="80" />
      <el-table-column prop="quantity" label="Кол-во" width="90" />
      <el-table-column prop="start_price" label="Старт" width="100" />
      <el-table-column prop="bid_step" label="Шаг" width="90" />
      <el-table-column prop="current_price" label="Текущая" width="100" />
      <el-table-column v-if="canWrite" label="" width="110" fixed="right">
        <template #default="{ row }">
          <div class="etp-table-actions">
            <EtpIconButton title="Изменить" @click="openEdit(row)">
              <Edit />
            </EtpIconButton>
            <EtpIconButton type="danger" title="Удалить" @click="onDelete(row.id)">
              <Delete />
            </EtpIconButton>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="editingId ? 'Лот' : 'Новый лот'" width="560px">
      <p class="dialog-intro">
        Лот — отдельный предмет торгов внутри аукциона. У каждого лота своя цена и свои ставки.
      </p>
      <el-form label-position="top">
        <el-form-item label="Название" required>
          <el-input v-model="form.name" placeholder="Например: Отделка кабинета №3" />
          <div class="field-hint">Как лот видят участники в списке торгов.</div>
        </el-form-item>
        <el-form-item label="Ед. изм.">
          <el-input v-model="form.unit" placeholder="м², шт., комплект…" />
          <div class="field-hint">Единица измерения объёма (необязательно).</div>
        </el-form-item>
        <el-form-item label="Количество">
          <el-input-number v-model="form.quantity" :min="0" />
          <div class="field-hint">Объём закупки в указанных единицах (необязательно).</div>
        </el-form-item>
        <el-form-item label="Начальная цена" required>
          <el-input-number v-model="form.start_price" :min="0" :step="1000" />
          <div class="field-hint">
            Стартовая цена лота на момент начала торгов. От неё идут ставки
            (вверх или вниз — зависит от режима аукциона в «Управление аукционом»).
          </div>
        </el-form-item>
        <el-form-item label="Шаг ставки" required>
          <el-input-number v-model="form.bid_step" :min="0.01" :step="100" />
          <div class="field-hint">
            Минимальная разница между новой ставкой и текущей ценой лота.
            Пример: текущая цена 100&nbsp;000, шаг 5&nbsp;000 — следующая ставка должна
            отличаться минимум на 5&nbsp;000 (нельзя «перебить» на 100 рублей).
          </div>
        </el-form-item>
        <el-form-item label="Порядок">
          <el-input-number v-model="form.sort_order" :min="0" />
          <div class="field-hint">Порядок отображения лотов в списке (0, 1, 2…).</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">Отмена</el-button>
        <el-button type="primary" :loading="saving" @click="onSave">Сохранить</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.mb {
  margin: 1rem 0;
}

.dialog-intro {
  margin: 0 0 1rem;
  color: #6b7280;
  font-size: 0.9rem;
  line-height: 1.4;
}

.field-hint {
  margin-top: 0.35rem;
  color: #6b7280;
  font-size: 0.8rem;
  line-height: 1.35;
  width: 100%;
}
</style>
