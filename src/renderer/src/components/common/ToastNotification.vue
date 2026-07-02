<script setup lang="ts">
import { useToast } from '@renderer/composables/useToast'
import { useAppStore } from '@renderer/stores/app'

const { message, visible } = useToast()
const appStore = useAppStore()
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="toast-container" :class="{ 'dock-mode': appStore.topDockOpen }">
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

.toast-container.dock-mode {
  bottom: auto;
  top: 92px;
  z-index: 160;
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
