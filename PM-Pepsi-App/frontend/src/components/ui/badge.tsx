import { cva, type VariantProps } from 'class-variance-authority'
import type { HTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-3 py-1 text-xs font-semibold transition-colors focus:outline-none focus-app-ring',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-[var(--app-text)] text-[var(--app-surface)] hover:opacity-90',
        secondary:
          'border-transparent bg-app-muted text-app hover:bg-app-subtle',
        destructive:
          'border-transparent bg-red-600 text-[var(--app-surface)] hover:bg-red-700',
        info:
          'border-transparent bg-[color-mix(in_srgb,var(--sys-blue-light)_14%,white)] text-[color-mix(in_srgb,var(--sys-blue-light)_78%,black)]',
        warning:
          'border-transparent bg-[color-mix(in_srgb,var(--sys-orange-light)_14%,white)] text-[color-mix(in_srgb,var(--sys-orange-light)_78%,black)]',
        success:
          'border-transparent bg-[color-mix(in_srgb,var(--sys-green-light)_14%,white)] text-[color-mix(in_srgb,var(--sys-green-light)_78%,black)]',
        error:
          'border-transparent bg-[color-mix(in_srgb,var(--sys-red-light)_14%,white)] text-[color-mix(in_srgb,var(--sys-red-light)_78%,black)]',
        outline: 'text-app border-app',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export type BadgeProps = HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof badgeVariants>

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
