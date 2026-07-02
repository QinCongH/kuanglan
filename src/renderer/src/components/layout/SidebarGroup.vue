<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGroupStore } from '@renderer/stores/group'
import { useViewStore } from '@renderer/stores/view'
import { useAppStore } from '@renderer/stores/app'
import { ChevronRight, Trash2 } from 'lucide-vue-next'
import draggable from 'vuedraggable'
import type { Group } from '@renderer/stores/group'

const props = defineProps<{
  group: Group
}>()

const groupStore = useGroupStore()
const viewStore = useViewStore()
const appStore = useAppStore()

const isExpanded = ref(props.group.collapsed === 0)

// Long press delete state
const longPressTimer = ref<ReturnType<typeof setTimeout> | null>(null)
const longPressActiveId = ref<string | null>(null)
const longPressTriggered = ref(false)

const groupViews = computed(() =>
  viewStore.getViewsByGroup(props.group.id).filter(v => v.visible === 1)
)

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

async function onDragEnd() {
  const views = groupViews.value
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
    <div v-if="appStore.sidebarExpanded ? isExpanded : true" class="group-views" :class="{ collapsed: !appStore.sidebarExpanded }">
      <draggable
        :list="groupViews"
        :disabled="!appStore.sidebarExpanded"
        item-key="id"
        class="draggable-list"
        ghost-class="drag-ghost"
        @end="onDragEnd"
      >
        <template #item="{ element: view }">
          <div
            class="view-item"
            :class="{ active: viewStore.activeViewId === view.id, 'long-press-active': longPressActiveId === view.id }"
            @click="handleViewClick(view.id)"
            @mousedown="handleMouseDown(view.id)"
            @mouseup="handleMouseUp"
            @mouseleave="handleMouseLeave"
            :title="longPressActiveId === view.id ? undefined : '长按可移除视图'"
          >
            <div class="view-icon" :class="{ 'delete-mode': longPressActiveId === view.id }">
              <img v-if="view.icon" :src="view.icon" class="view-icon-img" alt="" />
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
          </div>
        </template>
      </draggable>
      <!-- Add view button inside group -->
      <div
        v-if="appStore.sidebarExpanded"
        class="view-item add-view-btn"
        @click="appStore.addViewDialogOpen = true"
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
</style>
