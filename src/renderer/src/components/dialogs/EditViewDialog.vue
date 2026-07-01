<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useGroupStore } from '@renderer/stores/group'
import { useViewStore } from '@renderer/stores/view'
import { useAppStore } from '@renderer/stores/app'
import { X, ChevronDown, Pencil } from 'lucide-vue-next'

const groupStore = useGroupStore()
const viewStore = useViewStore()
const appStore = useAppStore()

const name = ref('')
const url = ref('')
const icon = ref('')
const selectedGroupId = ref('')
const showGroupDropdown = ref(false)

const isOpen = computed(() => appStore.editViewDialog.open)
const editingViewId = computed(() => appStore.editViewDialog.viewId)

const editingView = computed(() =>
  editingViewId.value ? viewStore.views.find(v => v.id === editingViewId.value) : null
)

const selectedGroup = computed(() =>
  groupStore.groups.find(g => g.id === selectedGroupId.value)
)

watch(isOpen, (open) => {
  if (open && editingView.value) {
    name.value = editingView.value.name
    url.value = editingView.value.url
    icon.value = editingView.value.icon || ''
    selectedGroupId.value = editingView.value.group_id
  }
})

watch(url, async (newUrl) => {
  if (!newUrl.trim()) return
  // Try to fetch favicon automatically
  const favicon = await fetchFavicon(newUrl)
  if (favicon && !icon.value) {
    icon.value = favicon
  }
})

async function fetchFavicon(url: string): Promise<string | null> {
  try {
    const urlObj = new URL(url)
    // Use favicon.im service
    return `https://favicon.im/${urlObj.hostname}`
  } catch {
    return null
  }
}

function close() {
  appStore.closeEditViewDialog()
  name.value = ''
  url.value = ''
  icon.value = ''
  selectedGroupId.value = ''
  showGroupDropdown.value = false
}

function selectGroup(groupId: string) {
  selectedGroupId.value = groupId
  showGroupDropdown.value = false
}

async function handleSubmit() {
  if (!name.value.trim() || !url.value.trim()) return
  if (!editingViewId.value) return

  await viewStore.updateView(editingViewId.value, {
    name: name.value.trim(),
    url: url.value.trim(),
    icon: icon.value,
    group_id: selectedGroupId.value || editingView.value?.group_id
  })

  close()
}
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="dialog-overlay" @click.self="close">
      <div class="dialog-container">
        <!-- Decorative line -->
        <div class="dialog-accent" :style="{ backgroundColor: selectedGroup?.color || 'var(--color-primary)' }"></div>

        <div class="dialog-header">
          <h3 class="dialog-title">
            <Pencil :size="16" />
            编辑视图
          </h3>
          <button class="dialog-close" @click="close">
            <X :size="18" />
          </button>
        </div>

        <div class="dialog-body">
          <!-- Group select -->
          <div class="form-field">
            <label class="form-label">选择分组</label>
            <div class="group-select" @click="showGroupDropdown = !showGroupDropdown">
              <div class="group-select-trigger">
                <span
                  v-if="selectedGroup"
                  class="group-select-dot"
                  :style="{ backgroundColor: selectedGroup.color }"
                ></span>
                <span class="group-select-name">{{ selectedGroup?.name || '选择分组' }}</span>
                <ChevronDown :size="14" class="group-select-arrow" :class="{ open: showGroupDropdown }" />
              </div>
              <div v-if="showGroupDropdown" class="group-select-dropdown">
                <div
                  v-for="group in groupStore.groups"
                  :key="group.id"
                  class="group-select-option"
                  @click.stop="selectGroup(group.id)"
                >
                  <span class="group-select-dot" :style="{ backgroundColor: group.color }"></span>
                  <span>{{ group.name }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Name -->
          <div class="form-field">
            <label class="form-label">视图名称</label>
            <input
              v-model="name"
              type="text"
              placeholder="例如：ChatGPT"
              class="form-input"
            />
          </div>

          <!-- URL -->
          <div class="form-field">
            <label class="form-label">视图地址</label>
            <input
              v-model="url"
              type="url"
              placeholder="https://example.com"
              class="form-input form-input-mono"
            />
          </div>

          <!-- Icon -->
          <div class="form-field">
            <label class="form-label">图标</label>
            <div class="icon-field">
              <div v-if="icon" class="icon-preview">
                <img :src="icon" alt="icon" />
              </div>
              <div v-else class="icon-preview empty">
                <span>?</span>
              </div>
              <input
                v-model="icon"
                type="text"
                placeholder="自动获取或手动输入图标URL"
                class="form-input form-input-mono"
              />
            </div>
            <p class="form-hint">填写地址后会自动尝试获取网站图标</p>
          </div>
        </div>

        <div class="dialog-footer">
          <button class="btn btn-ghost" @click="close">取消</button>
          <button class="btn btn-primary" @click="handleSubmit">保存</button>
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
  z-index: 100;
  animation: fade-in 200ms ease-out;
}

.dialog-container {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  width: 400px;
  max-width: 90vw;
  max-height: 90vh;
  overflow: hidden;
  position: relative;
  box-shadow: var(--shadow-lg);
  animation: bounce 300ms var(--ease-bounce);
}

.dialog-accent {
  height: 4px;
  width: 100%;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border);
}

.dialog-title {
  font-size: var(--font-md);
  font-weight: 600;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin: 0;
}

.dialog-close {
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

.dialog-close:hover {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.dialog-body {
  padding: var(--space-3) var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  max-height: 60vh;
  overflow-y: auto;
}

.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border-top: 1px solid var(--color-border);
}

/* Form fields */
.form-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.form-label {
  font-size: var(--font-sm);
  font-weight: 500;
  color: var(--color-text-secondary);
}

.form-input {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-soft);
  color: var(--color-text-primary);
  font-size: var(--font-base);
  transition: all 200ms ease;
  outline: none;
}

.form-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.form-input-mono {
  font-family: var(--font-mono);
  font-size: var(--font-sm);
}

.form-hint {
  font-size: var(--font-xs);
  color: var(--color-text-placeholder);
  margin: 0;
}

/* Icon field */
.icon-field {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.icon-preview {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  background: var(--color-bg-soft);
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.icon-preview img {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.icon-preview.empty {
  color: var(--color-text-placeholder);
  font-size: var(--font-sm);
  font-weight: 600;
}

.icon-preview.empty span {
  line-height: 1;
}

/* Group select */
.group-select {
  position: relative;
}

.group-select-trigger {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-soft);
  cursor: pointer;
  transition: all 200ms ease;
}

.group-select-trigger:hover {
  border-color: var(--color-border-hover);
}

.group-select-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.group-select-name {
  flex: 1;
  font-size: var(--font-base);
  color: var(--color-text-primary);
}

.group-select-arrow {
  transition: transform 200ms var(--ease-bounce);
  color: var(--color-text-secondary);
}

.group-select-arrow.open {
  transform: rotate(180deg);
}

.group-select-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  z-index: 10;
  max-height: 200px;
  overflow-y: auto;
  animation: fade-in 150ms ease-out;
}

.group-select-option {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  cursor: pointer;
  transition: background-color 150ms ease;
}

.group-select-option:hover {
  background: var(--color-primary-light);
}

/* Buttons */
.btn {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-xl);
  font-size: var(--font-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all 200ms ease;
  border: none;
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
