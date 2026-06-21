import type { AuditHubRevisionItem } from '@/api/schemas'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('th-TH', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

type Props = {
  rows: AuditHubRevisionItem[]
}

export function AuditorRevisionTable({ rows }: Props) {
  if (!rows.length) {
    return (
      <p className="text-caption py-4 text-center text-app-muted">
        ยังไม่มีประวัติการแก้แผนในช่วง 7 วันล่าสุด
      </p>
    )
  }

  return (
    <div className="overflow-x-auto app-table-shell">
      <Table embedded stickyHeader zebra>
        <TableHeader>
          <TableRow>
            <TableHead>เมื่อ</TableHead>
            <TableHead>ประเภท</TableHead>
            <TableHead>WO</TableHead>
            <TableHead>สรุป</TableHead>
            <TableHead>ผู้ทำ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="whitespace-nowrap text-body-sm tabular-nums">
                {formatTime(row.createdAt)}
              </TableCell>
              <TableCell className="text-body-sm">
                <span className="font-medium">{row.changeLabel}</span>
                <span className="ml-1 text-xs text-app-muted">#{row.revisionNo}</span>
              </TableCell>
              <TableCell className="font-mono text-body-sm">{row.workOrder ?? '—'}</TableCell>
              <TableCell className="max-w-[16rem] text-body-sm">
                <span className="line-clamp-2">{row.summary}</span>
                {row.jobDetail ? (
                  <span className="mt-0.5 block text-xs text-app-muted line-clamp-1">
                    {row.jobDetail}
                  </span>
                ) : null}
              </TableCell>
              <TableCell className="text-body-sm text-app-muted">
                {row.actorId ?? '—'}
                {row.actorRole ? ` (${row.actorRole})` : ''}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
