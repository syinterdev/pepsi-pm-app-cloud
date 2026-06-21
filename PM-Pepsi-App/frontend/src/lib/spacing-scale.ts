/** U0 spacing scale (px) — ใช้กับ Tailwind `gap-1`…`gap-8` หลัง `@theme` ใน index.css */
export const APP_SPACING_SCALE = [4, 8, 12, 16, 24, 32] as const

export type AppSpacingStep = 1 | 2 | 3 | 4 | 5 | 6

export function appSpacingPx(step: AppSpacingStep): number {
  return APP_SPACING_SCALE[step - 1]
}
