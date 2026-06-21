import type { Variants } from 'framer-motion'

/** Light list/KPI stagger — PRE-UAT U4c (≤10–30 items, not table rows) */
export const LIST_KPI_STAGGER = {
  staggerChildren: 0.04,
  delayChildren: 0.04,
  itemDuration: 0.28,
} as const

/** Max items for list/KPI stagger — see PRE-UAT §D */
export const LIST_KPI_STAGGER_MAX_ITEMS = 30

/** Hard ceiling: never bulk-animate table/data rows at this scale (PRE-UAT §D) */
export const TABLE_ROW_MOTION_FORBIDDEN_AT = 500

export function shouldUseListKpiStagger(
  reduceMotion: boolean | null,
  itemCount?: number,
): boolean {
  if (reduceMotion) return false
  if (itemCount != null && itemCount >= TABLE_ROW_MOTION_FORBIDDEN_AT) return false
  if (itemCount != null && itemCount > LIST_KPI_STAGGER_MAX_ITEMS) return false
  return true
}

function staggerEnabled(reduceMotion: boolean | null, itemCount?: number) {
  return shouldUseListKpiStagger(reduceMotion, itemCount)
}

export const listKpiStaggerContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: LIST_KPI_STAGGER.staggerChildren,
      delayChildren: LIST_KPI_STAGGER.delayChildren,
    },
  },
}

export const listKpiStaggerItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: LIST_KPI_STAGGER.itemDuration,
      ease: [0.22, 1, 0.36, 1],
    },
  },
}

/** Image/card tiles — same timing, subtle scale */
export const listKpiStaggerCardItem: Variants = {
  hidden: { opacity: 0, y: 10, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.22,
      ease: [0.22, 1, 0.36, 1],
    },
  },
}

/** Framer container — pass useReducedMotion() + optional item count */
export function listKpiStaggerRootMotion(reduceMotion: boolean | null, itemCount?: number) {
  const active = staggerEnabled(reduceMotion, itemCount)
  return {
    variants: active ? listKpiStaggerContainer : undefined,
    initial: active ? ('hidden' as const) : false,
    animate: active ? ('show' as const) : undefined,
  }
}

/** Framer item — child of listKpiStaggerRootMotion */
export function listKpiStaggerItemMotion(reduceMotion: boolean | null, itemCount?: number) {
  return {
    variants: staggerEnabled(reduceMotion, itemCount) ? listKpiStaggerItem : undefined,
  }
}

export function listKpiStaggerCardItemMotion(reduceMotion: boolean | null, itemCount?: number) {
  return {
    variants: staggerEnabled(reduceMotion, itemCount) ? listKpiStaggerCardItem : undefined,
  }
}
