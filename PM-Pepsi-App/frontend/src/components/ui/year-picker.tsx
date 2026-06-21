import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { Check, ChevronDown } from 'lucide-react'
import { useState } from 'react'

export function YearPicker({
  value,
  onChange,
  years,
  id,
  className,
  disabled,
}: {
  value: number
  onChange: (year: number) => void
  years: number[]
  id?: string
  className?: string
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-expanded={open}
          className={cn(
            'h-11 min-w-[10.5rem] justify-between gap-2 rounded-button border-app/80 bg-[var(--app-surface)] px-3 shadow-sm transition-all duration-200',
            'hover:border-[color-mix(in_srgb,var(--app-accent)_35%,var(--app-border))] hover:shadow-md',
            open &&
              'border-[color-mix(in_srgb,var(--app-accent)_45%,var(--app-border))] ring-2 ring-[color-mix(in_srgb,var(--app-accent)_18%,transparent)]',
            'border-[color-mix(in_srgb,var(--app-accent)_24%,var(--app-border))] bg-[color-mix(in_srgb,var(--app-accent)_4%,var(--app-surface))]',
            className,
          )}
        >
          <span className="text-body font-semibold tabular-nums text-app">{value}</span>
          <ChevronDown
            className={cn(
              'size-4 shrink-0 text-app-muted transition-transform duration-200',
              open && 'rotate-180',
            )}
            aria-hidden
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-[var(--radix-popover-trigger-width)] min-w-[10.5rem] p-1"
      >
        <ul
          className="max-h-56 overflow-y-auto overscroll-contain py-0.5"
          role="listbox"
          aria-label="Year"
        >
          {years.map((y) => {
            const selected = y === value
            return (
              <li key={y} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={cn(
                    'flex w-full items-center justify-between gap-2 rounded-md px-3 py-2.5 text-left text-body-sm transition-colors',
                    selected
                      ? 'bg-[color-mix(in_srgb,var(--app-accent)_12%,var(--app-surface))] font-semibold text-app'
                      : 'text-app hover:bg-app-muted',
                  )}
                  onClick={() => {
                    onChange(y)
                    setOpen(false)
                  }}
                >
                  <span className="tabular-nums">{y}</span>
                  {selected ? <Check className="size-4 shrink-0 text-[var(--app-accent)]" aria-hidden /> : null}
                </button>
              </li>
            )
          })}
        </ul>
      </PopoverContent>
    </Popover>
  )
}
