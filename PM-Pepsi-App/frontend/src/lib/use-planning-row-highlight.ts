import {
  appCssMotionClassWhen,
  PLANNING_ROW_HIGHLIGHT_ANIMATED,
  PLANNING_ROW_HIGHLIGHT_STATIC,
} from '@/lib/app-motion'
import { useCallback, useEffect, useRef, useState } from 'react'

/** Total highlight duration incl. fade — PRE-UAT U4c */
export const PLANNING_ROW_HIGHLIGHT_MS = 1800

type HighlightTarget = { id: string; nonce: number }

export function usePlanningRowHighlight(reduceMotion = false) {
  const [highlight, setHighlight] = useState<HighlightTarget | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const nonceRef = useRef(0)

  const armClear = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setHighlight(null)
      timerRef.current = null
    }, PLANNING_ROW_HIGHLIGHT_MS)
  }, [])

  const highlightRow = useCallback(
    (id: string | number) => {
      const key = String(id)
      if (timerRef.current) clearTimeout(timerRef.current)
      nonceRef.current += 1
      const nonce = nonceRef.current

      setHighlight((prev) => {
        if (prev?.id === key) {
          requestAnimationFrame(() => {
            setHighlight({ id: key, nonce })
            armClear()
          })
          return null
        }
        armClear()
        return { id: key, nonce }
      })
    },
    [armClear],
  )

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    },
    [],
  )

  const rowHighlightProps = useCallback(
    (id: string | number) => {
      const key = String(id)
      const active = highlight?.id === key
      return {
        'data-planning-row-id': key,
        'data-planning-row-highlight': active ? 'true' : undefined,
        className: appCssMotionClassWhen(
          active,
          reduceMotion,
          PLANNING_ROW_HIGHLIGHT_ANIMATED,
          PLANNING_ROW_HIGHLIGHT_STATIC,
        ),
      } as const
    },
    [highlight, reduceMotion],
  )

  return { highlightRow, highlightId: highlight?.id ?? null, rowHighlightProps }
}
