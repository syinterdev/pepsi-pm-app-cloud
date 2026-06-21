import { Button, type ButtonProps } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import * as React from 'react'

export type IconButtonProps = Omit<ButtonProps, 'size' | 'children' | 'aria-label'> & {
  /** Required accessible name (ปุ่มไอคอนล้วน) */
  'aria-label': string
  children: React.ReactNode
}

/** Icon-only control — always pass `aria-label` (not just `title`). */
export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, children, ...props }, ref) => (
    <Button ref={ref} type="button" size="icon" className={cn(className)} {...props}>
      {children}
    </Button>
  ),
)
IconButton.displayName = 'IconButton'
