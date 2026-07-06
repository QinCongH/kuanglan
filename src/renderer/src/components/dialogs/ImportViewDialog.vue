<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore } from '@renderer/stores/app'
import { useGroupStore } from '@renderer/stores/group'
import { useViewStore } from '@renderer/stores/view'
import { useToast } from '@renderer/composables/useToast'
import { X, Link } from 'lucide-vue-next'
import type { PrefillViewData } from '@renderer/stores/app'

const appStore = useAppStore()
const groupStore = useGroupStore()
const viewStore = useViewStore()
const { show: showToast } = useToast()

const isOpen = computed(() => appStore.importViewDialog.open)
const linkInput = ref('')
const errorMessage = ref('')

function parseKlLink(text: string): PrefillViewData | null {
  const trimmed = text.trim()
  if (!trimmed.startsWith('kl://')) return null
  try {
    const base64 = trimmed.slice(5)
    const json = new TextDecoder().decode(Uint8Array.from(atob(base64), c => c.charCodeAt(0)))
    const data = JSON.parse(json)
    if (!data.n || !data.u) return null
    return { name: data.n, url: data.u, icon: data.i ?? '', groupName: data.g ?? '' }
  } catch {
    return null
  }
}

function close() {
  appStore.closeImportViewDialog()
  linkInput.value = ''
  errorMessage.value = ''
}

async function handleImport() {
  errorMessage.value = ''

  if (!linkInput.value.trim()) {
    errorMessage.value = '请输入分享链接'
    return
  }

  const prefill = parseKlLink(linkInput.value)
  if (!prefill) {
    errorMessage.value = '无效的分享链接，请检查格式'
    return
  }

  const groupId = groupStore.defaultGroup?.id
  if (!groupId) {
    errorMessage.value = '未找到默认分组'
    return
  }

  await viewStore.createView({
    group_id: groupId,
    name: prefill.name,
    url: prefill.url,
    icon: prefill.icon,
    visible: 0,
    sort_order: viewStore.views.filter(v => v.group_id === groupId).length,
    bounds: '{}'
  })

  appStore.showDockHint = true
  showToast('视图已导入到默认分组')
  close()
}
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="dialog-overlay" @click.self="close">
      <div class="dialog-container">
        <div class="dialog-header">
          <h3 class="dialog-title">导入视图</h3>
          <button class="dialog-close" @click="close">
            <X :size="18" />
          </button>
        </div>

        <div class="dialog-body">
          <div class="dialog-icon-hint">
            <Link :size="24" />
            <p>粘贴分享链接以导入视图</p>
          </div>

          <div class="form-field">
            <label class="form-label">分享链接</label>
            <input
              v-model="linkInput"
              type="text"
              placeholder="kl://..."
              class="form-input form-input-mono"
              @keydown.enter="handleImport"
            />
            <p v-if="errorMessage" class="form-error">{{ errorMessage }}</p>
          </div>
        </div>

        <div class="dialog-footer">
          <button class="btn btn-ghost" @click="close">取消</button>
          <button class="btn btn-primary" @click="handleImport">导入</button>
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
  z-index: 200;
  animation: fade-in 200ms ease-out;
}

.dialog-container {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  width: 420px;
  max-width: 90vw;
  max-height: 90vh;
  overflow: hidden;
  position: relative;
  box-shadow: var(--shadow-lg);
  animation: bounce 300ms var(--ease-bounce);
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
  background: transparent;
  border: none;
  cursor: pointer;
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

.dialog-icon-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-text-secondary);
  padding: var(--space-2) 0;
}

.dialog-icon-hint p {
  font-size: var(--font-sm);
  margin: 0;
}

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

.form-input-mono {
  font-family: var(--font-mono);
  font-size: var(--font-sm);
}

.form-error {
  font-size: var(--font-xs);
  color: var(--color-danger);
  margin: 0;
}

.dialog-footer {
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
