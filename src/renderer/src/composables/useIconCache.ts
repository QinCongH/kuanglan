import { ref, type Ref } from 'vue'

const memoryCache = new Map<string, string>()

const STORAGE_KEY = 'kl-icon-cache'

function loadFromStorage(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveToStorage(data: Record<string, string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // localStorage quota exceeded or unavailable
  }
}

export async function getCachedIcon(url: string): Promise<string | null> {
  if (memoryCache.has(url)) return memoryCache.get(url)!
  const store = loadFromStorage()
  if (store[url]) {
    memoryCache.set(url, store[url])
    return store[url]
  }
  return null
}

export async function fetchAndCacheIcon(url: string): Promise<string> {
  const cached = await getCachedIcon(url)
  if (cached) return cached

  try {
    const base64 = await window.api.icon.fetch(url)
    if (!base64) return url

    memoryCache.set(url, base64)
    const store = loadFromStorage()
    store[url] = base64
    saveToStorage(store)

    return base64
  } catch {
    return url
  }
}

export async function cacheAllIcons(icons: string[]): Promise<void> {
  const uniqueIcons = [...new Set(icons.filter(Boolean))]
  const CONCURRENCY = 5
  const queue = [...uniqueIcons]
  const processing: Promise<void>[] = []

  async function processNext(): Promise<void> {
    const url = queue.shift()
    if (!url) return
    await fetchAndCacheIcon(url)
    return processNext()
  }

  for (let i = 0; i < Math.min(CONCURRENCY, queue.length); i++) {
    processing.push(processNext())
  }

  await Promise.all(processing)
}

export function useCachedIcon(iconUrl: Ref<string>): Ref<string> {
  const resolvedSrc = ref(iconUrl.value)

  async function resolve() {
    const url = iconUrl.value
    if (!url) {
      resolvedSrc.value = ''
      return
    }
    const cached = await getCachedIcon(url)
    if (cached) {
      resolvedSrc.value = cached
      return
    }
    resolvedSrc.value = url
    const result = await fetchAndCacheIcon(url)
    if (iconUrl.value === url) {
      resolvedSrc.value = result
    }
  }

  resolve()

  return resolvedSrc
}
