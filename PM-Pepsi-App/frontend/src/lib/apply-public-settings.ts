import { publicFaviconUrl } from '@/lib/settings-api'

export function applyDocumentTitle(appName: string | undefined): void {
  if (appName?.trim()) {
    document.title = appName.trim()
  }
}

const FAVICON_LINK_RELS = ['icon', 'shortcut icon'] as const

function ensureFaviconLinks(): HTMLLinkElement[] {
  const links: HTMLLinkElement[] = []
  for (const rel of FAVICON_LINK_RELS) {
    let link = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
    if (!link) {
      link = document.createElement('link')
      link.rel = rel
      document.head.appendChild(link)
    }
    links.push(link)
  }
  return links
}

export type ApplyFaviconOptions = {
  /** cache-bust หลังอัปโหลด/เปลี่ยนขนาด */
  cacheKey?: number | string
  sizePx?: number
}

/** ตั้งไอคอนแท็บเบราว์เซอร์ — ใช้ favicon จาก API หรือ fallback เริ่มต้น */
export function applyFavicon(
  hasFavicon: boolean | undefined,
  options?: ApplyFaviconOptions,
): void {
  const links = ensureFaviconLinks()
  const fallback = '/favicon.svg'

  if (hasFavicon) {
    const v = options?.cacheKey ?? Date.now()
    const href = `${publicFaviconUrl()}?v=${encodeURIComponent(String(v))}`
    const size = options?.sizePx
    for (const link of links) {
      link.href = href
      link.type = 'image/png'
      if (size) link.sizes = `${size}x${size}`
      else link.removeAttribute('sizes')
    }
    return
  }

  for (const link of links) {
    link.href = fallback
    link.type = 'image/svg+xml'
    link.removeAttribute('sizes')
  }
}
