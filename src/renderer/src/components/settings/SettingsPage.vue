<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useGroupStore } from '@renderer/stores/group'
import { useViewStore } from '@renderer/stores/view'
import { useAppStore } from '@renderer/stores/app'
import { useTheme } from '@renderer/composables/useTheme'
import { X, Trash2, Eye, EyeOff, Pencil, FolderOpen, RefreshCw } from 'lucide-vue-next'

const groupStore = useGroupStore()
const viewStore = useViewStore()
const appStore = useAppStore()
const { currentTheme, toggleTheme } = useTheme()

const isOpen = computed(() => appStore.settingsOpen)
const activeTab = ref<'views' | 'groups' | 'appearance' | 'resource'>('views')

const editingGroupId = ref<string | null>(null)
const editGroupName = ref('')

const resourcePath = ref<string | null>(null)

onMounted(async () => {
  resourcePath.value = await window.api.resourcePath.get()
})

function close() {
  appStore.settingsOpen = false
}

async function toggleViewVisibility(viewId: string) {
  const view = viewStore.views.find(v => v.id === viewId)
  if (view) {
    await viewStore.updateView(viewId, { visible: view.visible ? 0 : 1 })
  }
}

async function deleteView(viewId: string) {
  await viewStore.deleteView(viewId)
}

function openEditView(viewId: string) {
  appStore.openEditViewDialog(viewId)
}

function startEditGroup(group: { id: string; name: string }) {
  editingGroupId.value = group.id
  editGroupName.value = group.name
}

function cancelEditGroup() {
  editingGroupId.value = null
  editGroupName.value = ''
}

async function saveEditGroup(groupId: string) {
  if (!editGroupName.value.trim()) return
  await groupStore.updateGroup(groupId, {
    name: editGroupName.value.trim()
  })
  cancelEditGroup()
}

async function deleteGroup(groupId: string) {
  await groupStore.deleteGroup(groupId)
}

async function openResourceDir() {
  await window.api.resourcePath.open()
}

async function changeResourcePath() {
  const selectedPath = await window.api.resourcePath.select()
  if (!selectedPath) return
  if (selectedPath === resourcePath.value) return

  await window.api.resourcePath.set(selectedPath)
  window.location.reload()
}
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="settings-overlay" @click.self="close">
      <div class="settings-container">
        <div class="settings-header">
          <h2 class="settings-title">设置</h2>
          <button class="settings-close" @click="close">
            <X :size="20" />
          </button>
        </div>

        <div class="settings-body">
          <!-- Tabs -->
          <div class="settings-tabs">
            <button
              class="tab-btn"
              :class="{ active: activeTab === 'views' }"
              @click="activeTab = 'views'"
            >
              视图管理
            </button>
            <button
              class="tab-btn"
              :class="{ active: activeTab === 'groups' }"
              @click="activeTab = 'groups'"
            >
              分组管理
            </button>
            <button
              class="tab-btn"
              :class="{ active: activeTab === 'appearance' }"
              @click="activeTab = 'appearance'"
            >
              外观
            </button>
            <button
              class="tab-btn"
              :class="{ active: activeTab === 'resource' }"
              @click="activeTab = 'resource'"
            >
              资源路径
            </button>
          </div>

          <!-- Views Tab -->
          <div v-if="activeTab === 'views'" class="tab-content">
            <div v-if="viewStore.views.length === 0" class="empty-state">
              <p>还没有添加任何视图</p>
            </div>
            <div v-else class="view-list">
              <div
                v-for="view in viewStore.views"
                :key="view.id"
                class="view-card"
              >
                <div class="view-card-info">
                  <span class="view-card-name">{{ view.name }}</span>
                  <span class="view-card-url">{{ view.url }}</span>
                </div>
                <div class="view-card-actions">
                  <button
                    class="action-btn"
                    @click="openEditView(view.id)"
                    title="编辑"
                  >
                    <Pencil :size="16" />
                  </button>
                  <button
                    class="action-btn"
                    @click="toggleViewVisibility(view.id)"
                    :title="view.visible ? '隐藏' : '显示'"
                  >
                    <Eye v-if="view.visible" :size="16" />
                    <EyeOff v-else :size="16" />
                  </button>
                  <button
                    class="action-btn danger"
                    @click="deleteView(view.id)"
                    title="删除"
                  >
                    <Trash2 :size="16" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Groups Tab -->
          <div v-if="activeTab === 'groups'" class="tab-content">
            <div v-if="groupStore.groups.length === 0" class="empty-state">
              <p>还没有创建任何分组</p>
            </div>
            <div v-else class="group-list">
              <div
                v-for="group in groupStore.groups"
                :key="group.id"
                class="group-card"
              >
                <template v-if="editingGroupId === group.id">
                  <div class="group-edit-form">
                    <input
                      v-model="editGroupName"
                      type="text"
                      class="inline-input"
                      placeholder="分组名称"
                      @keyup.enter="saveEditGroup(group.id)"
                    />
                  </div>
                  <div class="group-card-actions">
                    <button class="action-btn" @click="saveEditGroup(group.id)" title="保存">
                      <span class="action-text">保存</span>
                    </button>
                    <button class="action-btn" @click="cancelEditGroup" title="取消">
                      <span class="action-text">取消</span>
                    </button>
                  </div>
                </template>
                <template v-else>
                  <div class="group-card-info">
                    <span class="group-card-name">{{ group.name }}</span>
                    <span v-if="group.is_default" class="group-card-badge">默认</span>
                  </div>
                  <div class="group-card-actions">
                    <button
                      class="action-btn"
                      @click="startEditGroup(group)"
                      title="编辑"
                    >
                      <Pencil :size="16" />
                    </button>
                    <button
                      v-if="!group.is_default"
                      class="action-btn danger"
                      @click="deleteGroup(group.id)"
                      title="删除"
                    >
                      <Trash2 :size="16" />
                    </button>
                  </div>
                </template>
              </div>
            </div>
          </div>

          <!-- Appearance Tab -->
          <div v-if="activeTab === 'appearance'" class="tab-content">
            <div class="appearance-section">
              <h3 class="section-title">主题</h3>
              <div class="theme-options">
                <button
                  class="theme-option"
                  :class="{ active: currentTheme === 'light' }"
                  @click="toggleTheme"
                >
                  <div class="theme-preview light-preview"></div>
                  <span>浅色模式</span>
                </button>
                <button
                  class="theme-option"
                  :class="{ active: currentTheme === 'dark' }"
                  @click="toggleTheme"
                >
                  <div class="theme-preview dark-preview"></div>
                  <span>深色模式</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Resource Path Tab -->
          <div v-if="activeTab === 'resource'" class="tab-content">
            <div class="resource-section">
              <h3 class="section-title">资源路径</h3>
              <p class="section-desc">资源文件存放的本地目录</p>
              <div class="resource-path-display">
                <span class="resource-path-text">{{ resourcePath || '未配置' }}</span>
              </div>
              <div class="resource-actions">
                <button class="resource-btn" @click="openResourceDir" :disabled="!resourcePath">
                  <FolderOpen :size="16" />
                  <span>打开目录</span>
                </button>
                <button class="resource-btn" @click="changeResourcePath">
                  <RefreshCw :size="16" />
                  <span>修改目录</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.settings-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  animation: fade-in 200ms ease-out;
}

