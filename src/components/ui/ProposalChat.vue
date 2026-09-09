<script setup>
/**
 * Чат переписки по КП: свои сообщения справа (синие), чужие слева (белые).
 */
import { computed, nextTick, ref, watch } from 'vue';
import { formatDateTime } from '@/helpers/format';

const props = defineProps({
    /** Список сообщений с API */
    messages: {
        type: Array,
        default: () => [],
    },
    /** ID текущего пользователя (для is_mine fallback) */
    currentUserId: {
        type: [Number, String],
        default: null,
    },
});

const listRef = ref(null);

const sorted = computed(() => [...(props.messages || [])].sort((a, b) => Number(a.id) - Number(b.id)));

/**
 * @param {Record<string, unknown>} m Сообщение
 * @returns {boolean}
 */
function isMine(m) {
    if (typeof m.is_mine === 'boolean') {
        return m.is_mine;
    }
    if (props.currentUserId == null || props.currentUserId === '') {
        return false;
    }
    return Number(m.sender_id) === Number(props.currentUserId);
}

/**
 * @param {Record<string, unknown>} m Сообщение
 * @returns {string}
 */
function senderName(m) {
    if (isMine(m)) {
        return 'Вы';
    }
    return m.sender?.name || m.sender?.email || m.sender?.inn || 'Собеседник';
}

watch(
    () => sorted.value.length,
    async () => {
        await nextTick();
        if (listRef.value) {
            listRef.value.scrollTop = listRef.value.scrollHeight;
        }
    },
    { flush: 'post' },
);
</script>

<template>
  <div class="chat-wrap">
    <div class="chat-wrap__title">Диалог (как в мессенджере)</div>
    <div ref="listRef" class="chat" data-testid="proposal-chat">
      <div v-if="!sorted.length" class="chat__empty">Сообщений пока нет — напишите первое ниже</div>
      <div
        v-for="m in sorted"
        :key="m.id"
        class="chat__row"
        :class="isMine(m) ? 'chat__row--mine' : 'chat__row--other'"
      >
        <div class="chat__bubble">
          <div class="chat__meta">
            {{ senderName(m) }} · {{ formatDateTime(m.created_at) }}
          </div>
          <div class="chat__text">{{ m.message || m.body || m.text }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-wrap {
  margin-top: 0.5rem;
}

.chat-wrap__title {
  font-size: 0.8rem;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 0.35rem;
}

.chat {
  max-height: 420px;
  min-height: 140px;
  overflow-y: auto;
  padding: 1rem;
  background: linear-gradient(180deg, #eef2ff 0%, #f3f4f6 100%);
  border: 1px solid #c7d2fe;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.chat__empty {
  color: #6b7280;
  text-align: center;
  padding: 1.5rem 1rem;
}

.chat__row {
  display: flex;
  width: 100%;
}

.chat__row--mine {
  justify-content: flex-end;
}

.chat__row--other {
  justify-content: flex-start;
}

.chat__bubble {
  max-width: 78%;
  padding: 0.65rem 0.85rem;
  border-radius: 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  line-height: 1.35;
}

.chat__row--other .chat__bubble {
  background: #ffffff;
  border-bottom-left-radius: 4px;
}

.chat__row--mine .chat__bubble {
  background: #2563eb;
  color: #fff;
  border-bottom-right-radius: 4px;
}

.chat__row--mine .chat__meta {
  color: rgba(255, 255, 255, 0.85);
}

.chat__meta {
  font-size: 0.72rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.chat__text {
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 0.95rem;
}
</style>
