<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useGroupStore } from '@renderer/stores/group'
import { useViewStore } from '@renderer/stores/view'
import { useAppStore } from '@renderer/stores/app'
import { useTheme } from '@renderer/composables/useTheme'
import { useToast } from '@renderer/composables/useToast'
import { X, Trash2, Eye, EyeOff, Pencil, FolderOpen, RefreshCw, ChevronRight, ChevronDown, Search, Plus, Copy } from 'lucide-vue-next'

const groupStore = useGroupStore()
const viewStore = useViewStore()
const appStore = useAppStore()
const { currentTheme, toggleTheme } = useTheme()
const { show: showToast } = useToast()

const isOpen = computed(() => appStore.settingsOpen)
const activeTab = ref<'views' | 'groups' | 'appearance' | 'resource' | 'about'>('views')

const viewSearchQuery = ref('')
const groupSearchQuery = ref('')

const filteredViews = computed(() => {
  const views = viewStore.views
  if (!viewSearchQuery.value.trim()) return views
  const q = viewSearchQuery.value.trim().toLowerCase()
  return views.filter(v =>
    v.name.toLowerCase().includes(q) ||
    v.url.toLowerCase().includes(q) ||
    groupStore.groups.find(g => g.id === v.group_id)?.name.toLowerCase().includes(q)
  )
})

const filteredGroups = computed(() => {
  const groups = groupStore.groups
  if (!groupSearchQuery.value.trim()) return groups
  const q = groupSearchQuery.value.trim().toLowerCase()
  return groups.filter(g => g.name.toLowerCase().includes(q))
})

const editingGroupId = ref<string | null>(null)
const editGroupName = ref('')

const expandedGroupIds = ref<Set<string>>(new Set())

const resourcePath = ref<string | null>(null)
const policyDialogType = ref<'service' | 'privacy' | null>(null)

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

function deleteView(viewId: string) {
  const view = viewStore.views.find(v => v.id === viewId)
  appStore.openConfirmDialog(
    '删除视图',
    `确定要删除视图「${view?.name ?? ''}」吗？此操作不可恢复。`,
    '删除',
    () => viewStore.deleteView(viewId)
  )
}

function openEditView(viewId: string) {
  appStore.openEditViewDialog(viewId)
}

function copyView(viewId: string) {
  const view = viewStore.views.find(v => v.id === viewId)
  if (!view) return
  const group = groupStore.groups.find(g => g.id === view.group_id)
  const payload = {
    n: view.name,
    u: view.url,
    i: view.icon,
    g: group?.name ?? ''
  }
  const encoded = 'kl://' + btoa(new TextEncoder().encode(JSON.stringify(payload)).reduce((s, b) => s + String.fromCharCode(b), ''))
  navigator.clipboard.writeText(encoded)
  showToast('视图信息已复制到剪贴板')
}

function openAddView() {
  appStore.openAddViewDialog()
}

