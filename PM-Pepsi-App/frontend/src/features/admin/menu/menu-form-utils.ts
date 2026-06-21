export const MENU_ROLE_BITS = ['A', 'U', 'W'] as const

/** Native `<select>` — avoid `flex`/`py-*` (clips label text on Windows) */
export const menuSelectClass =
  'block h-10 w-full min-w-0 rounded-button border border-app bg-[var(--app-surface)] px-3 text-body-sm leading-normal text-app focus-app-ring focus-visible:outline-none'

export function parseMenuright(value: string): Set<string> {
  return new Set(
    value
      .split(':')
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean),
  )
}

export function formatMenuright(bits: Set<string>): string {
  return MENU_ROLE_BITS.filter((r) => bits.has(r)).join(':') || 'A'
}
