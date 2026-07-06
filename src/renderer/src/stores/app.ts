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

export interface PrefillViewData {
  name: string
  url: string
  icon: string
  groupName: string
}

export interface ConfirmDialogState {
  open: boolean
  title: string
  message: string
  confirmText: string
  onConfirm: (() => void) | null
}

export interface ImportViewDialog {
  open: boolean
}

export const useAppStore = defineStore('app', () => {
  const sidebarExpanded = ref(false)
  const settingsOpen = ref(false)
  const addViewDialogOpen = ref(false)
  const addViewDialogGroupId = ref<string | null>(null)
  const addGroupDialogOpen = ref(false)
  const initialized = ref(false)
  const topDockOpen = ref(false)
  const showDockHint = ref(false)
  const dockSearchQuery = ref('')

  // Prefill data for AddViewDialog (from clipboard detection)
  const addViewPrefillData = ref<PrefillViewData | null>(null)

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

  // Confirm dialog
  const confirmDialog = ref<ConfirmDialogState>({
    open: false,
    title: '',
    message: '',
    confirmText: '确认',
    onConfirm: null
  })

  // Import view dialog
  const importViewDialog = ref<ImportViewDialog>({
    open: false
  })

  function toggleSidebar() {
    sidebarExpanded.value = !sidebarExpanded.value
  }

  function setInitialized() {
    initialized.value = true
  }

  function openAddViewDialog(groupId?: string, prefill?: PrefillViewData) {
    addViewDialogGroupId.value = groupId ?? null
    addViewPrefillData.value = prefill ?? null
    addViewDialogOpen.value = true
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

  function openConfirmDialog(title: string, message: string, confirmText: string, onConfirm: () => void) {
    confirmDialog.value = { open: true, title, message, confirmText, onConfirm }
  }

  function closeConfirmDialog() {
    confirmDialog.value.open = false
  }

  function openImportViewDialog() {
    importViewDialog.value = { open: true }
  }

  function closeImportViewDialog() {
    importViewDialog.value.open = false
  }

  return {
    sidebarExpanded,
    settingsOpen,
    addViewDialogOpen,
    addViewDialogGroupId,
    addGroupDialogOpen,
    initialized,
    topDockOpen,
    showDockHint,
    dockSearchQuery,
    addViewPrefillData,
    externalLinkDialog,
    editViewDialog,
    confirmDialog,
    importViewDialog,
    toggleSidebar,
    setInitialized,
    openAddViewDialog,
    openExternalLinkDialog,
    closeExternalLinkDialog,
    openEditViewDialog,
    closeEditViewDialog,
    openConfirmDialog,
    closeConfirmDialog,
    openImportViewDialog,
    closeImportViewDialog
  }
})
