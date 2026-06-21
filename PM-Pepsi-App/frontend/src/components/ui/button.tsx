import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-button text-body-sm font-medium shadow-app-button transition-[background-color,box-shadow,transform] duration-150 ease-out focus-app-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--app-text)] text-[var(--app-surface)] hover:bg-[color-mix(in_srgb,var(--app-text)_90%,white)] active:bg-[color-mix(in_srgb,var(--app-text)_94%,black)] motion-safe:hover:scale-[1.02]',
        outline:
          'border border-app bg-[var(--app-surface)] text-app shadow-app-button hover:bg-app-subtle active:bg-app-muted',
        secondary:
          'border-transparent bg-app-muted text-app shadow-app-button hover:bg-app-subtle active:bg-app-muted',
        ghost: 'text-app hover:bg-app-muted active:bg-app-subtle',
        destructive:
          'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-button px-3 text-xs',
        lg: 'h-11 rounded-button px-8',
        icon: 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
