<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useGroupStore } from '@renderer/stores/group'
import { useViewStore } from '@renderer/stores/view'
import { useAppStore } from '@renderer/stores/app'
import { useTheme } from '@renderer/composables/useTheme'
import AppSidebar from '@renderer/components/layout/AppSidebar.vue'
import WebViewBar from '@renderer/components/layout/WebViewBar.vue'
import ViewContainer from '@renderer/components/views/ViewContainer.vue'
import AddViewDialog from '@renderer/components/dialogs/AddViewDialog.vue'
import AddGroupDialog from '@renderer/components/dialogs/AddGroupDialog.vue'
import EditViewDialog from '@renderer/components/dialogs/EditViewDialog.vue'
import SettingsPage from '@renderer/components/settings/SettingsPage.vue'

const { initTheme } = useTheme()
const groupStore = useGroupStore()
const viewStore = useViewStore()
const appStore = useAppStore()

const viewContainerRef = ref<InstanceType<typeof ViewContainer> | null>(null)

function getOrigin(url: string): string {
  try {
    return new URL(url).origin
  } catch {
    return ''
  }
}

onMounted(async () => {
  // Listen for initial data from main process - only process once
  let initialized = false
  window.api.db.init((data) => {
    if (initialized) return
    initialized = true

    groupStore.setGroups(data.groups)
    viewStore.setViews(data.views)

    // Restore last active view
    const settings = (data as unknown as { groups: unknown[]; views: unknown[]; settings?: Record<string, unknown> }).settings
    const savedActiveId = settings?.activeViewId as string | undefined
    if (savedActiveId && data.views.some((v) => (v as { id: string }).id === savedActiveId)) {
      viewStore.setActiveView(savedActiveId)
    } else if (data.views.length > 0) {
      viewStore.setActiveView((data.views[0] as { id: string }).id)
    }

    appStore.setInitialized()
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
})
</script>

<template>
  <div class="app-layout" :class="{ 'sidebar-expanded': appStore.sidebarExpanded }">
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
