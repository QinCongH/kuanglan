import { app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { v4 as uuidv4 } from 'uuid'

const DATA_DIR = 'app_data'
const DB_FILE = 'data.json'
const CONFIG_FILE = 'config.json'

let dataPath = ''
let dbPath = ''

// Config always lives in userData/app_data (needed before resourcePath is known)
const defaultConfigDir = () => join(app.getPath('userData'), DATA_DIR)
let defaultConfigPath = ''

export interface Group {
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

export interface View {
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

export interface AppData {
  groups: Group[]
  views: View[]
  version: number
}

export interface AppConfig {
  theme: string
  activeViewId: string | null
  sidebarExpanded: boolean
  windowBounds: { x: number; y: number; width: number; height: number } | null
  resourcePath: string | null
}

const DEFAULT_DATA: AppData = {
  groups: [],
  views: [],
  version: 1
}

const DEFAULT_CONFIG: AppConfig = {
  theme: 'auto',
  activeViewId: null,
  sidebarExpanded: false,
  windowBounds: null,
  resourcePath: null
}

function ensureDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
}

export function initDataDir(): void {
  // Config file always at userData/app_data/ (must be accessible before resourcePath is known)
  const cfgDir = defaultConfigDir()
  ensureDir(cfgDir)
  defaultConfigPath = join(cfgDir, CONFIG_FILE)

  const config = readConfig()
  if (config.resourcePath && existsSync(config.resourcePath)) {
    dataPath = config.resourcePath
  } else {
    dataPath = cfgDir
  }
  ensureDir(dataPath)
  dbPath = join(dataPath, DB_FILE)
}

export function getDataPath(): string {
  return dataPath
}

// Data file operations
function readData(): AppData {
  if (!existsSync(dbPath)) {
    return { ...DEFAULT_DATA }
  }
  try {
    const content = readFileSync(dbPath, 'utf-8')
    return { ...DEFAULT_DATA, ...JSON.parse(content) }
  } catch {
    return { ...DEFAULT_DATA }
  }
}

function writeData(data: AppData): void {
  writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8')
}

export function loadData(): { groups: Group[]; views: View[] } {
  const data = readData()
  // Ensure default group exists
  if (!data.groups.some(g => g.is_default === 1)) {
    const defaultGroup: Group = {
      id: uuidv4(),
      name: '默认分组',
      icon: '📁',
      color: '#FF8FA3',
      sort_order: 0,
      collapsed: 0,
      is_default: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    data.groups.unshift(defaultGroup)
    writeData(data)
  }
  return { groups: data.groups, views: data.views }
}

// Group CRUD
export function createGroup(data: Omit<Group, 'id' | 'created_at' | 'updated_at'>): Group {
  const appData = readData()
  const group: Group = {
    ...data,
    id: uuidv4(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  } as Group
  appData.groups.push(group)
  writeData(appData)
  return group
}

export function updateGroup(id: string, data: Partial<Group>): Group {
  const appData = readData()
  const idx = appData.groups.findIndex(g => g.id === id)
  if (idx === -1) throw new Error(`Group not found: ${id}`)
  appData.groups[idx] = { ...appData.groups[idx], ...data, updated_at: new Date().toISOString() }
  writeData(appData)
  return appData.groups[idx]
}

export function deleteGroup(id: string): void {
  const appData = readData()
  const defaultGroup = appData.groups.find(g => g.is_default === 1)
  // Move views to default group
  if (defaultGroup) {
    appData.views.forEach(v => {
      if (v.group_id === id) v.group_id = defaultGroup.id
    })
  }
  appData.groups = appData.groups.filter(g => g.id !== id)
  writeData(appData)
}

export function getAllGroups(): Group[] {
  return readData().groups
}

// View CRUD
export function createView(data: Omit<View, 'id' | 'created_at' | 'updated_at'>): View {
  const appData = readData()
  const view: View = {
    ...data,
    id: uuidv4(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  } as View
  appData.views.push(view)
  writeData(appData)
  return view
}

export function updateView(id: string, data: Partial<View>): View {
  const appData = readData()
  const idx = appData.views.findIndex(v => v.id === id)
  if (idx === -1) throw new Error(`View not found: ${id}`)
  appData.views[idx] = { ...appData.views[idx], ...data, updated_at: new Date().toISOString() }
  writeData(appData)
  return appData.views[idx]
}

export function deleteView(id: string): void {
  const appData = readData()
  appData.views = appData.views.filter(v => v.id !== id)
  writeData(appData)
}

export function getViewsByGroup(groupId: string): View[] {
  return readData().views.filter(v => v.group_id === groupId)
}

// Config operations — config always at userData/app_data/ so it's readable before resourcePath is set
export function readConfig(): AppConfig {
  const cfgPath = defaultConfigPath || join(defaultConfigDir(), CONFIG_FILE)
  if (!existsSync(cfgPath)) {
    return { ...DEFAULT_CONFIG }
  }
  try {
    const content = readFileSync(cfgPath, 'utf-8')
    return { ...DEFAULT_CONFIG, ...JSON.parse(content) }
  } catch {
    return { ...DEFAULT_CONFIG }
  }
}

export function writeConfig(config: Partial<AppConfig>): void {
  const cfgPath = defaultConfigPath || join(defaultConfigDir(), CONFIG_FILE)
  const current = readConfig()
  const updated = { ...current, ...config }
  writeFileSync(cfgPath, JSON.stringify(updated, null, 2), 'utf-8')
}

export function getSetting(key: keyof AppConfig): unknown {
  const config = readConfig()
  return config[key]
}

export function setSetting(key: keyof AppConfig, value: unknown): void {
  const config = readConfig()
  const configRecord = config as unknown as Record<string, unknown>
  configRecord[key] = value
  const cfgPath = defaultConfigPath || join(defaultConfigDir(), CONFIG_FILE)
  writeFileSync(cfgPath, JSON.stringify(config, null, 2), 'utf-8')
}

// Resource path operations
export function getResourcePath(): string | null {
  return readConfig().resourcePath
}

export function setResourcePath(path: string): void {
  writeConfig({ resourcePath: path })
  ensureResourcePath(path)
}

export function ensureResourcePath(dirPath: string): void {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true })
  }
  const defaultDir = join(dirPath, '默认目录')
  if (!existsSync(defaultDir)) {
    mkdirSync(defaultDir, { recursive: true })
  }
}
