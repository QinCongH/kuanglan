import type { PrefillViewData } from '@renderer/stores/app'

export interface KlLinkParseResult {
  ok: boolean
  data?: PrefillViewData
  error?: string
}

const KL_PREFIX = 'kl://'

/**
 * Strictly parse and validate a `kl://` quick-link share string.
 *
 * Format: `kl://<base64-of-UTF8-JSON>` where the JSON must contain at least
 * `n` (non-empty name) and `u` (valid absolute URL). `i` (icon) and `g`
 * (group name) are optional.
 *
 * Returns `{ ok: true, data }` on success, otherwise `{ ok: false, error }`
 * with a human-readable reason. The same validator is used by the manual
 * import dialog (surfaces the error) and the clipboard auto-import (silently
 * intercepts invalid formats).
 */
export function parseKlLink(text: string): KlLinkParseResult {
  const trimmed = text.trim()
  if (!trimmed.startsWith(KL_PREFIX)) {
    return { ok: false, error: '格式错误：链接必须以 kl:// 开头' }
  }

  const base64 = trimmed.slice(KL_PREFIX.length)
  if (!base64) {
    return { ok: false, error: '格式错误：链接内容为空' }
  }

  let json: string
  try {
    json = new TextDecoder().decode(Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)))
  } catch {
    return { ok: false, error: '格式错误：链接内容无法解码' }
  }

  let data: { n?: unknown; u?: unknown; i?: unknown; g?: unknown }
  try {
    data = JSON.parse(json)
  } catch {
    return { ok: false, error: '格式错误：链接内容不是有效的数据' }
  }

  if (typeof data.n !== 'string' || !data.n.trim()) {
    return { ok: false, error: '格式错误：缺少视图名称 (n)' }
  }
  if (typeof data.u !== 'string' || !data.u.trim()) {
    return { ok: false, error: '格式错误：缺少视图地址 (u)' }
  }

  // Validate that `u` is a valid absolute URL.
  let url: URL
  try {
    url = new URL(data.u)
  } catch {
    return { ok: false, error: '格式错误：视图地址不是合法的 URL' }
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { ok: false, error: '格式错误：视图地址必须是 http/https 协议' }
  }

  return {
    ok: true,
    data: {
      name: data.n.trim(),
      url: data.u.trim(),
      icon: typeof data.i === 'string' ? data.i : '',
      groupName: typeof data.g === 'string' ? data.g : ''
    }
  }
}
