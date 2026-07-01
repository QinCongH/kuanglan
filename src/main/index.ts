import { existsSync } from 'fs'
import { app, BrowserWindow, globalShortcut, ipcMain, shell } from 'electron'
import { join } from 'path'
import { initDataDir, loadData, getResourcePath, setResourcePath } from './database'
import { registerIpcHandlers } from './ipc'
import { setMainWindow, registerWebViewIpc, resizeAllViews, getActiveWebView } from './webview-manager'
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

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  globalShortcut.unregisterAll()
  if (process.platform !== 'darwin') app.quit()
})
