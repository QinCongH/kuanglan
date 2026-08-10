import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  // Database operations
  db: {
    init: (callback: (data: { groups: Group[]; views: View[] }) => void) => {
      ipcRenderer.on('db:init', (_e, data) => callback(data))
    },
    group: {
      create: (data: CreateGroupData) => ipcRenderer.invoke('db:group:create', data),
      update: (data: UpdateGroupData) => ipcRenderer.invoke('db:group:update', data),
      delete: (id: string) => ipcRenderer.invoke('db:group:delete', { id }),
      list: () => ipcRenderer.invoke('db:group:list')
    },
    view: {
      create: (data: CreateViewData) => ipcRenderer.invoke('db:view:create', data),
      update: (data: UpdateViewData) => ipcRenderer.invoke('db:view:update', data),
      delete: (id: string) => ipcRenderer.invoke('db:view:delete', { id }),
      listByGroup: (groupId: string) => ipcRenderer.invoke('db:view:list-by-group', { groupId })
    },
    setting: {
      get: (key: string) => ipcRenderer.invoke('db:setting:get', { key }),
      set: (key: string, value: unknown) => ipcRenderer.invoke('db:setting:set', { key, value })
    }
  },
  // Window controls
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:is-maximized'),
    onMinimized: (callback: () => void) => {
      ipcRenderer.on('window:minimized', () => callback())
    }
  },
  // WebView management
  webview: {
    create: (viewId: string, url: string) => ipcRenderer.invoke('webview:create', viewId, url),
    switch: (viewId: string) => ipcRenderer.invoke('webview:switch', viewId),
    reload: (viewId: string) => ipcRenderer.invoke('webview:reload', viewId),
    reloadActive: () => ipcRenderer.invoke('webview:reload-active'),
    navigate: (viewId: string, url: string) => ipcRenderer.invoke('webview:navigate', viewId, url),
    canGoBack: (viewId: string) => ipcRenderer.invoke('webview:can-go-back', viewId),
    goBack: (viewId: string) => ipcRenderer.invoke('webview:go-back', viewId),
    remove: (viewId: string) => ipcRenderer.invoke('webview:remove', viewId),
    forceCleanup: (viewId: string) => ipcRenderer.invoke('webview:force-cleanup', viewId),
    clearCache: (viewId: string) => ipcRenderer.invoke('webview:clear-cache', viewId),
    setSidebarWidth: (width: number) => ipcRenderer.invoke('webview:set-sidebar-width', width),
    hideAll: () => ipcRenderer.invoke('webview:hide-all'),
    cleanupAll: () => ipcRenderer.invoke('webview:cleanup-all')
  },
  // Navigation
  navigate: {
    onUrl: (callback: (url: string) => void) => {
      ipcRenderer.on('navigate:url', (_e, url: string) => callback(url))
    }
  },
  // Keyboard events forwarded from main process
  keyboard: {
    onArrow: (callback: (key: string) => void) => {
      ipcRenderer.on('keyboard:arrow', (_e, key: string) => callback(key))
    }
  },
  // Dock hover events from main process
  dock: {
    onHoverEnter: (callback: () => void) => {
      ipcRenderer.on('dock:hover-enter', () => callback())
    },
    onHoverLeave: (callback: () => void) => {
      ipcRenderer.on('dock:hover-leave', () => callback())
    },
    panelVisible: (visible: boolean) => {
      ipcRenderer.send('dock:panel-visible', visible)
    }
  },
  // External link
  shell: {
    openExternal: (url: string) => ipcRenderer.invoke('shell:open-external', url)
  },
  // Theme
  theme: {
    getSystemTheme: () => ipcRenderer.invoke('theme:get-system'),
    onSystemThemeChange: (callback: (theme: string) => void) => {
      ipcRenderer.on('theme:system-changed', (_e, theme) => callback(theme))
    }
  },
  // Setup window (resource path initial config)
  setup: {
    submitPath: (path: string) => ipcRenderer.invoke('setup:resource-path', path),
    selectDir: () => ipcRenderer.invoke('setup:select-dir')
  },
  // Resource path management
  resourcePath: {
    get: () => ipcRenderer.invoke('setting:resource-path:get'),
    set: (path: string) => ipcRenderer.invoke('setting:resource-path:set', path),
    open: () => ipcRenderer.invoke('setting:resource-path:open'),
    select: () => ipcRenderer.invoke('setting:resource-path:select'),
    reinitialize: () => ipcRenderer.invoke('setting:resource-path:reinitialize')
  },
  // Icon fetch (main process bypasses CORS)
  icon: {
    fetch: (url: string) => ipcRenderer.invoke('icon:fetch', url)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore
  window.electron = electronAPI
  // @ts-ignore
  window.api = api
}

interface Group {
  id: string
  name: string
  icon: string
  color: string
  sort_order: number
  collapsed: number
  is_default: number
  created_at: string
  updated_at: string
}

interface View {
  id: string
  group_id: string
  name: string
  url: string
  icon: string
  visible: number
  sort_order: number
  bounds: string
  created_at: string
  updated_at: string
}

interface CreateGroupData {
  name: string
  icon: string
  color: string
  sort_order: number
  collapsed?: number
  is_default?: number
}

interface UpdateGroupData {
  id: string
  name?: string
  icon?: string
  color?: string
  sort_order?: number
  collapsed?: number
}

interface CreateViewData {
  group_id: string
  name: string
  url: string
  icon?: string
  visible?: number
  sort_order: number
  bounds?: string
}

interface UpdateViewData {
  id: string
  group_id?: string
  name?: string
  url?: string
  icon?: string
  visible?: number
  sort_order?: number
  bounds?: string
}
