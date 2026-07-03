<script setup lang="ts">
import { useToast } from '@renderer/composables/useToast'
import { useAppStore } from '@renderer/stores/app'
import { computed } from 'vue'

const { message, visible } = useToast()
const appStore = useAppStore()

// Hide toast when dock is open (WebContentsView would cover it)
const shouldShow = computed(() => visible.value && !appStore.topDockOpen)
</script>

<template>
  <Teleport to="body">
    <div v-if="shouldShow" class="toast-container">
      <div class="toast-content">
        {{ message }}
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 300;
  animation: toast-in 300ms ease-out;
}

.toast-content {
  padding: 10px 20px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  color: var(--color-text-primary);
  font-size: var(--font-sm);
  font-weight: 500;
  white-space: nowrap;
  backdrop-filter: blur(8px);
}
</style>
