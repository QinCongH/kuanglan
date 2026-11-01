import { existsSync } from 'fs'
import { app, BrowserWindow, globalShortcut, ipcMain, shell } from 'electron'
import { join } from 'path'
import { initDataDir, loadData, getResourcePath, setResourcePath } from './database'
import { registerIpcHandlers } from './ipc'
import {
  setMainWindow,
  registerWebViewIpc,
  resizeAllViews,
  getActiveWebView,
  setDockVisible
} from './webview-manager'
import { showResourcePathSetup } from './resource-path-setup'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1500,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      devTools: true
    }
  })

  // Set main window reference for webview manager
  setMainWindow(mainWindow)

  mainWindow.on('ready-to-show', () => {
    mainWindow!.show()
    const data = loadData()
    mainWindow!.webContents.send('db:init', data)
  })

  // Handle new window requests - open in current view instead of external browser
  mainWindow.webContents.setWindowOpenHandler((details) => {
    mainWindow!.webContents.send('navigate:url', details.url)
    return { action: 'deny' }
  })

  // Ctrl+Tab: toggle focus between renderer and WebContentsView
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown' && input.control && input.key === 'Tab') {
      event.preventDefault()
      const activeView = getActiveWebView()
      if (activeView) {
        activeView.webContents.focus()
      }
    }
  })

  // Handle navigation within main window
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url !== mainWindow!.webContents.getURL()) {
      event.preventDefault()
      mainWindow!.webContents.send('navigate:url', url)
    }
  })

  // Resize webviews when window resizes
  mainWindow.on('resize', () => {
    resizeAllViews()
  })

  // When the window is minimized, notify the renderer so the quick card dock
  // (.dock-list) hides by default instead of staying open after restoring.
  mainWindow.on('minimize', () => {
    mainWindow?.webContents.send('window:minimized')
  })

  // When the window is restored, also hide the dock panel.
  mainWindow.on('restore', () => {
    mainWindow?.webContents.send('window:restored')
  })

  // Register window control IPC handlers
  ipcMain.handle('window:minimize', () => {
    mainWindow?.minimize()
  })
  ipcMain.handle('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow?.unmaximize()
    } else {
      mainWindow?.maximize()
    }
  })
  ipcMain.handle('window:close', () => {
    mainWindow?.close()
  })
  ipcMain.handle('window:is-maximized', () => {
    return mainWindow?.isMaximized() ?? false
  })

  // Register external link handler
  ipcMain.handle('shell:open-external', (_event, url: string) => {
    shell.openExternal(url)
  })

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// Single instance lock: prevent a second instance from opening (e.g. when the
// user launches the app again from another Windows virtual desktop or clicks
// the shortcut while it is already running). The second launch instead focuses
// the existing window.
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    // Someone tried to run a second instance — focus the existing window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      if (!mainWindow.isVisible()) mainWindow.show()
      mainWindow.focus()
    }
  })

  app.whenReady().then(async () => {
    // Set app user model id for windows
    if (process.platform === 'win32') {
      app.setAppUserModelId('com.kuang-lan')
    }

    // Initialize in order
    initDataDir()

    // Check resource path configuration
    const resourcePath = getResourcePath()
    if (!resourcePath || !existsSync(resourcePath)) {
      const selectedPath = await showResourcePathSetup()
      if (!selectedPath) {
        app.quit()
        return
      }
      setResourcePath(selectedPath)
      // Re-initialize data dir to point to the newly configured path
      initDataDir()
    }

    registerIpcHandlers()
    registerWebViewIpc()
    createWindow()

    // Register global shortcuts for view switching (works regardless of focus)
    globalShortcut.register('Ctrl+Up', () => {
      mainWindow?.webContents.send('keyboard:arrow', 'ArrowUp')
    })
    globalShortcut.register('Ctrl+Down', () => {
      mainWindow?.webContents.send('keyboard:arrow', 'ArrowDown')
    })
    // Alt+Z: show dock panel; Alt+X: hide dock panel
    globalShortcut.register('Alt+Z', () => {
      mainWindow?.webContents.send('dock:toggle', true)
    })
    globalShortcut.register('Alt+X', () => {
      mainWindow?.webContents.send('dock:toggle', false)
    })

    // Renderer notifies when dock panel is shown/hidden so webviews can shift down
    ipcMain.on('dock:panel-visible', (_e, visible: boolean) => {
      setDockVisible(visible)
    })

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })

  app.on('window-all-closed', () => {
    globalShortcut.unregisterAll()
    if (process.platform !== 'darwin') app.quit()
  })
}
