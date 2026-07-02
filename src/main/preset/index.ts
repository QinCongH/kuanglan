import { app } from 'electron'
import { join } from 'path'
import { readdirSync, readFileSync, existsSync } from 'fs'
import { createGroup, getAllGroups, createView } from '../database'
import type { PresetFile } from './types'

function isDevEnv(): boolean {
  try {
    return !app.isPackaged
  } catch {
    return process.env.NODE_ENV === 'development' || process.argv.includes('--dev')
  }
}

export function importPresets(): void {
  const isDev = isDevEnv()
  const presetsDir = isDev
    ? join(__dirname, '../../resources/presets')
    : join(process.resourcesPath, 'presets')

  if (!existsSync(presetsDir)) return

  const files = readdirSync(presetsDir).filter(f => f.endsWith('.json'))
  const existingGroups = getAllGroups()

  for (const file of files) {
    try {
      const content = readFileSync(join(presetsDir, file), 'utf-8')
      const preset: PresetFile = JSON.parse(content)

      if (!validatePreset(preset)) continue

      // Skip if group with same name already exists
      if (existingGroups.some(g => g.name === preset.group.name)) continue

      const group = createGroup({
        name: preset.group.name,
        icon: preset.group.icon,
        color: preset.group.color,
        sort_order: existingGroups.length + 1,
        collapsed: 0,
        is_default: 0
      })

      for (let i = 0; i < preset.views.length; i++) {
        const v = preset.views[i]
        createView({
          group_id: group.id,
          name: v.name,
          url: v.url,
          icon: v.icon,
          visible: 0,
          sort_order: i,
          bounds: '{}'
        })
      }
    } catch (err) {
      console.error(`Failed to import preset ${file}:`, err)
    }
  }
}

function validatePreset(preset: PresetFile): boolean {
  return (
    preset.version === 1 &&
    typeof preset.group?.name === 'string' &&
    Array.isArray(preset.views) &&
    preset.views.every(v => v.name && v.url)
  )
}
