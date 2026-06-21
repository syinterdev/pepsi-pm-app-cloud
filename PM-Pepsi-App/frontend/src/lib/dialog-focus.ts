/** ปุ่มปิดมุมขวาบน — ข้ามเมื่อหา initial focus */
export const DIALOG_CLOSE_ATTR = 'data-dialog-close'
/** ระบุ element ที่ต้องการโฟกัสทันทีเมื่อเปิด overlay */
export const DIALOG_INITIAL_FOCUS_ATTR = 'data-dialog-initial-focus'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not(:disabled)',
  'input:not(:disabled)',
  'select:not(:disabled)',
  'textarea:not(:disabled)',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function isDialogCloseElement(el: HTMLElement): boolean {
  return el.hasAttribute(DIALOG_CLOSE_ATTR) || el.closest(`[${DIALOG_CLOSE_ATTR}]`) != null
}

function isFocusableVisible(el: HTMLElement): boolean {
  if (!el.isConnected || el.getAttribute('aria-hidden') === 'true') return false
  const style = window.getComputedStyle(el)
  return style.visibility !== 'hidden' && style.display !== 'none'
}

function tryFocus(el: HTMLElement): boolean {
  if (!isFocusableVisible(el)) return false
  el.focus({ preventScroll: true })
  const active = document.activeElement
  return active === el || el.contains(active)
}

/**
 * ย้าย focus เข้าใน dialog/sheet เมื่อเปิด — ไม่หลุดไปหลัง overlay
 * ลำดับ: data-dialog-initial-focus → input/textarea/select → ปุ่มอื่น (ไม่รวมปิด) → root
 */
export function focusInitialInDialog(root: HTMLElement | null | undefined): boolean {
  if (!root) return false

  const explicit = root.querySelector<HTMLElement>(`[${DIALOG_INITIAL_FOCUS_ATTR}]`)
  if (explicit && tryFocus(explicit)) return true

  const candidates = [...root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)].filter(
    (el) => !isDialogCloseElement(el),
  )

  const field = candidates.find((el) =>
    /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName),
  )
  if (field && tryFocus(field)) return true

  if (candidates[0] && tryFocus(candidates[0])) return true

  if (root.tabIndex < 0) root.tabIndex = -1
  root.focus({ preventScroll: true })
  return document.activeElement === root
}
