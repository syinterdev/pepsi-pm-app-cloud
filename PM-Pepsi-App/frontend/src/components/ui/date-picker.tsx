import { useI18nFormat } from '@/lib/use-i18n-format'
import { format, parseISO } from 'date-fns'
import { CalendarIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

function toIsoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function DatePicker({
  value,
  onChange,
  id,
  className,
  placeholder,
  disabled,
  fromYear,
  toYear,
}: {
  value: string
  onChange: (iso: string) => void
  id?: string
  className?: string
  placeholder?: string
  disabled?: boolean
  fromYear?: number
  toYear?: number
}) {
  const { t } = useTranslation()
  const { dateFns: dateLocale } = useI18nFormat()
  const placeholderText = placeholder ?? t('datePicker.placeholder')
  const selected = value ? parseISO(value) : undefined
  const now = new Date()
  const yearMin = fromYear ?? now.getFullYear() - 20
  const yearMax = toYear ?? now.getFullYear() + 2
  const startMonth = new Date(yearMin, 0)
  const endMonth = new Date(yearMax, 11)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-40 justify-start gap-2 text-left font-normal shadow-sm transition-all duration-200',
            'border-app/80 hover:border-[color-mix(in_srgb,var(--app-accent)_35%,var(--app-border))] hover:shadow-md',
            !value && 'text-app-muted',
            value &&
              'border-[color-mix(in_srgb,var(--app-accent)_30%,var(--app-border))] bg-[color-mix(in_srgb,var(--app-accent)_4%,var(--app-surface))]',
            className,
          )}
        >
          <CalendarIcon className="size-4 shrink-0" aria-hidden />
          {selected ? format(selected, 'd MMM yyyy', { locale: dateLocale }) : placeholderText}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          'w-auto p-0',
          'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2',
        )}
        align="start"
      >
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(d) => {
            if (d) onChange(toIsoDate(d))
          }}
          locale={dateLocale}
          captionLayout="dropdown"
          startMonth={startMonth}
          endMonth={endMonth}
          defaultMonth={selected}
        />
      </PopoverContent>
    </Popover>
  )
}
