<script setup lang="ts">
import { useTheme } from '@renderer/composables/useTheme'

defineProps<{
  theme: 'light' | 'dark'
}>()

const { toggleTheme } = useTheme()
</script>

<template>
  <button class="theme-toggle" @click="toggleTheme" :title="theme === 'light' ? '切换到深色模式' : '切换到浅色模式'">
    <span class="toggle-icon">{{ theme === 'light' ? '🌙' : '☀️' }}</span>
  </button>
</template>

<style scoped>
.theme-toggle {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: var(--color-text-secondary);
  transition: all 200ms ease;
  font-size: 14px;
}

.theme-toggle:hover {
  background: var(--color-primary-light);
  color: var(--color-primary);
  transform: scale(1.1);
}

.toggle-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
