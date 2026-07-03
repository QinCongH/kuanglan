<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGroupStore } from '@renderer/stores/group'
import { useAppStore } from '@renderer/stores/app'
import { X } from 'lucide-vue-next'

const groupStore = useGroupStore()
const appStore = useAppStore()

const name = ref('')
const icon = ref('')

const isOpen = computed(() => appStore.addGroupDialogOpen)

function close() {
  appStore.addGroupDialogOpen = false
  name.value = ''
  icon.value = ''
}

async function handleSubmit() {
  if (!name.value.trim()) return

  await groupStore.createGroup({
    name: name.value.trim(),
    icon: icon.value || '📁',
    color: '',
    sort_order: groupStore.groups.length,
    collapsed: 0,
    is_default: 0
  })

  close()
}
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="dialog-overlay" @click.self="close">
      <div class="dialog-container">
        <div class="dialog-accent"></div>

        <div class="dialog-header">
          <h3 class="dialog-title">新建分组</h3>
          <button class="dialog-close" @click="close">
            <X :size="18" />
          </button>
        </div>

        <div class="dialog-body">
          <!-- Name -->
          <div class="form-field">
            <label class="form-label">分组名称</label>
            <input
              v-model="name"
              type="text"
              placeholder="例如：AI 助手"
              class="form-input"
            />
          </div>
        </div>

        <div class="dialog-footer">
          <button class="btn btn-ghost" @click="close">取消</button>
          <button class="btn btn-primary" @click="handleSubmit">创建</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 150;
  animation: fade-in 200ms ease-out;
}

.dialog-container {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  width: 400px;
  max-width: 90vw;
  overflow: hidden;
  position: relative;
  box-shadow: var(--shadow-lg);
  animation: bounce 300ms var(--ease-bounce);
}

.dialog-accent {
  height: 4px;
  width: 100%;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border);
}

.dialog-title {
  font-size: var(--font-md);
  font-weight: 600;
  color: var(--color-text-primary);
}

.dialog-close {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  transition: all 150ms ease;
}

.dialog-close:hover {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.dialog-body {
  padding: var(--space-3) var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border-top: 1px solid var(--color-border);
}

/* Form fields */
.form-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.form-label {
  font-size: var(--font-sm);
  font-weight: 500;
  color: var(--color-text-secondary);
}

.form-input {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-soft);
  color: var(--color-text-primary);
  font-size: var(--font-base);
  transition: all 200ms ease;
  outline: none;
}

.form-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

/* Buttons */
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

.btn-primary {
  background: var(--color-primary);
  color: white;
  box-shadow: var(--shadow-sm);
}

.btn-primary:hover {
  background: var(--color-primary-hover);
  box-shadow: var(--shadow-glow);
  transform: translateY(-1px);
}
</style>
