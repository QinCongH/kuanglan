import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

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

export const useGroupStore = defineStore('group', () => {
  const groups = ref<Group[]>([])

  const sortedGroups = computed(() =>
    [...groups.value].sort((a, b) => a.sort_order - b.sort_order)
  )

  const defaultGroup = computed(() =>
    groups.value.find((g) => g.is_default === 1)
  )

  function setGroups(data: Group[]) {
    groups.value = data
  }

  async function createGroup(data: Omit<Group, 'id' | 'created_at' | 'updated_at'>) {
    const group = await window.api.db.group.create(data)
    groups.value.push(group)
    return group
  }

  async function updateGroup(id: string, data: Partial<Group>) {
    const updated = await window.api.db.group.update({ id, ...data })
    const idx = groups.value.findIndex((g) => g.id === id)
    if (idx !== -1) groups.value[idx] = updated
    return updated
  }

  async function deleteGroup(id: string) {
    await window.api.db.group.delete(id)
    groups.value = groups.value.filter((g) => g.id !== id)
  }

  async function toggleCollapse(id: string) {
    const group = groups.value.find((g) => g.id === id)
    if (group) {
      await updateGroup(id, { collapsed: group.collapsed ? 0 : 1 })
    }
  }

  return { groups, sortedGroups, defaultGroup, setGroups, createGroup, updateGroup, deleteGroup, toggleCollapse }
})