function openAddGroup() {
  appStore.addGroupDialogOpen = true
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

function deleteGroup(groupId: string) {
  const viewsInGroup = viewStore.getViewsByGroup(groupId)
  if (viewsInGroup.length > 0) {
    showToast('该分组下存在视图，请先清空或迁移视图后再删除分组。')
    return
  }
  const group = groupStore.groups.find(g => g.id === groupId)
  appStore.openConfirmDialog(
    '删除分组',
    `确定要删除分组「${group?.name ?? ''}」吗？`,
    '删除',
    () => groupStore.deleteGroup(groupId)
  )
}

function toggleGroupExpand(groupId: string) {
  if (expandedGroupIds.value.has(groupId)) {
    expandedGroupIds.value.delete(groupId)
  } else {
    expandedGroupIds.value.add(groupId)
  }
}

function isGroupExpanded(groupId: string): boolean {
  return expandedGroupIds.value.has(groupId)
}

async function openResourceDir() {
  await window.api.resourcePath.open()
}

async function changeResourcePath() {
  const selectedPath = await window.api.resourcePath.select()
  if (!selectedPath) return
  if (selectedPath === resourcePath.value) return

  await window.api.resourcePath.set(selectedPath)
  // Reinitialize main process data path and reload
  await window.api.resourcePath.reinitialize()
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
            <button
              class="tab-btn"
              :class="{ active: activeTab === 'about' }"
              @click="activeTab = 'about'"
            >
              关于
            </button>
          </div>

          <!-- Views Tab -->
          <div v-if="activeTab === 'views'" class="tab-content">
            <div class="tab-section">
              <div class="tab-search">
                <Search :size="14" class="tab-search-icon" />
                <input
                  v-model="viewSearchQuery"
                  type="text"
                  class="tab-search-input"
                  placeholder="搜索视图..."
                />
              </div>
              <div v-if="viewStore.views.length === 0" class="empty-state">
                <p>还没有添加任何视图</p>
              </div>
              <div v-else-if="filteredViews.length === 0" class="empty-state">
                <p>未找到匹配的视图</p>
              </div>
              <div v-else class="view-list">
                <div
                  v-for="view in filteredViews"
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
                      @click="copyView(view.id)"
                      title="复制"
                    >
                      <Copy :size="16" />
                    </button>
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
              <div class="resource-actions">
                <button class="resource-btn" @click="openAddView">
                  <Plus :size="16" />
                  <span>新增视图</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Groups Tab -->
          <div v-if="activeTab === 'groups'" class="tab-content">
            <div class="tab-section">
              <div class="tab-search">
                <Search :size="14" class="tab-search-icon" />
                <input
                  v-model="groupSearchQuery"
                  type="text"
                  class="tab-search-input"
                  placeholder="搜索分组..."
                />
              </div>
              <div v-if="groupStore.groups.length === 0" class="empty-state">
                <p>还没有创建任何分组</p>
              </div>
              <div v-else-if="filteredGroups.length === 0" class="empty-state">
                <p>未找到匹配的分组</p>
              </div>
              <div v-else class="group-list">
                <div
                  v-for="group in filteredGroups"
                  :key="group.id"
                  class="group-wrapper"
                >
                  <div class="group-card">
                    <button class="expand-btn" @click="toggleGroupExpand(group.id)">
                      <ChevronRight v-if="!isGroupExpanded(group.id)" :size="16" />
                      <ChevronDown v-else :size="16" />
                    </button>
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
                  <!-- Expanded views under group -->
                  <div v-if="isGroupExpanded(group.id)" class="group-views-list">
                    <div
                      v-for="view in viewStore.getViewsByGroup(group.id)"
                      :key="view.id"
                      class="group-view-item"
                    >
                      <span class="group-view-name">{{ view.name }}</span>
                      <span class="group-view-status" :class="{ visible: view.visible }">
                        {{ view.visible ? '侧边栏可见' : '隐藏' }}
                      </span>
                    </div>
                    <div v-if="viewStore.getViewsByGroup(group.id).length === 0" class="group-view-empty">
                      暂无视图
                    </div>
                  </div>
                </div>
              </div>
              <div class="resource-actions">
                <button class="resource-btn" @click="openAddGroup">
                  <Plus :size="16" />
                  <span>新增分组</span>
                </button>
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

          <!-- About Tab -->
          <div v-if="activeTab === 'about'" class="tab-content">
            <div class="about-section">
              <div class="about-logo">
                <img src="/icon.png" alt="框览" class="about-logo-img" />
              </div>
              <h2 class="about-name">框览</h2>
              <p class="about-version">版本 1.2.0</p>
              <p class="about-desc">多视图聚合浏览器</p>
              <div class="about-info-list">
                <div class="about-info-item">
                  <span class="about-info-label">应用名称</span>
                  <span class="about-info-value">框览 (KuangLan)</span>
                </div>
                <div class="about-info-item">
                  <span class="about-info-label">版本号</span>
                  <span class="about-info-value">1.2.0</span>
                </div>
                <div class="about-info-item">
                  <span class="about-info-label">运行环境</span>
                  <span class="about-info-value">Electron</span>
                </div>
              </div>
              <div class="about-policies">
                <button class="policy-link" @click="policyDialogType = 'service'">服务策略</button>
                <span class="policy-divider">|</span>
                <button class="policy-link" @click="policyDialogType = 'privacy'">隐私策略</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Policy Dialog -->
  <Teleport to="body">
    <div v-if="policyDialogType" class="policy-overlay" @click.self="policyDialogType = null">
      <div class="policy-container">
        <div class="policy-header">
          <h2 class="policy-title">{{ policyDialogType === 'service' ? '服务策略' : '隐私策略' }}</h2>
          <button class="settings-close" @click="policyDialogType = null">
            <X :size="20" />
          </button>
        </div>
        <div class="policy-body">
          <template v-if="policyDialogType === 'service'">
            <h3>服务条款</h3>
            <p>欢迎使用框览（KuangLan）多视图聚合浏览器。</p>
            <h4>1. 服务说明</h4>
            <p>框览是一款桌面端多视图聚合浏览器，旨在帮助用户在一个窗口内同时管理和浏览多个网页视图。本应用通过本地运行，不提供云端服务。</p>
            <h4>2. 使用规范</h4>
            <p>用户应遵守当地法律法规，不得利用本应用从事违法活动。用户对通过本应用访问的网页内容自行负责，本应用不对其内容承担任何责任。</p>
            <h4>3. 免责声明</h4>
            <p>本应用按"现状"提供，不作任何明示或暗示的保证。对于因使用本应用而产生的任何直接或间接损失，开发者不承担责任。</p>
            <h4>4. 变更通知</h4>
            <p>开发者保留随时修改本服务策略的权利，修改后的策略将在应用内公示。</p>
          </template>
          <template v-if="policyDialogType === 'privacy'">
            <h3>隐私策略</h3>
            <p>框览（KuangLan）重视您的隐私保护。</p>
            <h4>1. 数据收集</h4>
            <p>本应用所有数据均存储在用户本地设备上，不收集、上传或分享任何用户个人信息至远程服务器。</p>
            <h4>2. 数据存储</h4>
            <p>用户的视图配置、分组信息等数据保存在本地数据库中，数据路径由用户自行选择和管理。用户可随时通过应用设置修改或删除数据。</p>
            <h4>3. 网络访问</h4>
            <p>本应用仅用于加载用户指定的网页内容，不会在后台发起额外的网络请求或追踪用户行为。</p>
            <h4>4. 第三方服务</h4>
            <p>本应用不集成任何第三方分析、广告或追踪服务。</p>
            <h4>5. 变更通知</h4>
            <p>如本隐私策略发生变更，将在应用内公示通知用户。</p>
          </template>
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
  background: transparent;
  border: none;
  cursor: pointer;
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
  overflow: hidden;
  padding: var(--space-3) var(--space-4);
  display: flex;
  flex-direction: column;
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
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: var(--space-1);
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
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: var(--space-1);
}

.group-wrapper {
  display: flex;
  flex-direction: column;
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
  gap: var(--space-2);
}

.group-card:hover {
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}

.expand-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  background: transparent;
  border: none;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 150ms ease;
}

