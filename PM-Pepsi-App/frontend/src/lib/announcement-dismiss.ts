const DISMISS_KEY = 'pm_dismissed_announcements'

export function readDismissedAnnouncements(): Set<number> {
  try {
    const raw = localStorage.getItem(DISMISS_KEY)
    if (!raw) return new Set()
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.filter((n): n is number => typeof n === 'number'))
  } catch {
    return new Set()
  }
}

export function dismissAnnouncement(id: number): Set<number> {
  const next = new Set(readDismissedAnnouncements())
  next.add(id)
  localStorage.setItem(DISMISS_KEY, JSON.stringify([...next]))
  return next
}
