<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useViewStore } from '@renderer/stores/view'
import { useAppStore } from '@renderer/stores/app'
import { RefreshCw, ExternalLink, Home, Minus, Square, X, Trash2, Search, Link } from 'lucide-vue-next'

const viewStore = useViewStore()
const appStore = useAppStore()

const isMaximized = ref(false)
const showClearCacheConfirm = ref(false)
const showGoHomeConfirm = ref(false)

const searchInputRef = ref<HTMLInputElement | null>(null)

const dockOpen = computed(() => appStore.topDockOpen)

watch(dockOpen, (val) => {
  if (val) {
    nextTick(() => {
      searchInputRef.value?.focus()
    })
  } else {
    appStore.dockSearchQuery = ''
  }
})

async function handleMinimize() {
  appStore.topDockOpen = false
  appStore.dockSearchQuery = ''
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

function handleClearCacheClick() {
  window.api.webview.hideAll()
  showClearCacheConfirm.value = true
}

async function confirmClearCache() {
  showClearCacheConfirm.value = false
  const id = viewStore.activeViewId
  if (id) {
    await window.api.webview.clearCache(id)
    window.api.webview.reloadActive()
    window.api.webview.switch(id)
  }
}

function cancelClearCache() {
  showClearCacheConfirm.value = false
  const id = viewStore.activeViewId
  if (id) window.api.webview.switch(id)
}

function handleOpenExternal() {
  const view = viewStore.activeView
  if (view?.url) {
    window.api.shell.openExternal(view.url)
  }
}

function handleGoHomeClick() {
  const view = viewStore.activeView
  if (!view?.url) return
  window.api.webview.hideAll()
  showGoHomeConfirm.value = true
}

function confirmGoHome() {
  showGoHomeConfirm.value = false
  const view = viewStore.activeView
  if (view?.url) {
    window.api.webview.navigate(view.id, view.url)
  }
  const id = viewStore.activeViewId
  if (id) window.api.webview.switch(id)
}

function cancelGoHome() {
  showGoHomeConfirm.value = false
  const id = viewStore.activeViewId
  if (id) window.api.webview.create(id, viewStore.activeView?.url ?? '')
}
</script>

<template>
  <div class="webview-bar">
    <div class="bar-left"></div>

    <!-- Center search - visible when dock is open -->
    <div v-if="dockOpen" class="search-area">
      <div class="search-box">
        <Search :size="14" class="search-icon" />
        <input
          ref="searchInputRef"
          v-model="appStore.dockSearchQuery"
          type="text"
          class="search-input"
          placeholder="搜索视图..."
          @keydown.escape="appStore.dockSearchQuery = ''"
        />
        <button v-if="appStore.dockSearchQuery" class="search-clear" @click="appStore.dockSearchQuery = ''">
          <X :size="12" />
        </button>
      </div>
    </div>

    <div class="bar-actions">
      <button class="action-btn" @click="appStore.openImportViewDialog()" title="导入视图">
        <Link :size="14" />
      </button>
      <button class="action-btn" @click="handleRefresh" title="刷新">
        <RefreshCw :size="14" />
      </button>
      <button class="action-btn" @click="handleClearCacheClick" title="清理缓存">
        <Trash2 :size="14" />
      </button>
      <button class="action-btn" @click="handleGoHomeClick" title="回到主页">
        <Home :size="14" />
      </button>
      <button class="action-btn" @click="handleOpenExternal" title="在浏览器中打开">
        <ExternalLink :size="14" />
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

  <!-- Clear cache confirm popup -->
  <Teleport to="body">
    <div v-if="showClearCacheConfirm" style="position:fixed;inset:0;background:rgba(0,0,0,0.3);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:200;animation:fade-in 150ms ease-out" @click.self="cancelClearCache">
      <div style="background:var(--color-bg-card);border:1px solid var(--color-border);border-radius:var(--radius-md);box-shadow:var(--shadow-lg);padding:16px 20px;min-width:220px;animation:bounce 300ms cubic-bezier(0.34,1.56,0.64,1)">
        <p style="font-size:14px;color:var(--color-text-primary);margin:0 0 16px 0;font-weight:500">确认清理当前视图缓存？</p>
        <div style="display:flex;gap:8px;justify-content:flex-end">
          <button style="padding:6px 16px;border-radius:var(--radius-sm);font-size:12px;font-weight:500;cursor:pointer;background:transparent;color:var(--color-text-secondary);border:1px solid var(--color-border)" @click="cancelClearCache">取消</button>
          <button style="padding:6px 16px;border-radius:var(--radius-sm);font-size:12px;font-weight:500;cursor:pointer;background:#888;color:white;border:none" @click="confirmClearCache">清理</button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Go home confirm popup -->
  <Teleport to="body">
    <div v-if="showGoHomeConfirm" style="position:fixed;inset:0;background:rgba(0,0,0,0.3);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:200;animation:fade-in 150ms ease-out" @click.self="cancelGoHome">
      <div style="background:var(--color-bg-card);border:1px solid var(--color-border);border-radius:var(--radius-md);box-shadow:var(--shadow-lg);padding:16px 20px;min-width:220px;animation:bounce 300ms cubic-bezier(0.34,1.56,0.64,1)">
        <p style="font-size:14px;color:var(--color-text-primary);margin:0 0 16px 0;font-weight:500">确认回到主页？</p>
        <div style="display:flex;gap:8px;justify-content:flex-end">
          <button style="padding:6px 16px;border-radius:var(--radius-sm);font-size:12px;font-weight:500;cursor:pointer;background:transparent;color:var(--color-text-secondary);border:1px solid var(--color-border)" @click="cancelGoHome">取消</button>
          <button style="padding:6px 16px;border-radius:var(--radius-sm);font-size:12px;font-weight:500;cursor:pointer;background:#888;color:white;border:none" @click="confirmGoHome">确认</button>
        </div>
      </div>
    </div>
  </Teleport>
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
  position: relative;
}

.webview-bar .bar-actions,
.webview-bar .search-area {
  -webkit-app-region: no-drag;
}

.bar-left {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

/* Search area */
.search-area {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  background: var(--color-bg-soft);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  width: 240px;
  transition: border-color 200ms ease, box-shadow 200ms ease;
}

.search-box:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.search-icon {
  color: var(--color-text-placeholder);
  flex-shrink: 0;
}

.search-input {
  background: transparent;
  border: none;
  outline: none;
  color: var(--color-text-primary);
  font-size: 12px;
  width: 100%;
  min-width: 0;
}

.search-input::placeholder {
  color: var(--color-text-placeholder);
}

.search-clear {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-placeholder);
  background: var(--color-primary-light);
  border: none;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 150ms ease;
}

.search-clear:hover {
  background: var(--color-primary);
  color: white;
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
