import { useCallback, useLayoutEffect, useState, type RefObject } from 'react'

/** Top/bottom fade on sidebar nav when content overflows (U4g.4) */
export function useSidebarNavScrollFade(
  ref: RefObject<HTMLElement | null>,
  enabled: boolean,
) {
  const [fadeTop, setFadeTop] = useState(false)
  const [fadeBottom, setFadeBottom] = useState(false)

  const update = useCallback(() => {
    const el = ref.current
    if (!el || !enabled) {
      setFadeTop(false)
      setFadeBottom(false)
      return
    }
    const overflow = el.scrollHeight > el.clientHeight + 2
    if (!overflow) {
      setFadeTop(false)
      setFadeBottom(false)
      return
    }
    setFadeTop(el.scrollTop > 4)
    setFadeBottom(el.scrollTop + el.clientHeight < el.scrollHeight - 4)
  }, [enabled, ref])

  useLayoutEffect(() => {
    update()
    const el = ref.current
    if (!el || !enabled) return
    el.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', update)
      ro.disconnect()
    }
  }, [enabled, ref, update])

  return { fadeTop, fadeBottom }
}
