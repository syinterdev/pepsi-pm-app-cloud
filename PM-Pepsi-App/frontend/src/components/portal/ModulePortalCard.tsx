import type { CSSProperties } from 'react'
import type { PortalModule } from '@/lib/portal-api'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { motion, useReducedMotion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { ArrowUpRight, Bell, Box, Package, Wrench } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const ICONS: Record<string, LucideIcon> = {
  wrench: Wrench,
  package: Package,
  bell: Bell,
  box: Box,
}

const MODULE_ACCENT_BAR: Record<string, string> = {
  pm: 'var(--brand-logo-blue-dark, var(--app-accent))',
  store: 'var(--brand-logo-orange, var(--app-accent))',
  repair: 'var(--brand-logo-green-light, var(--app-accent))',
}

export type ModulePortalCardProps = {
  module: PortalModule
  onOpen: () => void
  className?: string
  motionIndex?: number
}

export function ModulePortalCard({
  module,
  onOpen,
  className,
  motionIndex = 0,
}: ModulePortalCardProps) {
  const { t, i18n } = useTranslation('portal')
  const reduceMotion = useReducedMotion()
  const Icon = ICONS[module.iconKey] ?? Box
  const localeIsTh = i18n.language.startsWith('th')
  const title =
    t(`modules.${module.code}.title`, {
      defaultValue: localeIsTh ? module.nameTh : module.nameEn,
    }) || (localeIsTh ? module.nameTh : module.nameEn)
  const description =
    t(`modules.${module.code}.description`, {
      defaultValue: localeIsTh ? module.descriptionTh : module.descriptionEn,
    }) || (localeIsTh ? module.descriptionTh : module.descriptionEn)
  const disabled = !module.ready
  const accentColor =
    MODULE_ACCENT_BAR[module.code] ??
    (module.accentToken ? `var(--${module.accentToken}, var(--app-accent))` : 'var(--app-accent)')

  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={onOpen}
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={
        reduceMotion
          ? undefined
          : { duration: 0.45, delay: 0.08 + motionIndex * 0.07, ease: [0.22, 1, 0.36, 1] }
      }
      whileHover={reduceMotion || disabled ? undefined : { y: -6 }}
      whileTap={reduceMotion || disabled ? undefined : { scale: 0.985 }}
      className={cn(
        'portal-module-card group relative flex w-full min-h-[11.5rem] flex-col overflow-hidden rounded-card border text-left shadow-app-card',
        'focus-app-ring',
        disabled ? 'portal-module-card--disabled' : 'portal-module-card--active',
        className,
      )}
      style={{ '--portal-module-accent': accentColor } as CSSProperties}
      aria-label={t('openModule', { name: title })}
    >
      <span className="portal-module-card__shine" aria-hidden />
      <span className="portal-module-card__accent" aria-hidden />

      <div className="relative flex flex-1 flex-col gap-4 p-5">
        <div className="flex w-full items-start justify-between gap-2">
          <span className="portal-module-card__icon" aria-hidden>
            <Icon className="size-6" />
          </span>
          {disabled ? (
            <Badge variant="outline" className="shrink-0 border-app bg-app-subtle/80">
              {t('comingSoon')}
            </Badge>
          ) : (
            <span className="portal-module-card__arrow" aria-hidden>
              <ArrowUpRight className="size-4" />
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1.5">
          <h3 className="text-heading-section text-app">{title}</h3>
          <p className="text-body-sm leading-relaxed text-app-muted">{description}</p>
        </div>

        {!disabled ? (
          <span className="portal-module-card__cta text-caption font-semibold tracking-wide text-[var(--portal-module-accent)]">
            {t('openCta')}
          </span>
        ) : null}
      </div>
    </motion.button>
  )
}
