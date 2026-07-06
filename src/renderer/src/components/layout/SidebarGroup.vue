<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useGroupStore } from '@renderer/stores/group'
import { useViewStore } from '@renderer/stores/view'
import { useAppStore } from '@renderer/stores/app'
import { getCachedIcon, fetchAndCacheIcon } from '@renderer/composables/useIconCache'
// import { useToast } from '@renderer/composables/useToast'
import { ChevronRight, Trash2, Eye, EyeOff } from 'lucide-vue-next'
import draggable from 'vuedraggable'
import type { Group } from '@renderer/stores/group'

const props = defineProps<{
  group: Group
}>()

const groupStore = useGroupStore()
const viewStore = useViewStore()
const appStore = useAppStore()
// const { show: showToast } = useToast()

const isExpanded = ref(props.group.collapsed === 0)

// Long press delete state
const longPressTimer = ref<ReturnType<typeof setTimeout> | null>(null)
const longPressActiveId = ref<string | null>(null)
const longPressTriggered = ref(false)
const shakingViewId = ref<string | null>(null)

const visibleGroupViews = computed(() =>
  viewStore.getViewsByGroup(props.group.id).filter(v => v.visible === 1)
)

const hiddenGroupViews = computed(() =>
  viewStore.getViewsByGroup(props.group.id).filter(v => v.visible === 0)
)

const allGroupViews = computed(() =>
  viewStore.getViewsByGroup(props.group.id)
)

const iconSrcMap = ref<Record<string, string>>({})

function resolveIcon(iconUrl: string) {
  if (!iconUrl || iconSrcMap.value[iconUrl]) return
  getCachedIcon(iconUrl).then((cached) => {
    if (cached) {
      iconSrcMap.value[iconUrl] = cached
      return
    }
    fetchAndCacheIcon(iconUrl).then((result) => {
      iconSrcMap.value[iconUrl] = result
    })
  })
}

watch(allGroupViews, (views) => {
  views.forEach(v => resolveIcon(v.icon))
}, { immediate: true })

function toggleExpand() {
  isExpanded.value = !isExpanded.value
  groupStore.toggleCollapse(props.group.id)
}

function handleViewClick(viewId: string) {
  if (longPressTriggered.value) {
    longPressTriggered.value = false
    return
  }
  viewStore.setActiveView(viewId)
}

function getViewInitials(name: string) {
  return name.slice(0, 2).toUpperCase()
}

function handleMouseDown(viewId: string) {
  longPressTriggered.value = false
  longPressTimer.value = setTimeout(() => {
    longPressActiveId.value = viewId
    longPressTriggered.value = true
  }, 500)
}

function handleMouseUp() {
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value)
    longPressTimer.value = null
  }
}

function handleMouseLeave() {
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value)
    longPressTimer.value = null
  }
  longPressActiveId.value = null
  longPressTriggered.value = false
}

async function confirmDelete(viewId: string) {
  // Remove from sidebar (set visible=0), don't delete the view itself
  await viewStore.updateView(viewId, { visible: 0 })
  // Destroy the WebContentsView to free memory
  window.api.webview.remove(viewId)
  // Force cleanup any lingering renderer process
  window.api.webview.forceCleanup(viewId)
  // If this was the active view, switch to another visible view
  if (viewStore.activeViewId === viewId) {
    const nextVisible = viewStore.views.find(v => v.visible === 1 && v.id !== viewId)
    if (nextVisible) {
      viewStore.setActiveView(nextVisible.id)
    } else {
      viewStore.activeViewId = null
    }
  }
  longPressActiveId.value = null
  longPressTriggered.value = false
}