.settings-container {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  width: 560px;
  max-width: 90vw;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-lg);
  animation: bounce 300ms var(--ease-bounce);
}

.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.settings-title {
  font-size: var(--font-md);
  font-weight: 600;
  color: var(--color-text-primary);
}

.settings-close {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  transition: all 150ms ease;
}

.settings-close:hover {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.settings-body {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.settings-tabs {
  display: flex;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-4);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.tab-btn {
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  font-size: var(--font-sm);
  font-weight: 500;
  color: var(--color-text-secondary);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 200ms ease;
}

.tab-btn:hover {
  background: var(--color-bg-soft);
  color: var(--color-text-primary);
}

.tab-btn.active {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.tab-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-3) var(--space-4);
}

.empty-state {
  text-align: center;
  padding: var(--space-5);
  color: var(--color-text-placeholder);
}

/* View list */
.view-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.view-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3);
  background: var(--color-bg-soft);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  transition: all 200ms ease;
}

.view-card:hover {
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}

.view-card-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  flex: 1;
  min-width: 0;
}

.view-card-name {
  font-size: var(--font-base);
  font-weight: 500;
  color: var(--color-text-primary);
}

.view-card-url {
  font-size: var(--font-xs);
  font-family: var(--font-mono);
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.view-card-actions {
  display: flex;
  gap: var(--space-1);
  flex-shrink: 0;
}

/* Group list */
.group-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.group-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3);
  background: var(--color-bg-soft);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  transition: all 200ms ease;
}

.group-card:hover {
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}

.group-card-info {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex: 1;
  min-width: 0;
}

.group-card-name {
  font-size: var(--font-base);
  font-weight: 500;
  color: var(--color-text-primary);
}

.group-card-badge {
  font-size: var(--font-xs);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.group-card-actions {
  display: flex;
  gap: var(--space-1);
  flex-shrink: 0;
}

.group-edit-form {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex: 1;
  min-width: 0;
}

.inline-input {
  padding: var(--space-1) var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg-base);
  color: var(--color-text-primary);
  font-size: var(--font-sm);
  outline: none;
  flex: 1;
  min-width: 0;
}

.inline-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-light);
}

.action-text {
  font-size: var(--font-xs);
  font-weight: 500;
}

/* Action buttons */
.action-btn {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 150ms ease;
}

.action-btn:hover {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.action-btn.danger:hover {
  background: rgba(255, 107, 138, 0.1);
  color: var(--color-danger);
}

/* Appearance */
.appearance-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.section-title {
  font-size: var(--font-sm);
  font-weight: 600;
  color: var(--color-text-secondary);
}

.theme-options {
  display: flex;
  gap: var(--space-3);
}

.theme-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  border: 2px solid var(--color-border);
  background: transparent;
  cursor: pointer;
  transition: all 200ms ease;
  flex: 1;
}

.theme-option:hover {
  border-color: var(--color-border-hover);
}

.theme-option.active {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.theme-preview {
  width: 80px;
  height: 60px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
}

.light-preview {
  background: #FFF8F6;
}

.dark-preview {
  background: #1E1A2E;
}

.theme-option span {
  font-size: var(--font-sm);
  color: var(--color-text-primary);
}

/* Resource path */
.resource-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.section-desc {
  font-size: var(--font-xs);
  color: var(--color-text-placeholder);
  margin: 0;
}

.resource-path-display {
  padding: var(--space-3);
  background: var(--color-bg-soft);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  min-height: 40px;
  display: flex;
  align-items: center;
}

.resource-path-text {
  font-size: var(--font-sm);
  font-family: var(--font-mono);
  color: var(--color-text-primary);
  word-break: break-all;
}

.resource-actions {
  display: flex;
  gap: var(--space-2);
}

.resource-btn {
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
}

.resource-btn:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-primary-light);
}

.resource-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
