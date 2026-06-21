import * as React from 'react'

import { cn } from '@/lib/utils'

/** Sticky leading column(s) inside `.app-table-shell` horizontal scroll */
export function tableStickyClass(col: 1 | 2 | 3 | 4 = 1) {
  return cn('app-table-sticky', col > 1 && `app-table-sticky--col-${col}`)
}

type TableProps = React.HTMLAttributes<HTMLTableElement> & {
  /** ไม่ห่อ overflow — ให้ `.app-table-shell` เป็นตัว scroll (sticky header ทำงาน) */
  embedded?: boolean
  stickyHeader?: boolean
  zebra?: boolean
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, embedded, stickyHeader, zebra, ...props }, ref) => {
    const table = (
      <table
        ref={ref}
        className={cn(
          'w-full caption-bottom text-body-sm',
          stickyHeader && 'app-data-table-sticky',
          zebra && 'app-data-table-zebra',
          className,
        )}
        {...props}
      />
    )
    if (embedded) return table
    return <div className="relative w-full overflow-auto">{table}</div>
  },
)
Table.displayName = 'Table'

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn('[&_tr]:border-b', className)} {...props} />
))
TableHeader.displayName = 'TableHeader'

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn('[&_tr:last-child]:border-0', className)}
    {...props}
  />
))
TableBody.displayName = 'TableBody'

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      'border-b border-app transition-colors hover:bg-app-subtle/80 data-[state=selected]:bg-app-muted',
      className,
    )}
    {...props}
  />
))
TableRow.displayName = 'TableRow'

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      'h-10 px-4 text-left align-middle text-xs font-medium text-app-muted [&:has([role=checkbox])]:pr-0',
      className,
    )}
    {...props}
  />
))
TableHead.displayName = 'TableHead'

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn('p-4 align-middle text-body-sm [&:has([role=checkbox])]:pr-0', className)}
    {...props}
  />
))
TableCell.displayName = 'TableCell'

export { Table, TableBody, TableCell, TableHead, TableHeader, TableRow }