async function toggleVisibility(viewId: string) {
  const view = viewStore.views.find(v => v.id === viewId)
  if (!view) return

  if (view.visible === 1) {
    await viewStore.updateView(viewId, { visible: 0 })
    window.api.webview.remove(viewId)
    window.api.webview.forceCleanup(viewId)
    if (viewStore.activeViewId === viewId) {
      const nextVisible = viewStore.views.find(v => v.visible === 1 && v.id !== viewId)
      if (nextVisible) {
        viewStore.setActiveView(nextVisible.id)
      } else {
        viewStore.activeViewId = null
      }
    }
  } else {
    if (viewStore.visibleViewCount >= 8) {
      shakingViewId.value = viewId
      setTimeout(() => { shakingViewId.value = null }, 500)
      // showToast('最多只能保留8个常用视图，请先隐藏一个。')
      return
    }
    await viewStore.updateView(viewId, { visible: 1 })
  }
}

async function handleHiddenViewClick(viewId: string) {
  if (viewStore.visibleViewCount >= 8) {
    shakingViewId.value = viewId
    setTimeout(() => { shakingViewId.value = null }, 500)
    // showToast('最多只能保留8个常用视图，请先隐藏一个。')
    return
  }
  await viewStore.updateView(viewId, { visible: 1 })
  viewStore.setActiveView(viewId)
  const activeView = viewStore.activeView
  if (activeView) window.api.webview.create(activeView.id, activeView.url)
}

async function onDragEnd() {
  const views = visibleGroupViews.value
  for (let i = 0; i < views.length; i++) {
    if (views[i].sort_order !== i) {
      await viewStore.updateView(views[i].id, { sort_order: i })
    }
  }
}
</script>

<template>
  <div class="sidebar-group">
    <!-- Group Header -->
    <div class="group-header" @click="toggleExpand">
      <span v-if="appStore.sidebarExpanded" class="group-name">{{ group.name }}</span>
      <span v-if="appStore.sidebarExpanded" class="group-arrow" :class="{ expanded: isExpanded }">
        <ChevronRight :size="14" />
      </span>
      <span v-if="!appStore.sidebarExpanded" class="group-initials">{{ group.name.slice(0, 1) }}</span>
    </div>

    <!-- View List -->
    <div v-if="appStore.sidebarExpanded ? isExpanded : true" :style="{padding:!appStore.sidebarExpanded?'0px':'auto'}" class="group-views" :class="{ collapsed: !appStore.sidebarExpanded }">
      <draggable
        :list="visibleGroupViews"
        :disabled="!appStore.sidebarExpanded"
        item-key="id"
        class="draggable-list"
        ghost-class="drag-ghost"
        @end="onDragEnd"
      >
        <template #item="{ element: view }">
          <div
            class="view-item"
            :style="{marginBottom:!appStore.sidebarExpanded?'5px':'auto'}"
            :class="{ active: viewStore.activeViewId === view.id, 'long-press-active': longPressActiveId === view.id }"
            @click="handleViewClick(view.id)"
            @mousedown="handleMouseDown(view.id)"
            @mouseup="handleMouseUp"
            @mouseleave="handleMouseLeave"
            :title="longPressActiveId === view.id ? undefined : '长按可移除视图'"
          >
            <div class="view-icon" :class="{ 'delete-mode': longPressActiveId === view.id }">
              <img v-if="view.icon" :src="iconSrcMap[view.icon] || view.icon" class="view-icon-img" alt="" />
              <span v-else class="view-initials">{{ getViewInitials(view.name) }}</span>
              <button
                v-if="longPressActiveId === view.id"
                class="delete-badge"
                @click.stop="confirmDelete(view.id)"
              >
                <Trash2 :size="12" />
              </button>
            </div>
            <span v-if="appStore.sidebarExpanded" class="view-name">{{ view.name }}</span>
            <button
              v-if="appStore.sidebarExpanded"
              class="eye-toggle"
              @click.stop="toggleVisibility(view.id)"
              title="隐藏"
            >
              <Eye :size="14" />
            </button>
          </div>
        </template>
      </draggable>

      <!-- Hidden views section - only shown when sidebar is expanded -->
      <div v-if="appStore.sidebarExpanded && hiddenGroupViews.length > 0" class="hidden-views-section">
        <div class="hidden-section-label">已隐藏</div>
        <div
          v-for="view in hiddenGroupViews"
          :key="view.id"
          class="view-item hidden-view"
          :class="{ shaking: shakingViewId === view.id }"
          @click="handleHiddenViewClick(view.id)"
        >
          <div class="view-icon">
            <img v-if="view.icon" :src="iconSrcMap[view.icon] || view.icon" class="view-icon-img" alt="" />
            <span v-else class="view-initials">{{ getViewInitials(view.name) }}</span>
          </div>
          <span class="view-name dimmed">{{ view.name }}</span>
          <button
            class="eye-toggle"
            @click.stop="toggleVisibility(view.id)"
            title="显示"
          >
            <EyeOff :size="14" />
          </button>
        </div>
      </div>

      <!-- Add view button inside group -->
      <div
        v-if="appStore.sidebarExpanded"
         :style="{marginBottom:!appStore.sidebarExpanded?'5px':'auto'}"
        class="view-item add-view-btn"
        @click="appStore.openAddViewDialog(props.group.id)"
      >
        <div class="view-icon" style="border-style: dashed;">
          <span class="view-initials" style="font-size: 16px;">+</span>
        </div>
        <span class="view-name" style="color: var(--color-text-placeholder);">添加视图</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sidebar-group {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.group-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: background-color 150ms ease;
  user-select: none;
  position: relative;
  min-height: 36px;
}

