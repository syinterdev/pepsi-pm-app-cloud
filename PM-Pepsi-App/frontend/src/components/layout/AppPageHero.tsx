import { PepsiStripe } from '@/components/brand/PepsiStripe'
import { cn } from '@/lib/utils'
import { coerceStringArray } from '@/lib/coerce-array'
import { motion, useReducedMotion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

/** ปุ่มรองบน hero gradient (outline / ghost) */
export const appPageHeroBtnClass =
  'dashboard-hero__btn border-white/20 bg-white/10 text-white backdrop-blur-md hover:bg-white/20 hover:text-white'

/** ปุ่มหลักบน hero gradient */
export const appPageHeroBtnPrimaryClass = 'dashboard-hero__btn-primary shadow-lg'

type AppPageHeroProps = {
  title: ReactNode
  description?: ReactNode
  /** chip คำอธิบายสั้นใต้หัวข้อ */
  hints?: string[]
  /** ใต้หัวข้อ — badge, hint chips */
  meta?: ReactNode
  eyebrow?: string
  eyebrowIcon?: ReactNode
  actions?: ReactNode
  /** แบบ home — padding กะทัดรัด */
  compact?: boolean
  /** ลูกบอล gradient ด้านหลัง */
  animated?: boolean
  className?: string
}

export function AppPageHeroActions({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('dashboard-hero__actions flex flex-wrap items-center gap-2', className)}>
      {children}
    </div>
  )
}

/**
 * Hero แบบ dark gradient — ใช้ทุกหน้าแอป (Dashboard หน้าแรก)
 */
export function AppPageHero({
  title,
  description,
  hints,
  meta,
  eyebrow,
  eyebrowIcon,
  actions,
  compact = true,
  animated = true,
  className,
}: AppPageHeroProps) {
  const { t } = useTranslation('common')
  const reducedMotion = useReducedMotion()
  const showOrbs = animated && !reducedMotion
  const eyebrowText = eyebrow ?? t('hero.defaultEyebrow')

  return (
    <header
      className={cn(
        'dashboard-hero shrink-0',
        compact && 'dashboard-hero--compact',
        className,
      )}
    >
      <div className="dashboard-hero__mesh" aria-hidden />
      {showOrbs ? (
        <>
          <motion.div
            className="dashboard-orb dashboard-orb--a"
            animate={{ x: [0, 40, 10, 0], y: [0, -24, 12, 0], scale: [1, 1.08, 0.96, 1] }}
            transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
            aria-hidden
          />
          <motion.div
            className="dashboard-orb dashboard-orb--b"
            animate={{ x: [0, -32, -8, 0], y: [0, 18, -12, 0], scale: [1, 0.94, 1.06, 1] }}
            transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
            aria-hidden
          />
          <motion.div
            className="dashboard-orb dashboard-orb--c"
            animate={{ x: [0, 20, -16, 0], y: [0, 28, 8, 0] }}
            transition={{ duration: 19, repeat: Infinity, ease: 'easeInOut' }}
            aria-hidden
          />
        </>
      ) : null}

      <motion.div
        className="dashboard-hero__content dashboard-page__pad mx-auto w-full max-w-[1600px]"
        initial={reducedMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            {eyebrowText ? (
              <p className="dashboard-hero__eyebrow">
                {eyebrowIcon ?? <Sparkles className="size-4 shrink-0" aria-hidden />}
                {eyebrowText}
              </p>
            ) : null}
            <h1 className="dashboard-hero__title">{title}</h1>
            {coerceStringArray(hints).length > 0 ? (
              <AppPageHeroHints hints={hints} />
            ) : null}
            {meta}
            {description ? (
              <p className="dashboard-hero__subtitle">{description}</p>
            ) : null}
          </div>
          {actions ? <AppPageHeroActions>{actions}</AppPageHeroActions> : null}
        </div>
      </motion.div>
      <PepsiStripe className="dashboard-hero__pepsi-stripe" />
    </header>
  )
}

/** chip คำอธิบายสั้นบน hero (scheduling hints) */
export function AppPageHeroHints({ hints }: { hints?: string[] | null }) {
  const list = coerceStringArray(hints)
  if (list.length === 0) return null
  return (
    <ul className="mt-2 flex flex-wrap gap-1.5">
      {list.map((hint) => (
        <li key={hint} className="app-page-hero__hint">
          {hint}
        </li>
      ))}
    </ul>
  )
}
