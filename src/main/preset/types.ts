export interface PresetFile {
  version: number
  group: {
    name: string
    icon: string
    color: string
  }
  views: Array<{
    name: string
    url: string
    icon: string
  }>
}
