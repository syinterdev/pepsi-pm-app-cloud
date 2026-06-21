/** Read a CSS custom property from `:root` (for Chart.js / Joyride that need resolved colors). */
export function readCssVar(name: string, fallback = ''): string {
  if (typeof document === 'undefined') return fallback
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}
