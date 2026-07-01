<script setup lang="ts">
import { ref, computed } from 'vue'
import { FolderOpen } from 'lucide-vue-next'

const selectedPath = ref('')
const error = ref('')

const canSubmit = computed(() => selectedPath.value.trim().length > 0)

async function handleSelectDir() {
  const path = await window.api.setup.selectDir()
  if (path) {
    selectedPath.value = path
    error.value = ''
  }
}

async function handleSubmit() {
  if (!selectedPath.value.trim()) return

  try {
    await window.api.setup.submitPath(selectedPath.value.trim())
  } catch {
    error.value = '路径设置失败，请检查目录权限后重试'
  }
}
</script>

<template>
  <div class="setup-page">
    <div class="setup-card">
      <div class="setup-accent"></div>

      <div class="setup-content">
        <div class="setup-icon">🎉</div>
        <h1 class="setup-title">欢迎使用框览</h1>
        <p class="setup-desc">请选择一个目录来存放您的资源文件</p>

        <div class="path-field">
          <input
            v-model="selectedPath"
            type="text"
            placeholder="请选择目录..."
            class="path-input"
            readonly
          />
          <button class="select-btn" @click="handleSelectDir">
            <FolderOpen :size="16" />
            <span>选择</span>
          </button>
        </div>

        <p v-if="error" class="error-msg">{{ error }}</p>

        <button
          class="submit-btn"
          :class="{ disabled: !canSubmit }"
          :disabled="!canSubmit"
          @click="handleSubmit"
        >
          确认
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.setup-page {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-base);
  -webkit-app-region: drag;
}

.setup-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  width: 420px;
  max-width: 90vw;
  overflow: hidden;
  position: relative;
  box-shadow: var(--shadow-lg);
  animation: bounce 300ms var(--ease-bounce);
}

.setup-accent {
  height: 4px;
  width: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
}

.setup-content {
  padding: var(--space-5) var(--space-4);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  -webkit-app-region: no-drag;
}

.setup-icon {
  font-size: 40px;
  line-height: 1;
}

.setup-title {
  font-family: var(--font-display);
  font-size: var(--font-lg);
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.setup-desc {
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
  margin: 0;
  text-align: center;
}

.path-field {
  width: 100%;
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-2);
}

.path-input {
  flex: 1;
  min-width: 0;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-soft);
  color: var(--color-text-primary);
  font-size: var(--font-sm);
  font-family: var(--font-mono);
  outline: none;
  cursor: default;
  transition: all 200ms ease;
}

.path-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.select-btn {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-soft);
  color: var(--color-text-secondary);
  font-size: var(--font-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all 200ms ease;
  flex-shrink: 0;
}

.select-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-primary-light);
}

.error-msg {
  font-size: var(--font-xs);
  color: var(--color-danger);
  margin: 0;
  align-self: flex-start;
}

.submit-btn {
  width: 100%;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-xl);
  background: var(--color-primary);
  color: white;
  font-size: var(--font-base);
  font-weight: 600;
  cursor: pointer;
  border: none;
  box-shadow: var(--shadow-sm);
  transition: all 200ms ease;
}

.submit-btn:hover:not(.disabled) {
  background: var(--color-primary-hover);
  box-shadow: var(--shadow-glow);
  transform: translateY(-1px);
}

.submit-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
