import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface ExternalLinkDialog {
  open: boolean
  url: string
  targetUrl: string
}

export interface EditViewDialog {
  open: boolean
  viewId: string | null
}

export const useAppStore = defineStore('app', () => {
  const sidebarExpanded = ref(false)
  const settingsOpen = ref(false)
  const addViewDialogOpen = ref(false)
  const addGroupDialogOpen = ref(false)
  const initialized = ref(false)
  const topDockOpen = ref(false)
  const showDockHint = ref(false)

  // External link confirmation dialog
  const externalLinkDialog = ref<ExternalLinkDialog>({
    open: false,
    url: '',
    targetUrl: ''
  })

  // Edit view dialog
  const editViewDialog = ref<EditViewDialog>({
    open: false,
    viewId: null
  })

  function toggleSidebar() {
    sidebarExpanded.value = !sidebarExpanded.value
  }

  function setInitialized() {
    initialized.value = true
  }

  function openExternalLinkDialog(url: string, targetUrl: string) {
    externalLinkDialog.value = { open: true, url, targetUrl }
  }

  function closeExternalLinkDialog() {
    externalLinkDialog.value.open = false
  }

  function openEditViewDialog(viewId: string) {
    editViewDialog.value = { open: true, viewId }
  }

  function closeEditViewDialog() {
    editViewDialog.value = { open: false, viewId: null }
  }

  return {
    sidebarExpanded,
    settingsOpen,
    addViewDialogOpen,
    addGroupDialogOpen,
    initialized,
    topDockOpen,
    showDockHint,
    externalLinkDialog,
    editViewDialog,
    toggleSidebar,
    setInitialized,
    openExternalLinkDialog,
    closeExternalLinkDialog,
    openEditViewDialog,
    closeEditViewDialog
  }
})
