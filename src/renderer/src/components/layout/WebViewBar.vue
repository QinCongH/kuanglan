<script setup lang="ts">
import { ref } from 'vue'
import { useViewStore } from '@renderer/stores/view'
import { RefreshCw, ExternalLink, Pin, Minus, Square, X, Trash2 } from 'lucide-vue-next'

const viewStore = useViewStore()

const isMaximized = ref(false)

async function handleMinimize() {
  await window.api.window.minimize()
}

async function handleMaximize() {
  await window.api.window.maximize()
  isMaximized.value = await window.api.window.isMaximized()
}

async function handleClose() {
  await window.api.window.close()
}

function handleRefresh() {
  window.api.webview.reloadActive()
}

function handleClearCache() {
  const id = viewStore.activeViewId
  if (id) {
    window.api.webview.clearCache(id)
    window.api.webview.reloadActive()
  }
}

function handleOpenExternal() {
  const view = viewStore.activeView
  if (view?.url) {
    window.api.shell.openExternal(view.url)
  }
}
</script>

<template>
  <div class="webview-bar">
    <div class="bar-left"></div>
    <div class="bar-actions">
      <button class="action-btn" @click="handleRefresh" title="刷新">
        <RefreshCw :size="14" />
      </button>
      <button class="action-btn" @click="handleClearCache" title="清理缓存">
        <Trash2 :size="14" />
      </button>
      <button class="action-btn" @click="handleOpenExternal" title="在浏览器中打开">
        <ExternalLink :size="14" />
      </button>
      <button class="action-btn" title="固定">
        <Pin :size="14" />
      </button>
      <div class="window-divider"></div>
      <button class="action-btn window-btn" @click="handleMinimize" title="最小化">
        <Minus :size="14" />
      </button>
      <button class="action-btn window-btn" @click="handleMaximize" title="最大化/还原">
        <Square :size="14" />
      </button>
      <button class="action-btn window-btn close-btn" @click="handleClose" title="关闭">
        <X :size="14" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.webview-bar {
  height: var(--topbar-height);
  min-height: var(--topbar-height);
  background: var(--color-bg-card);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-3);
  flex-shrink: 0;
  -webkit-app-region: drag;
}

.webview-bar .bar-left,
.webview-bar .bar-actions {
  -webkit-app-region: no-drag;
}

.bar-left {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  -webkit-app-region: no-drag;
}

.bar-actions {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  flex-shrink: 0;
}

.action-btn {
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

.action-btn:hover {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.window-divider {
  width: 1px;
  height: 16px;
  background: var(--color-border);
  margin: 0 var(--space-1);
}

.window-btn:hover {
  background: var(--color-bg-soft);
  color: var(--color-text-primary);
}

.close-btn:hover {
  background: var(--color-danger);
  color: white;
}
</style>
