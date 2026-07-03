<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useGroupStore } from '@renderer/stores/group'
import { useViewStore } from '@renderer/stores/view'
import { useAppStore } from '@renderer/stores/app'
import { X, ChevronDown, Sparkles } from 'lucide-vue-next'

const groupStore = useGroupStore()
const viewStore = useViewStore()
const appStore = useAppStore()

const name = ref('')
const url = ref('')
const icon = ref('')
const selectedGroupId = ref('')
const showGroupDropdown = ref(false)

interface RecommendedSite {
  name: string
  url: string
  tag: string
  favicon: string
}

function getFavicon(siteUrl: string): string {
  try {
    return `https://favicon.im/${new URL(siteUrl).hostname}`
  } catch {
    return ''
  }
}

const recommendedSites: RecommendedSite[] = [
  // 国内大模型
  { name: '智谱清言', url: 'https://chatglm.cn/detail', tag: '国内', favicon: getFavicon('https://chatglm.cn/detail') },
  { name: '通义千问', url: 'https://chat.qwen.ai', tag: '国内', favicon: getFavicon('https://chat.qwen.ai') },
  { name: '文心一言', url: 'https://chat.baidu.com', tag: '国内', favicon: getFavicon('https://chat.baidu.com') },
  { name: '腾讯混元', url: 'https://hunyuan.tencent.com/chat', tag: '国内', favicon: getFavicon('https://hunyuan.tencent.com/chat') },
  { name: '讯飞星火', url: 'https://xinghuo.xfyun.cn/chat', tag: '国内', favicon: getFavicon('https://xinghuo.xfyun.cn/chat') },
  { name: 'DeepSeek', url: 'https://chat.deepseek.com', tag: '国内', favicon: getFavicon('https://chat.deepseek.com') },
  { name: 'Kimi', url: 'https://kimi.moonshot.cn', tag: '国内', favicon: getFavicon('https://kimi.moonshot.cn') },
  { name: '豆包', url: 'https://www.doubao.com/chat', tag: '国内', favicon: getFavicon('https://www.doubao.com/chat') },
  // 国外大模型
  { name: 'ChatGPT', url: 'https://chatgpt.com', tag: '国外', favicon: getFavicon('https://chatgpt.com') },
  { name: 'Claude', url: 'https://claude.ai', tag: '国外', favicon: getFavicon('https://claude.ai') },
  { name: 'Gemini', url: 'https://gemini.google.com', tag: '国外', favicon: getFavicon('https://gemini.google.com') },
  { name: 'Grok', url: 'https://grok.x.ai', tag: '国外', favicon: getFavicon('https://grok.x.ai') },
  { name: 'Mistral', url: 'https://chat.mistral.ai', tag: '国外', favicon: getFavicon('https://chat.mistral.ai') },
  { name: 'Perplexity AI', url: 'https://www.perplexity.ai', tag: '国外', favicon: getFavicon('https://www.perplexity.ai') },
]

const isOpen = computed(() => appStore.addViewDialogOpen)

const selectedGroup = computed(() =>
  groupStore.groups.find(g => g.id === selectedGroupId.value)
)

// Auto-select group and apply prefill when dialog opens
watch(() => appStore.addViewDialogOpen, (open) => {
  if (open) {
    const prefill = appStore.addViewPrefillData
    if (prefill) {
      name.value = prefill.name
      url.value = prefill.url
      icon.value = prefill.icon
      // Try to match group by name
      if (prefill.groupName) {
        const match = groupStore.groups.find(g => g.name === prefill.groupName)
        if (match) selectedGroupId.value = match.id
      }
    }
    if (appStore.addViewDialogGroupId) {
      selectedGroupId.value = appStore.addViewDialogGroupId
    } else if (!selectedGroupId.value) {
      selectedGroupId.value = groupStore.defaultGroup?.id ?? ''
    }
  }
})

// Auto-fetch favicon when URL changes
watch(url, async (newUrl) => {
  if (!newUrl.trim()) return
  const favicon = await fetchFavicon(newUrl)
  if (favicon) {
    icon.value = favicon
  }
})

async function fetchFavicon(siteUrl: string): Promise<string | null> {
  try {
    const urlObj = new URL(siteUrl)
    return `https://favicon.im/${urlObj.hostname}`
  } catch {
    return null
  }
}

function selectRecommended(site: RecommendedSite) {
  name.value = site.name
  url.value = site.url
  icon.value = ''
}

function close() {
  appStore.addViewDialogOpen = false
  appStore.addViewDialogGroupId = null
  appStore.addViewPrefillData = null
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

  const groupId = selectedGroupId.value || groupStore.defaultGroup?.id
  if (!groupId) return

  await viewStore.createView({
    group_id: groupId,
    name: name.value.trim(),
    url: url.value.trim(),
    icon: icon.value,
    visible: 0,
    sort_order: viewStore.views.filter(v => v.group_id === groupId).length,
    bounds: '{}'
  })

  // Show dock hint so user sees the new view in the top dock
  appStore.showDockHint = true

  close()
}
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="dialog-overlay" @click.self="close">
      <div class="dialog-container">
        <div class="dialog-header">
          <h3 class="dialog-title">添加视图</h3>
          <button class="dialog-close" @click="close">
            <X :size="18" />
          </button>
        </div>

        <div class="dialog-body">
          <!-- Recommended sites -->
          <div class="form-field">
            <label class="form-label"><Sparkles :size="14" style="vertical-align: -2px" /> 推荐站点</label>
            <div class="recommended-grid">
              <button
                v-for="site in recommendedSites"
                :key="site.url"
                class="recommend-card"
                :class="{ active: url === site.url }"
                @click="selectRecommended(site)"
              >
                <img class="recommend-favicon" :src="site.favicon" alt="" />
                <span class="recommend-name">{{ site.name }}</span>
                <span class="recommend-tag" :class="site.tag === '国内' ? 'tag-domestic' : 'tag-overseas'">{{ site.tag }}</span>
              </button>
            </div>
          </div>

          <!-- Group select -->
          <div class="form-field">
            <label class="form-label">选择分组</label>
            <div class="group-select" @click="showGroupDropdown = !showGroupDropdown">
              <div class="group-select-trigger">
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

          <!-- Icon preview -->
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
            <p class="form-hint">填写地址后会自动获取网站图标</p>
          </div>
        </div>

        <div class="dialog-footer">
          <button class="btn btn-ghost" @click="close">取消</button>
          <button class="btn btn-primary" @click="handleSubmit">添加</button>
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
  z-index: 150;
  animation: fade-in 200ms ease-out;
}

.dialog-container {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  width: 580px;
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

/* Recommended sites */
.recommended-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: var(--space-2);
}

.recommend-card {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-soft);
  cursor: pointer;
  transition: all 150ms ease;
  text-align: left;
}

.recommend-card:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.recommend-card.active {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
  box-shadow: 0 0 0 2px var(--color-primary-light);
}

.recommend-favicon {
  width: 16px;
  height: 16px;
  border-radius: 3px;
  flex-shrink: 0;
  object-fit: contain;
}

.recommend-name {
  font-size: var(--font-xs);
  font-weight: 500;
  color: var(--color-text-primary);
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.recommend-tag {
  font-size: 10px;
  padding: 1px 4px;
  border-radius: var(--radius-full);
  flex-shrink: 0;
  font-weight: 500;
  line-height: 1.2;
}

.tag-domestic {
  background: rgba(126, 220, 197, 0.15);
  color: #4db8a0;
}

.tag-overseas {
  background: rgba(184, 169, 255, 0.15);
  color: #9b8ee0;
}
</style>
