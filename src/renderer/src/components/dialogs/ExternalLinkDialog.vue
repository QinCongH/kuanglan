<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@renderer/stores/app'
import { ExternalLink, Globe } from 'lucide-vue-next'

const appStore = useAppStore()

const isOpen = computed(() => appStore.externalLinkDialog.open)
const url = computed(() => appStore.externalLinkDialog.url)
const targetUrl = computed(() => appStore.externalLinkDialog.targetUrl)

function close() {
  appStore.closeExternalLinkDialog()
}

function openInBrowser() {
  window.api.shell.openExternal(targetUrl.value)
  close()
}
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="dialog-overlay" @click.self="close">
      <div class="dialog-container">
        <div class="dialog-icon">
          <Globe :size="32" />
        </div>

        <h3 class="dialog-title">即将离开当前页面</h3>
        <p class="dialog-desc">
          当前页面：<span class="url-text">{{ url }}</span>
        </p>
        <p class="dialog-desc">
          即将跳转到外部链接：<span class="url-text target">{{ targetUrl }}</span>
        </p>

        <div class="dialog-actions">
          <button class="btn btn-ghost" @click="close">取消</button>
          <button class="btn btn-primary" @click="openInBrowser">
            <ExternalLink :size="14" />
            <span>在浏览器中打开</span>
          </button>
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
  padding: var(--space-5) var(--space-4);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  box-shadow: var(--shadow-lg);
  animation: bounce 300ms var(--ease-bounce);
}

.dialog-icon {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-full);
  background: var(--color-primary-light);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.dialog-title {
  font-size: var(--font-md);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.dialog-desc {
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
  text-align: center;
  margin: 0;
  line-height: 1.5;
}

.url-text {
  font-family: var(--font-mono);
  color: var(--color-text-primary);
  word-break: break-all;
}

.url-text.target {
  color: var(--color-primary);
}

.dialog-actions {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-2);
  width: 100%;
  justify-content: center;
}

.btn {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-xl);
  font-size: var(--font-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all 200ms ease;
  border: none;
  display: flex;
  align-items: center;
  gap: var(--space-1);
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
