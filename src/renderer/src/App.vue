<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useTheme } from '@renderer/composables/useTheme'
import { cacheAllIcons } from '@renderer/composables/useIconCache'
import { useToast } from '@renderer/composables/useToast'
import { parseKlLink } from '@renderer/composables/useKlLink'
import { useGroupStore } from '@renderer/stores/group'
import { useViewStore } from '@renderer/stores/view'
import { useAppStore } from '@renderer/stores/app'
import AppSidebar from '@renderer/components/layout/AppSidebar.vue'
import WebViewBar from '@renderer/components/layout/WebViewBar.vue'
import ViewContainer from '@renderer/components/views/ViewContainer.vue'
import AddViewDialog from '@renderer/components/dialogs/AddViewDialog.vue'
import AddGroupDialog from '@renderer/components/dialogs/AddGroupDialog.vue'
import EditViewDialog from '@renderer/components/dialogs/EditViewDialog.vue'
import SettingsPage from '@renderer/components/settings/SettingsPage.vue'
import ResourcePathSetup from '@renderer/components/setup/ResourcePathSetup.vue'
import ToastNotification from '@renderer/components/common/ToastNotification.vue'
import TopViewDock from '@renderer/components/layout/TopViewDock.vue'
import ConfirmDialog from '@renderer/components/dialogs/ConfirmDialog.vue'
import ImportViewDialog from '@renderer/components/dialogs/ImportViewDialog.vue'

const { initTheme } = useTheme()
const groupStore = useGroupStore()
const viewStore = useViewStore()
const appStore = useAppStore()
const { show: showToast } = useToast()

const viewContainerRef = ref<InstanceType<typeof ViewContainer> | null>(null)
const isSetupWindow = window.location.hash === '#setup'

function getOrigin(url: string): string {
  try {
    return new URL(url).origin
  } catch {
    return ''
  }
}

let lastCheckedClipboard = ''

async function checkClipboardForView() {
  try {
    const text = await navigator.clipboard.readText()
    if (text === lastCheckedClipboard) return
    lastCheckedClipboard = text
    // Only auto-import valid kl:// quick links; plain URLs and malformed
    // share links are intercepted silently (no view is created).
    const result = parseKlLink(text)
    if (!result.ok || !result.data) return
    const prefill = result.data
    await navigator.clipboard.writeText('')
    lastCheckedClipboard = ''

    const groupId = groupStore.defaultGroup?.id
    if (!groupId) return

    await viewStore.createView({
      group_id: groupId,
      name: prefill.name,
      url: prefill.url,
      icon: prefill.icon,
      visible: 0,
      sort_order: viewStore.views.filter((v) => v.group_id === groupId).length,
      bounds: '{}'
    })

    appStore.showDockHint = true
    showToast('视图已添加到默认分组')
  } catch {
    // Clipboard access denied or unavailable
  }
}

onMounted(async () => {
  // Setup window doesn't need further initialization
  if (isSetupWindow) return

  // Listen for initial data from main process - only process once
  let initialized = false
  window.api.db.init((data) => {
    if (initialized) return
    initialized = true

    groupStore.setGroups(data.groups)
    viewStore.setViews(data.views)

    // Restore last active view
    const settings = (
      data as unknown as { groups: unknown[]; views: unknown[]; settings?: Record<string, unknown> }
    ).settings
    const savedActiveId = settings?.activeViewId as string | undefined
    if (savedActiveId && data.views.some((v) => (v as { id: string }).id === savedActiveId)) {
      viewStore.setActiveView(savedActiveId)
    } else if (data.views.length > 0) {
      viewStore.setActiveView((data.views[0] as { id: string }).id)
    }

    appStore.setInitialized()

    // Warm the icon cache for all existing views
    cacheAllIcons(data.views.map((v: { icon: string }) => v.icon))

    // Check clipboard for view import on initial load
    checkClipboardForView()
  })

  // Listen for navigation events from main process (e.g., new window requests)
  window.api.navigate.onUrl((url) => {
    const activeView = viewStore.activeView
    if (!activeView) return

    // Check if the URL is from the same domain as the current view
    const currentOrigin = getOrigin(activeView.url)
    const targetOrigin = getOrigin(url)

    console.log('Navigate URL:', url, 'current:', currentOrigin, 'target:', targetOrigin)

    if (currentOrigin !== targetOrigin) {
      // Different domain - show confirmation dialog
      console.log('Opening external link dialog')
      appStore.openExternalLinkDialog(activeView.url, url)
    } else {
      // Same domain - navigate within the webview
      window.api.webview.navigate(activeView.id, url)
    }
  })

  initTheme()

  // Check clipboard for view import when page becomes visible
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && appStore.initialized) {
      checkClipboardForView()
    }
  })

  // Keyboard navigation: switch views with arrow keys
  // Main process forwards arrow keys via IPC because WebContentsView steals keyboard focus
  window.api.keyboard.onArrow((key) => {
    if (
      appStore.settingsOpen ||
      appStore.addViewDialogOpen ||
      appStore.addGroupDialogOpen ||
      appStore.externalLinkDialog.open ||
      appStore.editViewDialog.open ||
      appStore.importViewDialog.open
    )
      return

    const visibleViews = viewStore.visibleViews
    if (visibleViews.length === 0) return

    const currentIndex = visibleViews.findIndex((v) => v.id === viewStore.activeViewId)
    if (currentIndex === -1) return

    if (key === 'ArrowDown') {
      const nextIndex = currentIndex < visibleViews.length - 1 ? currentIndex + 1 : 0
      viewStore.setActiveView(visibleViews[nextIndex].id)
    } else if (key === 'ArrowUp') {
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : visibleViews.length - 1
      viewStore.setActiveView(visibleViews[prevIndex].id)
    }
  })
})
</script>

<template>
  <ResourcePathSetup v-if="isSetupWindow" />
  <div v-else class="app-layout" :class="{ 'sidebar-expanded': appStore.sidebarExpanded }">
    <AppSidebar />
    <div class="main-area">
      <WebViewBar :view-container-ref="viewContainerRef" />
      <ViewContainer ref="viewContainerRef" />
    </div>
    <AddViewDialog />
    <AddGroupDialog />
    <SettingsPage />
    <ExternalLinkDialog />
    <EditViewDialog />
    <ToastNotification />
    <TopViewDock />
    <ConfirmDialog />
    <ImportViewDialog />
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  background: var(--color-bg-base);
  overflow: hidden;
}

.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}
</style>
