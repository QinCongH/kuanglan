import { BrowserWindow, ipcMain, WebContentsView } from 'electron'

const viewMap = new Map<string, WebContentsView>()

interface ProcessInfo {
  pid: number
  url: string
}

const processMap = new Map<string, ProcessInfo>()

let mainWindow: BrowserWindow | null = null
let currentSidebarWidth = 72
let activeViewId: string | null = null

export function setMainWindow(window: BrowserWindow) {
  mainWindow = window
}

export function setSidebarWidth(width: number) {
  currentSidebarWidth = width
}

export function createWebView(viewId: string, url: string): void {
  if (!mainWindow) return

  const existing = viewMap.get(viewId)
  if (existing) {
    showView(viewId)
    return
  }

  const wcView = new WebContentsView()
  wcView.webContents.loadURL(url)

  // Track renderer process
  const pid = wcView.webContents.getProcessId()
  processMap.set(viewId, { pid, url })

  // Auto-cleanup if renderer crashes or is killed
  wcView.webContents.on('render-process-gone', () => {
    processMap.delete(viewId)
    viewMap.delete(viewId)
    if (activeViewId === viewId) {
      activeViewId = null
    }
  })

  // Forward Ctrl+Tab from WebContentsView to focus renderer
  wcView.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown' && input.control && input.key === 'Tab') {
      event.preventDefault()
      mainWindow!.webContents.focus()
    }
  })

  updateViewBounds(wcView)
  wcView.setVisible(true)

  mainWindow.contentView.addChildView(wcView)
  viewMap.set(viewId, wcView)
  activeViewId = viewId
}

export function showView(viewId: string): void {
  if (!mainWindow) return

  for (const [id, view] of viewMap) {
    if (id === viewId) continue
    view.setVisible(false)
  }

  const targetView = viewMap.get(viewId)
  if (targetView) {
    mainWindow.contentView.removeChildView(targetView)
    mainWindow.contentView.addChildView(targetView)
    targetView.setVisible(true)
    updateViewBounds(targetView)
  }

  activeViewId = viewId
}

export function hideAllViews(): void {
  for (const view of viewMap.values()) {
    view.setVisible(false)
  }
}

export function cleanupAllViews(): void {
  for (const [viewId] of viewMap) {
    destroyView(viewId)
  }
  activeViewId = null
}

function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

function destroyView(viewId: string): void {
  const wcView = viewMap.get(viewId)
  const processInfo = processMap.get(viewId)

  if (wcView && mainWindow) {
    try {
      mainWindow.contentView.removeChildView(wcView)
    } catch {
      // Already removed
    }
    try {
      wcView.webContents.close()
    } catch {
      // Already destroyed
    }
    viewMap.delete(viewId)
    processMap.delete(viewId)

    // Verify process cleanup via PID
    if (processInfo) {
      const pid = processInfo.pid
      setTimeout(() => {
        if (isProcessAlive(pid)) {
          try {
            process.kill(pid)
          } catch {
            // Process already gone
          }
        }
      }, 500)
    }
  }

  if (activeViewId === viewId) {
    activeViewId = null
  }
}

export function removeView(viewId: string): void {
  destroyView(viewId)
}

export function forceCleanupView(viewId: string): void {
  const processInfo = processMap.get(viewId)

  // Force kill the renderer process by PID
  if (processInfo) {
    const pid = processInfo.pid
    if (isProcessAlive(pid)) {
      try {
        process.kill(pid)
      } catch {
        // Process already gone
      }
    }
    processMap.delete(viewId)
  }

  // Remove from viewMap if still present
  const wcView = viewMap.get(viewId)
  if (wcView && mainWindow) {
    try {
      mainWindow.contentView.removeChildView(wcView)
    } catch {
      // Already removed
    }
    try {
      wcView.webContents.close()
    } catch {
      // Already destroyed
    }
    viewMap.delete(viewId)
  }

  if (activeViewId === viewId) {
    activeViewId = null
  }
}

export function reloadView(viewId: string): void {
  const wcView = viewMap.get(viewId)
  if (wcView) {
    wcView.webContents.reload()
  }
}

export function reloadActiveView(): void {
  if (activeViewId) {
    reloadView(activeViewId)
  }
}

export function navigateView(viewId: string, url: string): void {
  const wcView = viewMap.get(viewId)
  if (wcView) {
    wcView.webContents.loadURL(url)
  }
}

export function canGoBack(viewId: string): boolean {
  const wcView = viewMap.get(viewId)
  return wcView ? wcView.webContents.canGoBack() : false
}

export function goBack(viewId: string): void {
  const wcView = viewMap.get(viewId)
  if (wcView) {
    wcView.webContents.goBack()
  }
}

let dockVisible = false
const DOCK_HEIGHT = 56

export function setDockVisible(visible: boolean): void {
  dockVisible = visible
  // Adjust active view bounds to make room for dock
  const activeView = activeViewId ? viewMap.get(activeViewId) : null
  if (activeView) {
    updateViewBounds(activeView)
  }
}

function updateViewBounds(wcView: WebContentsView) {
  if (!mainWindow) return
  const bounds = mainWindow.getBounds()
  const topbarHeight = 40
  const padding = 8
  const dockOffset = dockVisible ? DOCK_HEIGHT : 0

  wcView.setBounds({
    x: currentSidebarWidth + padding,
    y: topbarHeight + dockOffset + padding,
    width: bounds.width - currentSidebarWidth - padding * 2,
    height: bounds.height - topbarHeight - padding * 2
  })
}

export function resizeAllViews(): void {
  for (const wcView of viewMap.values()) {
    updateViewBounds(wcView)
  }
}

export function clearViewCache(viewId: string): void {
  const wcView = viewMap.get(viewId)
  if (wcView) {
    const session = wcView.webContents.session
    session.clearCache()
    session.clearStorageData({
      storages: ['cookies', 'localstorage', 'serviceworkers', 'websql', 'indexdb']
    })
  }
}

export function getActiveViewId(): string | null {
  return activeViewId
}

export function getActiveWebView(): WebContentsView | null {
  return activeViewId ? viewMap.get(activeViewId) ?? null : null
}

export function registerWebViewIpc(): void {
  ipcMain.handle('webview:create', (_e, viewId: string, url: string) => {
    createWebView(viewId, url)
  })

  ipcMain.handle('webview:switch', (_e, viewId: string) => {
    showView(viewId)
  })

  ipcMain.handle('webview:reload', (_e, viewId: string) => {
    reloadView(viewId)
  })

  ipcMain.handle('webview:reload-active', () => {
    reloadActiveView()
  })

  ipcMain.handle('webview:navigate', (_e, viewId: string, url: string) => {
    navigateView(viewId, url)
  })

  ipcMain.handle('webview:can-go-back', (_e, viewId: string) => {
    return canGoBack(viewId)
  })

  ipcMain.handle('webview:go-back', (_e, viewId: string) => {
    goBack(viewId)
  })

  ipcMain.handle('webview:remove', (_e, viewId: string) => {
    removeView(viewId)
  })

  ipcMain.handle('webview:force-cleanup', (_e, viewId: string) => {
    forceCleanupView(viewId)
  })

  ipcMain.handle('webview:clear-cache', (_e, viewId: string) => {
    clearViewCache(viewId)
  })

  ipcMain.handle('webview:set-sidebar-width', (_e, width: number) => {
    setSidebarWidth(width)
    resizeAllViews()
  })

  ipcMain.handle('webview:hide-all', () => {
    hideAllViews()
  })

  ipcMain.handle('webview:cleanup-all', () => {
    cleanupAllViews()
  })
}
