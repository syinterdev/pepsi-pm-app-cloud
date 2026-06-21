import * as SheetPrimitive from '@radix-ui/react-dialog'
import { cva, type VariantProps } from 'class-variance-authority'
import { X } from 'lucide-react'
import * as React from 'react'

import { focusInitialInDialog } from '@/lib/dialog-focus'
import { useDialogContentRef } from '@/lib/use-dialog-content-ref'
import { cn } from '@/lib/utils'

const Sheet = SheetPrimitive.Root
const SheetTrigger = SheetPrimitive.Trigger
const SheetClose = SheetPrimitive.Close
const SheetPortal = SheetPrimitive.Portal

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className,
    )}
    {...props}
  />
))
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName

const sheetVariants = cva(
  'macos-dialog-glass fixed z-50 flex flex-col gap-4 border border-app bg-[var(--app-surface)] shadow-app-dialog transition ease-[cubic-bezier(0.22,1,0.36,1)] duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-200 data-[state=open]:duration-200',
  {
    variants: {
      side: {
        top: 'inset-x-0 top-0 max-h-[min(92dvh,640px)] rounded-b-dialog border-t data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
        bottom:
          'inset-x-0 bottom-0 max-h-[min(92dvh,640px)] rounded-t-dialog border-b-0 data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom pb-[env(safe-area-inset-bottom)]',
        left: 'inset-y-0 left-0 h-full w-[min(100vw-2rem,20rem)] border-l-0 data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left',
        right:
          'inset-y-0 right-0 h-full w-[min(100vw-2rem,20rem)] border-r-0 data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right',
      },
    },
    defaultVariants: {
      side: 'right',
    },
  },
)

type SheetContentProps = React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content> &
  VariantProps<typeof sheetVariants> & {
    /** ซ่อนปุ่ม X มุมขวาบน (ใช้ SheetClose เองใน header) */
    hideClose?: boolean
    /** Override overlay classes (e.g. nav drawer `bg-black/40`) */
    overlayClassName?: string
  }

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({ side = 'right', className, children, hideClose = false, overlayClassName, onOpenAutoFocus, ...props }, ref) => {
  const { innerRef, setRef } = useDialogContentRef(ref)

  return (
    <SheetPortal>
      <SheetOverlay className={overlayClassName} />
      <SheetPrimitive.Content
        ref={setRef}
        tabIndex={-1}
        className={cn(sheetVariants({ side }), 'outline-none', className)}
        onOpenAutoFocus={(e) => {
          onOpenAutoFocus?.(e)
          if (e.defaultPrevented) return
          e.preventDefault()
          focusInitialInDialog(innerRef.current)
        }}
        {...props}
      >
        {children}
        {!hideClose ? (
          <SheetPrimitive.Close
            data-dialog-close
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-[var(--app-surface)] transition-opacity hover:opacity-100 focus:outline-none focus-app-ring disabled:pointer-events-none"
          >
            <X className="size-4" />
            <span className="sr-only">ปิด</span>
          </SheetPrimitive.Close>
        ) : null}
      </SheetPrimitive.Content>
    </SheetPortal>
  )
})
SheetContent.displayName = SheetPrimitive.Content.displayName

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col gap-1.5 border-b border-app px-4 py-3 pr-12 text-left', className)}
    {...props}
  />
)
SheetHeader.displayName = 'SheetHeader'

const SheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'mt-auto flex shrink-0 flex-col gap-2 border-t border-app p-4 sm:flex-row sm:justify-end sm:space-x-2',
      className,
    )}
    {...props}
  />
)
SheetFooter.displayName = 'SheetFooter'

const SheetBody = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4', className)} {...props} />
)
SheetBody.displayName = 'SheetBody'

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn('text-body font-semibold text-app', className)}
    {...props}
  />
))
SheetTitle.displayName = SheetPrimitive.Title.displayName

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn('text-caption text-app-muted', className)}
    {...props}
  />
))
SheetDescription.displayName = SheetPrimitive.Description.displayName

export {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
  sheetVariants,
}
