import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { View } from './group'
import { useGroupStore } from './group'

export const useViewStore = defineStore('view', () => {
  const views = ref<View[]>([])
  const activeViewId = ref<string | null>(null)

  const activeView = computed(() =>
    views.value.find((v) => v.id === activeViewId.value)
  )

  const visibleViews = computed(() => {
    const groupStore = useGroupStore()
    const groupOrder = new Map(groupStore.sortedGroups.map((g, i) => [g.id, i]))
    return views.value
      .filter((v) => v.visible)
      .sort((a, b) => {
        const ga = groupOrder.get(a.group_id) ?? 0
        const gb = groupOrder.get(b.group_id) ?? 0
        if (ga !== gb) return ga - gb
        return a.sort_order - b.sort_order
      })
  })

  function getViewsByGroup(groupId: string) {
    return views.value
      .filter((v) => v.group_id === groupId)
      .sort((a, b) => a.sort_order - b.sort_order)
  }

  function setViews(data: View[]) {
    views.value = data
  }

  function setActiveView(id: string) {
    activeViewId.value = id
    window.api.db.setting.set('activeViewId', id)
  }

  async function createView(data: Omit<View, 'id' | 'created_at' | 'updated_at'>) {
    const view = await window.api.db.view.create(data)
    views.value.push(view)
    return view
  }

  async function updateView(id: string, data: Partial<View>) {
    const updated = await window.api.db.view.update({ id, ...data })
    const idx = views.value.findIndex((v) => v.id === id)
    if (idx !== -1) views.value[idx] = updated
    return updated
  }

  async function updateViewUrl(id: string, url: string) {
    const updated = await window.api.db.view.update({ id, url })
    const idx = views.value.findIndex((v) => v.id === id)
    if (idx !== -1) views.value[idx] = updated
    return updated
  }

  async function deleteView(id: string) {
    await window.api.db.view.delete(id)
    views.value = views.value.filter((v) => v.id !== id)
    // Remove the WebContentsView from main process
    window.api.webview.remove(id)
    if (activeViewId.value === id) {
      activeViewId.value = views.value[0]?.id ?? null
    }
  }

  async function moveView(id: string, targetGroupId: string) {
    const updated = await window.api.db.view.update({ id, group_id: targetGroupId })
    const view = views.value.find((v) => v.id === id)
    if (view) view.group_id = targetGroupId
    return updated
  }

  return {
    views,
    activeViewId,
    activeView,
    visibleViews,
    getViewsByGroup,
    setViews,
    setActiveView,
    createView,
    updateView,
    updateViewUrl,
    deleteView,
    moveView
  }
})
