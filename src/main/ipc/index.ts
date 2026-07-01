import { ipcMain, dialog, shell, BrowserWindow } from 'electron'
import {
  createGroup,
  updateGroup,
  deleteGroup,
  getAllGroups,
  createView,
  updateView,
  deleteView,
  getViewsByGroup,
  getSetting,
  setSetting,
  getResourcePath,
  setResourcePath
} from '../database'

export function registerIpcHandlers(): void {
  // Group handlers
  ipcMain.handle('db:group:create', (_e, data) => createGroup(data))
  ipcMain.handle('db:group:update', (_e, data) => updateGroup(data.id, data))
  ipcMain.handle('db:group:delete', (_e, data) => { deleteGroup(data.id); return null })
  ipcMain.handle('db:group:list', () => getAllGroups())

  // View handlers
  ipcMain.handle('db:view:create', (_e, data) => createView(data))
  ipcMain.handle('db:view:update', (_e, data) => updateView(data.id, data))
  ipcMain.handle('db:view:delete', (_e, data) => { deleteView(data.id); return null })
  ipcMain.handle('db:view:list-by-group', (_e, data) => getViewsByGroup(data.groupId))

  // Setting handlers
  ipcMain.handle('db:setting:get', (_e, data) => getSetting(data.key))
  ipcMain.handle('db:setting:set', (_e, data) => { setSetting(data.key, data.value); return null })

  // Resource path handlers
  ipcMain.handle('setting:resource-path:get', () => getResourcePath())
  ipcMain.handle('setting:resource-path:set', (_e, path: string) => {
    setResourcePath(path)
  })
  ipcMain.handle('setting:resource-path:open', () => {
    const path = getResourcePath()
    if (path) shell.openPath(path)
  })
  ipcMain.handle('setting:resource-path:select', async () => {
    const focusedWindow = BrowserWindow.getFocusedWindow()
    if (!focusedWindow) return null
    const result = dialog.showOpenDialogSync(focusedWindow, {
      properties: ['openDirectory', 'createDirectory'],
      title: '选择资源目录'
    })
    return result?.[0] ?? null
  })
}