.group-header:hover {
  background: var(--color-primary-light);
}

.group-name {
  flex: 1;
  font-size: var(--font-sm);
  font-weight: 600;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.group-arrow {
  display: flex;
  align-items: center;
  transition: transform 200ms var(--ease-bounce);
  color: var(--color-text-secondary);
}

.group-arrow.expanded {
  transform: rotate(90deg);
}

.group-initials {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.view-icon-img {
  width: 30px;
  height: 30px;
  object-fit: contain;
  display: block;
}

/* Long press delete */
.view-icon.delete-mode {
  animation: press-pulse 600ms ease-in-out infinite;
  background: var(--color-danger-light);
  backdrop-filter: blur(8px);
  border-color: var(--color-danger);
}

.delete-badge {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--color-danger);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  z-index: 2;
  border: 2px solid var(--color-bg-soft);
}

.view-item.long-press-active {
  background: var(--color-danger-light);
}

/* Views */
.group-views {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-1) 0;
  padding-left: var(--space-2);
  position: relative;
}

.group-views.collapsed {
  padding-left: 0;
  align-items: center;
}

.draggable-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.drag-ghost {
  opacity: 0.4;
  background: var(--color-primary-light);
  border-radius: var(--radius-sm);
}

.view-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 200ms var(--ease-bounce);
  position: relative;
  min-height: 40px;
}

.view-item:hover {
  background: var(--color-primary-light);
  transform: translateY(-1px);
}

.view-item.active {
  background: var(--color-primary-light);
}

.view-item.active .view-icon {
  animation: bounce 300ms var(--ease-bounce);
}

.view-item.active .view-name {
  color: var(--color-text-primary);
  font-weight: 500;
}

.view-icon {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 200ms var(--ease-bounce);
  overflow: hidden;
  position: relative;
}

.view-item:hover .view-icon {
  transform: scale(1.05);
  box-shadow: var(--shadow-sm);
}

.view-initials {
  font-size: 10px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.add-view-btn {
  opacity: 0.7;
}

.add-view-btn:hover {
  opacity: 1;
}

.view-name {
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.view-name.dimmed {
  color: var(--color-text-placeholder);
}

.hidden-view {
  opacity: 0.6;
}

.hidden-view:hover {
  opacity: 0.9;
}

.hidden-view.shaking {
  animation: shake 400ms ease;
}

.eye-toggle {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-placeholder);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 150ms ease;
  flex-shrink: 0;
  margin-left: auto;
  opacity: 0;
}

.view-item:hover .eye-toggle {
  opacity: 1;
}

.eye-toggle:hover {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.hidden-views-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  border-top: 1px dashed var(--color-border);
  margin-top: var(--space-1);
  padding-top: var(--space-1);
}

.hidden-section-label {
  font-size: var(--font-xs);
  color: var(--color-text-placeholder);
  padding: var(--space-1) var(--space-2);
}
</style>
