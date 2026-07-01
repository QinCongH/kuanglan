import { ipcMain } from 'electron'
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
  setSetting
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
}
