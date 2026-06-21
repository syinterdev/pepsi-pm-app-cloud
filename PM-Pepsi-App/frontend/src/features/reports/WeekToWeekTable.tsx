import type { WeekToWeekRow } from '@/api/schemas'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

function deltaClass(n: number): string {
  if (n > 0) return 'app-tone-success-strong'
  if (n < 0) return 'app-tone-danger-text'
  return 'text-app-muted'
}

function formatDelta(n: number, suffix = ''): string {
  const sign = n > 0 ? '+' : ''
  return `${sign}${n}${suffix}`
}

type Props = {
  rows: WeekToWeekRow[]
}

export function WeekToWeekTable({ rows }: Props) {
  if (!rows.length) {
    return (
      <p className="text-caption py-4 text-center">
        ต้องมีอย่างน้อย 2 สัปดาห์ในช่วงที่เลือก — ขยายช่วงวันที่หรือเพิ่ม weeksBack
      </p>
    )
  }

  return (
    <div className="overflow-x-auto app-table-shell">
      <Table embedded stickyHeader zebra>
        <TableHeader>
          <TableRow>
            <TableHead>สัปดาห์</TableHead>
 <TableHead>เทียบกับ</TableHead>
            <TableHead className="text-right">Util %</TableHead>
            <TableHead className="text-right">Δ Util</TableHead>
            <TableHead className="text-right">Backlog ชม.</TableHead>
            <TableHead className="text-right">Δ Backlog</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.weekLabel}>
              <TableCell className="font-medium">{row.weekLabel}</TableCell>
              <TableCell className="text-app-muted">{row.prevWeekLabel}</TableCell>
              <TableCell className="text-right tabular-nums">
                {row.utilization}%{' '}
                <span className="text-xs text-app-muted">({row.utilizationPrev}%)</span>
              </TableCell>
              <TableCell className={`text-right tabular-nums font-medium ${deltaClass(row.utilizationDelta)}`}>
                {formatDelta(row.utilizationDelta, '%')}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {row.backlogHours}{' '}
                <span className="text-xs text-app-muted">({row.backlogHoursPrev})</span>
              </TableCell>
              <TableCell className={`text-right tabular-nums font-medium ${deltaClass(row.backlogDelta)}`}>
                {formatDelta(row.backlogDelta)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
