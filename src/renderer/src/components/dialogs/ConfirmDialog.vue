<script setup lang="ts">
import { useAppStore } from '@renderer/stores/app'
import { X } from 'lucide-vue-next'

const appStore = useAppStore()

function handleConfirm() {
  if (appStore.confirmDialog.onConfirm) {
    appStore.confirmDialog.onConfirm()
  }
  appStore.closeConfirmDialog()
}

function handleCancel() {
  appStore.closeConfirmDialog()
}
</script>

<template>
  <Teleport to="body">
    <div v-if="appStore.confirmDialog.open" class="confirm-overlay" @click.self="handleCancel">
      <div class="confirm-container">
        <div class="confirm-header">
          <h3 class="confirm-title">{{ appStore.confirmDialog.title }}</h3>
          <button class="confirm-close" @click="handleCancel">
            <X :size="18" />
          </button>
        </div>
        <div class="confirm-body">
          <p class="confirm-message">{{ appStore.confirmDialog.message }}</p>
        </div>
        <div class="confirm-footer">
          <button class="btn btn-ghost" @click="handleCancel">取消</button>
          <button class="btn btn-danger" @click="handleConfirm">{{ appStore.confirmDialog.confirmText }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  animation: fade-in 150ms ease-out;
}

.confirm-container {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  min-width: 320px;
  max-width: 90vw;
  animation: bounce 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.confirm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border);
}

.confirm-title {
  font-size: var(--font-md);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.confirm-close {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 150ms ease;
}

.confirm-close:hover {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.confirm-body {
  padding: var(--space-4);
}

.confirm-message {
  font-size: var(--font-base);
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.6;
}

.confirm-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border-top: 1px solid var(--color-border);
}

.btn {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-xl);
  font-size: var(--font-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all 200ms ease;
  border: none;
}

.btn-ghost {
  background: transparent;
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
}

.btn-ghost:hover {
  background: var(--color-bg-soft);
  color: var(--color-text-primary);
}

.btn-danger {
  background: var(--color-danger);
  color: white;
  box-shadow: var(--shadow-sm);
}

.btn-danger:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}
</style>
