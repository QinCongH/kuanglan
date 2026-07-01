<script setup lang="ts">
import { watch } from 'vue'
import { useGroupStore } from '@renderer/stores/group'
import { useAppStore } from '@renderer/stores/app'
import { useTheme } from '@renderer/composables/useTheme'
import SidebarGroup from './SidebarGroup.vue'
import { Plus, FolderPlus, Settings } from 'lucide-vue-next'

const groupStore = useGroupStore()
const appStore = useAppStore()
const { currentTheme, toggleTheme } = useTheme()

// Notify main process when sidebar width changes
watch(() => appStore.sidebarExpanded, (expanded) => {
  const width = expanded ? 240 : 72
  window.api.webview.setSidebarWidth(width)
})

function handleAddGroup() {
  appStore.addGroupDialogOpen = true
}

function handleAddView() {
  appStore.addViewDialogOpen = true
}

function handleSettings() {
  appStore.settingsOpen = true
}
</script>

<template>
  <aside class="sidebar" :class="{ expanded: appStore.sidebarExpanded }">
    <!-- Brand -->
    <div class="sidebar-brand" @click="appStore.toggleSidebar">
      <div class="brand-icon">
        <img src="/icon.png" alt="框览" class="brand-logo" />
      </div>
      <span v-if="appStore.sidebarExpanded" class="brand-text">框览</span>
    </div>

    <!-- Group list -->
    <div class="sidebar-groups">
      <SidebarGroup
        v-for="group in groupStore.sortedGroups"
        :key="group.id"
        :group="group"
      />
    </div>

    <!-- Footer -->
    <div class="sidebar-footer">
      <button class="footer-btn" @click="handleAddView" title="添加视图">
        <Plus class="footer-icon" :size="18" />
        <span v-if="appStore.sidebarExpanded" class="footer-label">添加视图</span>
      </button>
      <button class="footer-btn" @click="handleAddGroup" title="新建分组">
        <FolderPlus class="footer-icon" :size="18" />
        <span v-if="appStore.sidebarExpanded" class="footer-label">新建分组</span>
      </button>
      <button class="footer-btn" @click="handleSettings" title="设置">
        <Settings class="footer-icon" :size="18" />
        <span v-if="appStore.sidebarExpanded" class="footer-label">设置</span>
      </button>
      <button class="footer-btn theme-btn" @click="toggleTheme" title="切换主题">
        <span class="theme-icon">{{ currentTheme === 'light' ? '🌙' : '☀️' }}</span>
        <span v-if="appStore.sidebarExpanded" class="footer-label">{{ currentTheme === 'light' ? '深色模式' : '浅色模式' }}</span>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: var(--sidebar-width-collapsed);
  height: 100vh;
  background: var(--color-bg-soft);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  transition: width 250ms var(--ease-bounce);
  overflow: hidden;
  flex-shrink: 0;
  position: relative;
  z-index: 10;
}

.sidebar.expanded {
  width: var(--sidebar-width-expanded);
}

/* Brand */
.sidebar-brand {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3);
  cursor: pointer;
  user-select: none;
  flex-shrink: 0;
  -webkit-app-region: drag;
}

.brand-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  background: var(--color-primary-light);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform 200ms var(--ease-bounce);
    -webkit-app-region: no-drag;
}

.brand-icon:hover {
  transform: scale(1.05);
}

.brand-logo {
  width: 24px;
  height: 24px;
  object-fit: contain;
  border-radius: 4px;
}

.brand-text {
  font-family: var(--font-display);
  font-size: var(--font-lg);
  font-weight: 700;
  color: var(--color-text-primary);
  white-space: nowrap;
}

/* Groups */
.sidebar-groups {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-2);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

/* Collapsed sidebar overrides */
.sidebar:not(.expanded) .sidebar-groups:deep(.group-header) {
  display: none;
}

.sidebar:not(.expanded) .sidebar-groups:deep(.group-views.collapsed) {
  padding-left: 0;
  align-items: center;
}

.sidebar:not(.expanded) .sidebar-groups:deep(.view-item) {
  justify-content: center;
  padding: var(--space-1) 0;
}

.sidebar:not(.expanded) .sidebar-groups:deep(.view-icon) {
  margin: 0;
}

/* Footer */
.sidebar-footer {
  border-top: 1px solid var(--color-border);
  padding: var(--space-2);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  flex-shrink: 0;
}

.footer-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2);
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--font-sm);
  transition: all 200ms ease-out;
  width: 100%;
}

.sidebar:not(.expanded) .footer-btn {
  justify-content: center;
}

.footer-btn:hover {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.footer-icon {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
}

.footer-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.theme-btn {
  font-size: 14px;
}

.theme-icon {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
</style>
