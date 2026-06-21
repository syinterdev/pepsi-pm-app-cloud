import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { Command } from 'cmdk'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown, Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'

export type FilterOption = { code: string; label: string; color?: string }

export type FilterMultiSelectProps = {
  label: string
  options: FilterOption[]
  value: string[]
  onChange: (next: string[]) => void
  placeholder?: string
  disabled?: boolean
}

const chipMotion = {
  initial: { opacity: 0, scale: 0.88, y: -4 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.88, y: -4 },
  transition: { duration: 0.16, ease: [0.22, 1, 0.36, 1] as const },
}

export function FilterMultiSelect({
  label,
  options,
  value,
  onChange,
  placeholder = 'เลือก…',
  disabled = false,
}: FilterMultiSelectProps) {
  const [open, setOpen] = useState(false)
  const selected = useMemo(() => new Set(value), [value])
  const labelByCode = useMemo(
    () => new Map(options.map((o) => [o.code, o.label])),
    [options],
  )

  const toggle = (code: string) => {
    if (selected.has(code)) {
      onChange(value.filter((c) => c !== code))
    } else {
      onChange([...value, code])
    }
  }

  const displayLabel = (code: string) => {
    const full = labelByCode.get(code) ?? code
    return full.length > 36 ? `${full.slice(0, 34)}…` : full
  }

  return (
    <div className="scheduling-filter-field group/field space-y-1.5">
      <div className="flex min-h-5 items-center justify-between gap-2">
        <Label className="text-xs font-semibold tracking-wide text-app-muted">{label}</Label>
        {value.length > 0 ? (
          <button
            type="button"
            className="text-xs text-app-muted opacity-0 transition-opacity hover:text-app group-hover/field:opacity-100 focus:opacity-100"
            onClick={() => onChange([])}
          >
            ล้าง
          </button>
        ) : null}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            aria-expanded={open}
            className={cn(
              'h-10 w-full justify-between gap-2 rounded-button border-app/80 bg-[var(--app-surface)] px-3 font-normal shadow-sm transition-all duration-200',
              'hover:border-[color-mix(in_srgb,var(--app-accent)_35%,var(--app-border))] hover:shadow-md',
              open && 'border-[color-mix(in_srgb,var(--app-accent)_45%,var(--app-border))] ring-2 ring-[color-mix(in_srgb,var(--app-accent)_18%,transparent)]',
              value.length > 0 &&
                'border-[color-mix(in_srgb,var(--app-accent)_30%,var(--app-border))] bg-[color-mix(in_srgb,var(--app-accent)_4%,var(--app-surface))]',
            )}
          >
            <span className={cn('truncate text-body-sm', value.length === 0 && 'text-app-muted')}>
              {value.length > 0 ? `เลือกแล้ว ${value.length} รายการ` : placeholder}
            </span>
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
          className={cn(
            'w-[min(100vw-2rem,var(--radix-popover-trigger-width))] min-w-[16rem] overflow-hidden p-0',
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2',
          )}
        >
          <Command className="scheduling-filter-command" label={label}>
            <div className="flex items-center gap-2 border-b border-app/60 px-3">
              <Search className="size-4 shrink-0 text-app-muted" aria-hidden />
              <Command.Input
                placeholder="ค้นหา…"
                className="h-10 flex-1 bg-transparent text-body-sm outline-none placeholder:text-app-muted"
              />
            </div>
            {options.length > 1 ? (
              <div className="flex gap-2 border-b border-app/40 px-3 py-2">
                <button
                  type="button"
                  className="text-xs font-medium text-[var(--app-accent)] hover:underline"
                  onClick={() => onChange(options.map((o) => o.code))}
                >
                  เลือกทั้งหมด
                </button>
                <span className="text-app-muted">·</span>
                <button
                  type="button"
                  className="text-xs text-app-muted hover:text-app hover:underline"
                  onClick={() => onChange([])}
                >
                  ล้างทั้งหมด
                </button>
              </div>
            ) : null}
            <Command.List className="max-h-56 overflow-y-auto p-1.5">
              <Command.Empty className="py-6 text-center text-xs text-app-muted">
                ไม่พบรายการ
              </Command.Empty>
              <Command.Group>
                {options.map((o) => {
                  const isOn = selected.has(o.code)
                  return (
                    <Command.Item
                      key={`${o.code}-${o.label}`}
                      value={`${o.code} ${o.label}`}
                      onSelect={() => toggle(o.code)}
                      className={cn(
                        'flex cursor-pointer items-start gap-2 rounded-md px-2.5 py-2 text-body-sm outline-none transition-colors',
                        'aria-selected:bg-[color-mix(in_srgb,var(--app-accent)_10%,var(--app-surface))]',
                        isOn && 'bg-[color-mix(in_srgb,var(--app-accent)_8%,var(--app-surface))]',
                      )}
                    >
                      <span
                        className={cn(
                          'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border transition-colors',
                          isOn
                            ? 'border-[var(--app-accent)] bg-[var(--app-accent)] text-white'
                            : 'border-app bg-[var(--app-surface)]',
                        )}
                      >
                        {isOn ? <Check className="size-3" strokeWidth={3} aria-hidden /> : null}
                      </span>
                      <span className="min-w-0 flex-1 flex items-start gap-2 leading-snug">
                        {o.color ? (
                          <span
                            className="mt-1 size-2.5 shrink-0 rounded-full ring-1 ring-black/10"
                            style={{ backgroundColor: o.color }}
                            aria-hidden
                          />
                        ) : null}
                        <span>{o.label}</span>
                      </span>
                    </Command.Item>
                  )
                })}
              </Command.Group>
            </Command.List>
          </Command>
        </PopoverContent>
      </Popover>

      <AnimatePresence mode="popLayout">
        {value.length > 0 ? (
          <motion.div
            layout
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="flex flex-wrap gap-1 overflow-hidden pt-0.5"
          >
            {value.map((code) => (
              <motion.button
                key={code}
                type="button"
                layout
                {...chipMotion}
                title={labelByCode.get(code) ?? code}
                onClick={() => toggle(code)}
                className={cn(
                  'inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-0.5 text-xs',
                  'border-[color-mix(in_srgb,var(--app-accent)_25%,var(--app-border))]',
                  'bg-[color-mix(in_srgb,var(--app-accent)_8%,var(--app-surface))] text-app',
                  'transition-colors hover:bg-[color-mix(in_srgb,var(--app-accent)_14%,var(--app-surface))]',
                )}
              >
                <span className="truncate">{displayLabel(code)}</span>
                <X className="size-3 shrink-0 opacity-60" aria-hidden />
              </motion.button>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
