import { BrowserWindow, ipcMain, dialog, app } from 'electron'
import { join } from 'path'

export function showResourcePathSetup(): Promise<string | null> {
  return new Promise((resolve) => {
    const setupWindow = new BrowserWindow({
      width: 520,
      height: 400,
      resizable: false,
      minimizable: false,
      maximizable: false,
      frame: false,
      show: false,
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        sandbox: false
      }
    })

    setupWindow.on('closed', () => {
      resolve(null)
    })

    ipcMain.handleOnce('setup:resource-path', (_e, path: string) => {
      resolve(path)
      setupWindow.close()
    })

    ipcMain.handleOnce('setup:select-dir', () => {
      const result = dialog.showOpenDialogSync(setupWindow, {
        properties: ['openDirectory', 'createDirectory'],
        title: '选择资源目录'
      })
      return result?.[0] ?? null
    })

    setupWindow.on('ready-to-show', () => {
      setupWindow.show()
    })

    const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

    if (isDev && process.env['ELECTRON_RENDERER_URL']) {
      setupWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#setup`)
    } else {
      setupWindow.loadFile(join(__dirname, '../renderer/index.html'), { hash: 'setup' })
    }
  })
}