.expand-btn:hover {
  background: var(--color-primary-light);
  color: var(--color-primary);
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

/* Group views list (expanded) */
.group-views-list {
  padding: var(--space-1) var(--space-2) var(--space-2) 40px;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.group-view-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  font-size: var(--font-sm);
}

.group-view-item:hover {
  background: var(--color-bg-soft);
}

.group-view-name {
  color: var(--color-text-primary);
  font-weight: 500;
}

.group-view-status {
  font-size: var(--font-xs);
  color: var(--color-text-placeholder);
}

.group-view-status.visible {
  color: var(--color-success);
}

.group-view-empty {
  font-size: var(--font-xs);
  color: var(--color-text-placeholder);
  padding: var(--space-2);
  text-align: center;
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
  flex-shrink: 0;
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

/* Tab section */
.tab-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  flex: 1;
  min-height: 0;
}

.tab-search {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: 4px 10px;
  background: var(--color-bg-soft);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}

.tab-search-icon {
  color: var(--color-text-placeholder);
  flex-shrink: 0;
}

.tab-search-input {
  background: transparent;
  border: none;
  outline: none;
  color: var(--color-text-primary);
  font-size: var(--font-sm);
  width: 100%;
  min-width: 60px;
}

.tab-search-input::placeholder {
  color: var(--color-text-placeholder);
}

/* About section */
.about-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-4) 0;
}

.about-logo {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-lg);
  background: var(--color-primary-light);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-2);
  overflow: hidden;
}

.about-logo-img {
  width: 64px;
  height: 64px;
  object-fit: contain;
}

.about-name {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.about-version {
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
  margin: 0;
}

.about-desc {
  font-size: var(--font-sm);
  color: var(--color-text-placeholder);
  margin: 0;
}

.about-info-list {
  width: 100%;
  max-width: 320px;
  margin-top: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.about-info-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  background: var(--color-bg-soft);
}

.about-info-label {
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
}

.about-info-value {
  font-size: var(--font-sm);
  color: var(--color-text-primary);
  font-weight: 500;
}

.about-policies {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-3);
}

.policy-link {
  background: none;
  border: none;
  color: var(--color-primary);
  font-size: var(--font-sm);
  cursor: pointer;
  padding: 0;
  transition: opacity 150ms ease;
}

.policy-link:hover {
  opacity: 0.8;
}

.policy-divider {
  color: var(--color-text-placeholder);
  font-size: var(--font-sm);
}

/* Policy dialog */
.policy-overlay {
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

.policy-container {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  width: 480px;
  max-width: 90vw;
  max-height: 70vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-lg);
  animation: bounce 300ms var(--ease-bounce);
}

.policy-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.policy-title {
  font-size: var(--font-md);
  font-weight: 600;
  color: var(--color-text-primary);
}

.policy-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4);
  line-height: 1.7;
  color: var(--color-text-primary);
}

.policy-body h3 {
  font-size: var(--font-md);
  font-weight: 600;
  margin: 0 0 var(--space-3) 0;
  color: var(--color-text-primary);
}

.policy-body h4 {
  font-size: var(--font-sm);
  font-weight: 600;
  margin: var(--space-3) 0 var(--space-1) 0;
  color: var(--color-text-primary);
}

.policy-body p {
  font-size: var(--font-sm);
  margin: 0 0 var(--space-2) 0;
  color: var(--color-text-secondary);
}
</style>
