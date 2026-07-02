<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useViewStore } from '@renderer/stores/view'
import { useAppStore } from '@renderer/stores/app'
import { useGroupStore } from '@renderer/stores/group'
import { useToast } from '@renderer/composables/useToast'

const viewStore = useViewStore()
const appStore = useAppStore()
const groupStore = useGroupStore()
const { show: showToast } = useToast()

const dockVisible = ref(false)
const dockRendered = ref(false)
const shakingCardId = ref<string | null>(null)
const dockListRef = ref<HTMLElement | null>(null)
let hideTimer: ReturnType<typeof setTimeout> | null = null
let autoHideTimer: ReturnType<typeof setTimeout> | null = null
let scrollRAF: number | null = null

const anyDialogOpen = computed(() =>
  appStore.settingsOpen ||
  appStore.addViewDialogOpen ||
  appStore.addGroupDialogOpen ||
  appStore.externalLinkDialog.open ||
  appStore.editViewDialog.open
)

function showDock() {
  if (anyDialogOpen.value) return
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
  if (!dockVisible.value) {
    dockRendered.value = true
    requestAnimationFrame(() => {
      dockVisible.value = true
    })
    appStore.topDockOpen = true
    window.api.dock.panelVisible(true)
  }
}

function hideDock() {
  hideTimer = setTimeout(() => {
    dockVisible.value = false
    appStore.topDockOpen = false
    window.api.dock.panelVisible(false)
    // Wait for transition to finish before unmounting
    setTimeout(() => {
      if (!dockVisible.value) {
        dockRendered.value = false
      }
    }, 300)
  }, 1000)
}

function handleHoverEnter() {
  if (anyDialogOpen.value) return
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
  showDock()
}

function handleHoverLeave() {
  hideDock()
}

function handlePanelEnter() {
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
}

function handlePanelLeave() {
  hideDock()
}

async function handleCardClick(view: { id: string }) {
  if (viewStore.visibleViewCount >= 8) {
    shakingCardId.value = view.id
    setTimeout(() => { shakingCardId.value = null }, 500)
    showToast('最多只能保留8个常用视图，请先移除一个。')
    return
  }
  await viewStore.addViewToSidebar(view.id)
  viewStore.setActiveView(view.id)
  closeDock()
  const activeView = viewStore.activeView
  if (activeView) window.api.webview.create(activeView.id, activeView.url)
}

function closeDock() {
  dockVisible.value = false
  appStore.topDockOpen = false
  window.api.dock.panelVisible(false)
  if (hideTimer) { clearTimeout(hideTimer); hideTimer = null }
  if (autoHideTimer) { clearTimeout(autoHideTimer); autoHideTimer = null }
  setTimeout(() => {
    if (!dockVisible.value) {
      dockRendered.value = false
    }
  }, 300)
}

function showDockTemporarily(duration = 2000) {
  showDock()
  autoHideTimer = setTimeout(() => {
    hideDock()
    autoHideTimer = null
  }, duration)
}

// Listen for dock hover events from main process
onMounted(() => {
  window.api.dock.onHoverEnter(() => {
    handleHoverEnter()
  })
  window.api.dock.onHoverLeave(() => {
    if (dockVisible.value) {
      handleHoverLeave()
    }
  })
})

// Watch for hint from AddViewDialog
watch(() => appStore.showDockHint, (val) => {
  if (val) {
    appStore.showDockHint = false
    showDockTemporarily(2000)
  }
})

function getViewInitials(name: string) {
  return name.slice(0, 2).toUpperCase()
}

function getGroupName(groupId: string) {
  return groupStore.groups.find(g => g.id === groupId)?.name ?? ''
}

function getTooltip(view: { group_id: string; name: string }) {
  const groupName = getGroupName(view.group_id)
  return groupName ? `${groupName} - ${view.name}` : view.name
}

function handleListMouseMove(e: MouseEvent) {
  const list = dockListRef.value
  if (!list) return
  const rect = list.getBoundingClientRect()
  const x = e.clientX - rect.left
  const threshold = 60
  const speed = 6

  if (scrollRAF !== null) {
    cancelAnimationFrame(scrollRAF)
    scrollRAF = null
  }

  if (x > rect.width - threshold) {
    const intensity = (x - (rect.width - threshold)) / threshold
    const doScroll = () => {
      list.scrollLeft += speed * intensity
      scrollRAF = requestAnimationFrame(doScroll)
    }
    scrollRAF = requestAnimationFrame(doScroll)
  } else if (x < threshold) {
    const intensity = (threshold - x) / threshold
    const doScroll = () => {
      list.scrollLeft -= speed * intensity
      scrollRAF = requestAnimationFrame(doScroll)
    }
    scrollRAF = requestAnimationFrame(doScroll)
  }
}

function handleListMouseLeave() {
  if (scrollRAF !== null) {
    cancelAnimationFrame(scrollRAF)
    scrollRAF = null
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="dockRendered"
      class="dock-panel"
      :class="{ 'dock-visible': dockVisible, 'sidebar-expanded': appStore.sidebarExpanded }"
      @mouseenter="handlePanelEnter"
      @mouseleave="handlePanelLeave"
    >
      <div v-if="viewStore.allViewsForDock.length === 0" class="dock-empty">
        还没有添加任何视图
      </div>
      <div v-else class="dock-list" ref="dockListRef" @mousemove="handleListMouseMove" @mouseleave="handleListMouseLeave">
        <div
          v-for="view in viewStore.allViewsForDock"
          :key="view.id"
          class="dock-card"
          :class="{
            shaking: shakingCardId === view.id
          }"
          :title="getTooltip(view)"
          @click="handleCardClick(view)"
        >
          <div class="dock-card-icon">
            <img v-if="view.icon" :src="view.icon" class="dock-icon-img" alt="" />
            <span v-else class="dock-icon-initials">{{ getViewInitials(view.name) }}</span>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.dock-panel {
  position: fixed;
  top: var(--topbar-height);
  left: var(--sidebar-width-collapsed);
  right: 0;
  padding: var(--space-2) var(--space-3);
  background: rgba(128, 128, 128, 0.25);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 150;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transform: translateY(-8px);
  pointer-events: none;
  transition: left 250ms cubic-bezier(0.34, 1.56, 0.64, 1),
              opacity 250ms ease-out,
              transform 250ms ease-out;
}

.dock-panel.sidebar-expanded {
  left: var(--sidebar-width-expanded);
}

.dock-panel.dock-visible {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.dock-empty {
  color: var(--color-text-placeholder);
  font-size: var(--font-sm);
}

.dock-list {
  display: flex;
  gap: var(--space-1);
  align-items: center;
  overflow-x: auto;
  scrollbar-width: none;
}

.dock-list::-webkit-scrollbar {
  display: none;
}

.dock-card {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 150ms ease;
  flex-shrink: 0;
  padding: 6px;
  position: relative;
}

.dock-card:hover {
  background: rgba(255, 255, 255, 0.2);
}

.dock-card.shaking {
  animation: shake 400ms ease;
}

.dock-card-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: transform 150ms ease;
  flex-shrink: 0;
}

.dock-card:hover .dock-card-icon {
  transform: scale(1.15);
}

.dock-icon-img {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.dock-icon-initials {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
}

.dock-card:hover .dock-icon-initials {
  background: rgba(255, 255, 255, 0.2);
}
</style>
