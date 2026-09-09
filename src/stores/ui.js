import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

/**
 * Глобальный UI: оверлей загрузки при API-запросах.
 */
export const useUiStore = defineStore('ui', () => {
    /** Счётчик активных запросов с глобальным спиннером */
    const pendingRequests = ref(0);

    const isGlobalLoading = computed(() => pendingRequests.value > 0);

    /**
     * @returns {void}
     */
    function beginRequest() {
        pendingRequests.value += 1;
    }

    /**
     * @returns {void}
     */
    function endRequest() {
        pendingRequests.value = Math.max(0, pendingRequests.value - 1);
    }

    return {
        pendingRequests,
        isGlobalLoading,
        beginRequest,
        endRequest,
    };
});
