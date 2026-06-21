/**
 * PRE-UAT U4c — CSS class motion with useReducedMotion() + motion-reduce: fallback in index.css
 */

/** PRE-UAT U4c — single-row feedback only; never bulk `<tr>` stagger (see list-kpi-stagger.ts) */
export const PLANNING_ROW_HIGHLIGHT_ANIMATED = 'planning-row--assign-highlight'
export const PLANNING_ROW_HIGHLIGHT_STATIC = 'planning-row--assign-highlight-static'

export const PLANNING_ACK_PULSE_ANIMATED = 'planning-ack-pending-pulse-once'
export const PLANNING_ACK_PULSE_STATIC = 'planning-ack-pending-pulse-static'

/** Pick animated vs static class; undefined when inactive */
export function appCssMotionClassWhen(
  active: boolean,
  reduceMotion: boolean | null,
  animatedClass: string,
  staticClass: string,
): string | undefined {
  if (!active) return undefined
  return reduceMotion ? staticClass : animatedClass
}

/** PRE-UAT U4c — CTA / primary micro-interaction (hover lift + active press) */
export const APP_INTERACTIVE_MOTION =
  'transition-transform duration-150 ease-out motion-safe:hover:scale-[1.02] motion-safe:active:scale-[0.98] motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100'

/** Cards / chips — lighter lift than buttons */
export const APP_INTERACTIVE_MOTION_SUBTLE =
  'transition-transform duration-200 ease-out motion-safe:hover:scale-[1.01] motion-safe:active:scale-[0.99] motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100'

/** Parent `group` — icon/avatar lift on row hover */
export const APP_GROUP_HOVER_MOTION =
  'transition-transform duration-200 ease-out motion-safe:group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100'
