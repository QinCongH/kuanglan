<script setup lang="ts">
import { computed, watch } from 'vue'
import { useViewStore } from '@renderer/stores/view'
import { useAppStore } from '@renderer/stores/app'
import { Plus } from 'lucide-vue-next'

const viewStore = useViewStore()
const appStore = useAppStore()

const activeView = computed(() => viewStore.activeView)
const activeViewId = computed(() => viewStore.activeViewId)
const hasViews = computed(() => viewStore.views.length > 0)

const dialogOpen = computed(() =>
  appStore.settingsOpen ||
  appStore.addViewDialogOpen ||
  appStore.addGroupDialogOpen ||
  appStore.externalLinkDialog.open ||
  appStore.editViewDialog.open
)

function syncView(viewId: string | null) {
  if (!viewId) {
    window.api.webview.cleanupAll()
    return
  }

  const view = viewStore.views.find(v => v.id === viewId)
  if (!view) {
    window.api.webview.cleanupAll()
    return
  }

  window.api.webview.create(viewId, view.url)
}

watch(activeViewId, (id) => {
  syncView(id)
}, { immediate: true })

watch(dialogOpen, (isOpen) => {
  if (isOpen) {
    window.api.webview.hideAll?.()
  } else {
    const id = activeViewId.value
    if (id) {
      syncView(id)
    }
  }
})

function openAddViewDialog() {
  appStore.addViewDialogOpen = true
}

defineExpose({
  canGoBack: computed(() => {
    const id = activeViewId.value
    return id ? window.api.webview.canGoBack(id) : Promise.resolve(false)
  }),
  goBack: () => {
    const id = activeViewId.value
    if (id) window.api.webview.goBack(id)
  },
  navigateWebview: (url: string) => {
    const id = activeViewId.value
    if (id) window.api.webview.navigate(id, url)
  }
})
</script>

<template>
  <div class="view-container">
    <div v-if="!hasViews" class="empty-state">
      <div class="empty-icon">
        <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="4" ry="4"/>
          <path d="M3 9h18"/>
          <path d="M9 21V9"/>
        </svg>
      </div>
      <p class="empty-text">还没有添加任何视图</p>
      <p class="empty-hint">添加一个网页视图，开始使用框览</p>
      <button class="empty-action" @click="openAddViewDialog">
        <Plus :size="16" />
        <span>添加视图</span>
      </button>
    </div>
    <div v-else-if="!activeView" class="empty-state">
      <p class="empty-hint">从侧边栏选择一个视图</p>
    </div>
  </div>
</template>

<style scoped>
.view-container {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.empty-state {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  color: var(--color-text-secondary);
}

.empty-icon {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-lg);
  background: var(--color-bg-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-placeholder);
}

.empty-text {
  font-size: var(--font-md);
  font-weight: 500;
  color: var(--color-text-secondary);
  margin: 0;
}

.empty-hint {
  font-size: var(--font-sm);
  color: var(--color-text-placeholder);
  margin: 0;
}

.empty-action {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-xl);
  background: var(--color-primary);
  color: white;
  font-size: var(--font-sm);
  font-weight: 500;
  border: none;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: all 200ms ease;
  margin-top: var(--space-2);
}

.empty-action:hover {
  background: var(--color-primary-hover);
  box-shadow: var(--shadow-glow);
  transform: translateY(-1px);
}
</style>
