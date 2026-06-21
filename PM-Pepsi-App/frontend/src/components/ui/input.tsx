import * as React from 'react'

import { cn } from '@/lib/utils'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        'flex h-10 w-full rounded-button border border-app bg-[var(--app-surface)] px-3 py-2 text-body-sm text-app ring-offset-[var(--app-surface)] file:border-0 file:bg-transparent file:text-body-sm file:font-medium placeholder:text-app-muted focus-app-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
)
Input.displayName = 'Input'

export { Input }
