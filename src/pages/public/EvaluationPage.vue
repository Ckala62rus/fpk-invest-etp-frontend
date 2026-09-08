<script setup>
/**
 * Публичный опрос качества закупки по токену из письма (без входа).
 * Маршрут: /evaluation/:token → GET/POST /api/evaluation-surveys/{token}.
 */
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import evaluationApi from '@/api/modules/evaluation';
import { mapLaravelErrorsToFields } from '@/helpers/format';

const route = useRoute();
const token = computed(() => String(route.params.token || ''));

const loading = ref(false);
const submitting = ref(false);
const errorMessage = ref('');
const done = ref(false);
const procedureId = ref(null);
/** @type {import('vue').Ref<Array<Record<string, unknown>>>} */
const questions = ref([]);

/** question_id → ответ */
const answersMap = reactive(/** @type {Record<number|string, unknown>} */ ({}));

const scores = reactive({
    contractor_score: null,
    product_score: null,
    comment: '',
});

/**
 * Загружает вопросы открытого опроса.
 * @returns {Promise<void>}
 */
async function load() {
    if (!token.value) {
        errorMessage.value = 'Не указан токен опроса';
        return;
    }

    loading.value = true;
    errorMessage.value = '';
    done.value = false;

    try {
        const { data } = await evaluationApi.show(token.value);
        const payload = data.data ?? {};
        procedureId.value = payload.procedure_id ?? null;
        questions.value = Array.isArray(payload.questions) ? payload.questions : [];

        for (const q of questions.value) {
            answersMap[q.id] = q.field_type === 'rating' ? null : '';
        }
    } catch (e) {
        errorMessage.value = e?.response?.data?.message || 'Опрос недоступен';
        questions.value = [];
    } finally {
        loading.value = false;
    }
}

/**
 * Собирает payload answers для бэка.
 * @returns {Array<{ question_id: number, value: unknown }>}
 */
function buildAnswers() {
    return questions.value.map((q) => ({
        question_id: q.id,
        value: answersMap[q.id],
    }));
}

/**
 * Отправка ответов опроса.
 * @returns {Promise<void>}
 */
async function onSubmit() {
    for (const q of questions.value) {
        if (q.is_required && (answersMap[q.id] === null || answersMap[q.id] === '' || answersMap[q.id] === undefined)) {
            ElMessage.warning(`Ответьте на вопрос: ${q.question}`);
            return;
        }
    }

    submitting.value = true;
    try {
        await evaluationApi.submit(token.value, {
            answers: buildAnswers(),
            contractor_score: scores.contractor_score,
            product_score: scores.product_score,
            comment: scores.comment || undefined,
        });
        done.value = true;
        ElMessage.success('Спасибо, опрос сохранён');
    } catch (e) {
        const fields = mapLaravelErrorsToFields(e?.response?.data?.errors || [e?.response?.data?.message || e?.message]);
        ElMessage.error(fields._form || Object.values(fields)[0] || 'Не удалось отправить');
    } finally {
        submitting.value = false;
    }
}

onMounted(load);
watch(token, load);
</script>

<template>
  <div class="etp-page">
    <div class="etp-card form-card" v-loading="loading">
      <template v-if="done">
        <h1>Опрос завершён</h1>
        <p>Благодарим за оценку качества закупки.</p>
      </template>

      <template v-else>
        <h1>Опрос качества закупки</h1>
        <p v-if="procedureId" class="muted">Процедура №{{ procedureId }}</p>

        <el-alert
          v-if="errorMessage"
          type="error"
          :title="errorMessage"
          show-icon
          :closable="false"
          class="mb"
        />

        <template v-if="questions.length">
          <div
            v-for="q in questions"
            :key="q.id"
            class="question"
          >
            <div class="question__title">
              {{ q.question }}
              <span v-if="q.is_required" class="req">*</span>
            </div>

            <el-rate
              v-if="q.field_type === 'rating'"
              v-model="answersMap[q.id]"
              :max="5"
            />
            <el-input
              v-else-if="q.field_type === 'textarea'"
              v-model="answersMap[q.id]"
              type="textarea"
              :rows="3"
            />
            <el-select
              v-else-if="q.field_type === 'select' && Array.isArray(q.options)"
              v-model="answersMap[q.id]"
              placeholder="Выберите"
              style="width: 100%"
            >
              <el-option
                v-for="(opt, idx) in q.options"
                :key="idx"
                :label="typeof opt === 'object' ? (opt.label || opt.value) : String(opt)"
                :value="typeof opt === 'object' ? opt.value : opt"
              />
            </el-select>
            <el-input
              v-else
              v-model="answersMap[q.id]"
            />
          </div>

          <el-divider />

          <h2 class="scores-title">Оценка победителя</h2>
          <el-form label-position="top">
            <el-form-item label="Оценка подрядчика (1–5)">
              <el-rate v-model="scores.contractor_score" :max="5" />
            </el-form-item>
            <el-form-item label="Оценка товара / результата (1–5)">
              <el-rate v-model="scores.product_score" :max="5" />
            </el-form-item>
            <el-form-item label="Комментарий">
              <el-input v-model="scores.comment" type="textarea" :rows="3" />
            </el-form-item>
          </el-form>

          <el-button type="primary" :loading="submitting" style="width: 100%" @click="onSubmit">
            Отправить ответы
          </el-button>
        </template>
      </template>
    </div>
  </div>
</template>

<style scoped>
.form-card {
  max-width: 640px;
}

.muted {
  color: #6b7280;
}

.mb {
  margin-bottom: 1rem;
}

.question {
  margin: 1.25rem 0;
}

.question__title {
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.req {
  color: #dc2626;
}

.scores-title {
  font-size: 1.05rem;
  margin-bottom: 0.5rem;
}
</style>
