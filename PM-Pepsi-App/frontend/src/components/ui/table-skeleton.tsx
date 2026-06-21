import { Skeleton } from '@/components/ui/skeleton'
import { TableCell, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

const CELL_WIDTHS = ['w-full', 'w-11/12', 'w-4/5', 'w-3/4', 'w-5/6'] as const

export type TableSkeletonRowsProps = {
  rows?: number
  columns: number
  /** First column often narrower (e.g. checkbox / index) */
  narrowFirstColumn?: boolean
}

/** Skeleton `<TableRow>` cells — use inside `<TableBody>` while data loads. */
export function TableSkeletonRows({
  rows = 8,
  columns,
  narrowFirstColumn = false,
}: TableSkeletonRowsProps) {
  return (
    <>
      {Array.from({ length: rows }, (_, rowIndex) => (
        <TableRow key={`sk-row-${rowIndex}`} aria-hidden>
          {Array.from({ length: columns }, (__, colIndex) => (
            <TableCell key={`sk-${rowIndex}-${colIndex}`}>
              <Skeleton
                className={cn(
                  'h-5',
                  narrowFirstColumn && colIndex === 0 ? 'w-8' : CELL_WIDTHS[(rowIndex + colIndex) % CELL_WIDTHS.length],
                )}
              />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}
