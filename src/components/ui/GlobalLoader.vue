<script setup>
/**
 * Полноэкранный спиннер при активных API-запросах.
 */
import { storeToRefs } from 'pinia';
import { useUiStore } from '@/stores/ui';

const { isGlobalLoading } = storeToRefs(useUiStore());
</script>

<template>
  <Teleport to="body">
    <div v-if="isGlobalLoading" class="etp-global-loader" aria-busy="true" aria-live="polite">
      <div class="etp-global-loader__box">
        <div class="etp-global-loader__spinner" />
        <p>Загрузка…</p>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.etp-global-loader {
  position: fixed;
  inset: 0;
  z-index: 4000;
  background: rgba(15, 23, 42, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
}

.etp-global-loader__box {
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem 2rem;
  text-align: center;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  min-width: 160px;
}

.etp-global-loader__spinner {
  width: 42px;
  height: 42px;
  margin: 0 auto 0.75rem;
  border: 3px solid #e5e7eb;
  border-top-color: #7c2d36;
  border-radius: 50%;
  animation: etp-spin 0.7s linear infinite;
}

.etp-global-loader__box p {
  margin: 0;
  color: #374151;
  font-weight: 600;
}

@keyframes etp-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
