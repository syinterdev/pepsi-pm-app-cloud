/** Card padding — ตรง `--app-card-padding*` ใน `index.css` */
export type AppCardPad = 'default' | 'compact' | 'none'

export function appCardPadClass(pad: AppCardPad = 'default'): string | undefined {
  if (pad === 'none') return undefined
  if (pad === 'compact') return 'app-card-pad-compact'
  return 'app-card-pad'
}
