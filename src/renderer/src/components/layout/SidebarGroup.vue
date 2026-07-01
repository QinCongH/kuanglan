<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGroupStore } from '@renderer/stores/group'
import { useViewStore } from '@renderer/stores/view'
import { useAppStore } from '@renderer/stores/app'
import { ChevronRight, Pencil } from 'lucide-vue-next'
import type { Group } from '@renderer/stores/group'

const props = defineProps<{
  group: Group
}>()

const groupStore = useGroupStore()
const viewStore = useViewStore()
const appStore = useAppStore()

const isExpanded = ref(props.group.collapsed === 0)

const groupViews = computed(() =>
  viewStore.getViewsByGroup(props.group.id).filter(v => v.visible === 1)
)

function toggleExpand() {
  isExpanded.value = !isExpanded.value
  groupStore.toggleCollapse(props.group.id)
}

function handleViewClick(viewId: string) {
  viewStore.setActiveView(viewId)
}

function getViewInitials(name: string) {
  return name.slice(0, 2).toUpperCase()
}

function handleEditView(viewId: string) {
  appStore.openEditViewDialog(viewId)
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
      <div
        v-for="view in groupViews"
        :key="view.id"
        class="view-item"
        :class="{ active: viewStore.activeViewId === view.id }"
        @click="handleViewClick(view.id)"
      >
        <div class="view-icon">
          <img v-if="view.icon" :src="view.icon" class="view-icon-img" alt="" />
          <span v-else class="view-initials">{{ getViewInitials(view.name) }}</span>
        </div>
        <span v-if="appStore.sidebarExpanded" class="view-name">{{ view.name }}</span>
        <button
          v-if="appStore.sidebarExpanded"
          class="view-edit-btn"
          @click.stop="handleEditView(view.id)"
          title="编辑视图"
        >
          <Pencil :size="12" />
        </button>
      </div>
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

.view-edit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  opacity: 0;
  transition: all 150ms ease;
  background: transparent;
  border: none;
  cursor: pointer;
  margin-left: auto;
}

.view-item:hover .view-edit-btn {
  opacity: 1;
}

.view-edit-btn:hover {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.view-icon-img {
  width: 30px;
  height: 30px;
  object-fit: contain;
  display: block;
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
