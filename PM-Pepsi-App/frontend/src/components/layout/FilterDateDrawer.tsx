import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { CalendarRange, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

export type FilterDateDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  summary?: string
  children: ReactNode
  onApply: () => void
  applyDisabled?: boolean
  applyLabel?: string
}

/** Mobile filter / date range panel — Radix Sheet (bottom) · Esc · focus trap · sticky Apply */
export function FilterDateDrawer({
  open,
  onOpenChange,
  title,
  summary,
  children,
  onApply,
  applyDisabled = false,
  applyLabel,
}: FilterDateDrawerProps) {
  const { t } = useTranslation('common')
  const drawerTitle = title ?? t('filterDrawer.title')
  const applyText = applyLabel ?? t('filterDrawer.apply')

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" hideClose className="gap-0 p-0 lg:hidden">
        <SheetHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pr-4">
          <div className="min-w-0">
            <SheetTitle>{drawerTitle}</SheetTitle>
            {summary ? (
              <SheetDescription className="truncate">{summary}</SheetDescription>
            ) : null}
            <p className="mt-1 text-xs text-app-muted">{t('filterDrawer.escHint')}</p>
          </div>
          <SheetClose asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0"
              aria-label={t('filterDrawer.close')}
            >
              <X className="size-4" aria-hidden />
            </Button>
          </SheetClose>
        </SheetHeader>

        <SheetBody className="py-4">{children}</SheetBody>

        <SheetFooter className="flex-col gap-2 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-col">
          <Button
            type="button"
            className="w-full gap-2"
            size="lg"
            data-testid="filter-date-apply"
            disabled={applyDisabled}
            onClick={() => {
              onApply()
              onOpenChange(false)
            }}
          >
            <CalendarRange className="size-4" aria-hidden />
            {applyText}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

type FilterDateDrawerTriggerProps = {
  summary: string
  onOpen: () => void
  className?: string
}

export function FilterDateDrawerTrigger({ summary, onOpen, className }: FilterDateDrawerTriggerProps) {
  return (
    <Button
      type="button"
      variant="outline"
      className={cn('w-full justify-start gap-2 lg:hidden', className)}
      onClick={onOpen}
    >
      <CalendarRange className="size-4 shrink-0 text-app-muted" aria-hidden />
      <span className="truncate">{summary}</span>
    </Button>
  )
}
