import { BRAND_DEFAULTS, BRAND_LOGO } from '@/lib/brand-palette'

export const COLOR_PRESETS = [
  {
    id: 'pepsi',
    primary: BRAND_DEFAULTS.primaryColor,
    accent: BRAND_DEFAULTS.accentColor,
  },
  {
    id: 'glass-light',
    primary: BRAND_LOGO.sky,
    accent: BRAND_LOGO.greenLight,
  },
  {
    id: 'glass-dark',
    primary: BRAND_LOGO.sky,
    accent: BRAND_LOGO.orange,
  },
] as const

export const THEME_MODES = [
  { value: 'light' as const },
  { value: 'dark' as const },
  { value: 'system' as const },
] as const
