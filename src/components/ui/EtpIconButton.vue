<script setup>
/**
 * Иконка-кнопка действия в таблицах (стиль Metronic btn-icon).
 */
defineProps({
    /** Тип Element Plus: primary | success | warning | danger | info */
    type: {
        type: String,
        default: 'primary',
    },
    /** Подсказка title */
    title: {
        type: String,
        required: true,
    },
    /** Disabled */
    disabled: {
        type: Boolean,
        default: false,
    },
});

defineEmits(['click']);
</script>

<template>
  <el-button
    class="etp-icon-btn"
    :type="type"
    :title="title"
    :aria-label="title"
    :disabled="disabled"
    circle
    size="small"
    @click="$emit('click', $event)"
  >
    <el-icon :size="14">
      <slot />
    </el-icon>
  </el-button>
</template>

<style scoped>
.etp-icon-btn {
  margin: 0 2px;
}
</style>
