import { ElectronAPI } from '@electron-toolkit/preload'

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

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      db: {
        init: (callback: (data: { groups: Group[]; views: View[] }) => void) => void
        group: {
          create: (data: CreateGroupData) => Promise<Group>
          update: (data: UpdateGroupData) => Promise<Group>
          delete: (id: string) => Promise<void>
          list: () => Promise<Group[]>
        }
        view: {
          create: (data: CreateViewData) => Promise<View>
          update: (data: UpdateViewData) => Promise<View>
          delete: (id: string) => Promise<void>
          listByGroup: (groupId: string) => Promise<View[]>
        }
        setting: {
          get: (key: string) => Promise<unknown>
          set: (key: string, value: unknown) => Promise<void>
        }
      }
      window: {
        minimize: () => Promise<void>
        maximize: () => Promise<void>
        close: () => Promise<void>
        isMaximized: () => Promise<boolean>
      }
      webview: {
        create: (viewId: string, url: string) => Promise<void>
        switch: (viewId: string) => Promise<void>
        reload: (viewId: string) => Promise<void>
        reloadActive: () => Promise<void>
        navigate: (viewId: string, url: string) => Promise<void>
        canGoBack: (viewId: string) => Promise<boolean>
        goBack: (viewId: string) => Promise<void>
        remove: (viewId: string) => Promise<void>
        clearCache: (viewId: string) => Promise<void>
        setSidebarWidth: (width: number) => Promise<void>
        hideAll: () => Promise<void>
      }
      navigate: {
        onUrl: (callback: (url: string) => void) => void
      }
      keyboard: {
        onArrow: (callback: (key: string) => void) => void
      }
      dock: {
        onHoverEnter: (callback: () => void) => void
        onHoverLeave: (callback: () => void) => void
        panelVisible: (visible: boolean) => void
      }
      shell: {
        openExternal: (url: string) => Promise<void>
      }
      theme: {
        getSystemTheme: () => Promise<string>
        onSystemThemeChange: (callback: (theme: string) => void) => void
      }
      setup: {
        submitPath: (path: string) => Promise<void>
        selectDir: () => Promise<string | null>
      }
      resourcePath: {
        get: () => Promise<string | null>
        set: (path: string) => Promise<void>
        open: () => Promise<void>
        select: () => Promise<string | null>
      }
    }
  }
}
