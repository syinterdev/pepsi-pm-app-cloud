import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

function prettyJson(value: unknown): string {
  if (value === null || value === undefined) return ''
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

type DiffLine = {
  key: string
  kind: 'same' | 'added' | 'removed' | 'changed'
  before?: string
  after?: string
}

function buildDiffLines(before: unknown, after: unknown): DiffLine[] {
  const bObj =
    before && typeof before === 'object' && !Array.isArray(before)
      ? (before as Record<string, unknown>)
      : null
  const aObj =
    after && typeof after === 'object' && !Array.isArray(after)
      ? (after as Record<string, unknown>)
      : null

  if (bObj && aObj) {
    const keys = new Set([...Object.keys(bObj), ...Object.keys(aObj)])
    const lines: DiffLine[] = []
    for (const key of [...keys].sort()) {
      const bv = bObj[key]
      const av = aObj[key]
      const bStr = JSON.stringify(bv)
      const aStr = JSON.stringify(av)
      if (!(key in bObj)) {
        lines.push({ key, kind: 'added', after: prettyJson(av) })
      } else if (!(key in aObj)) {
        lines.push({ key, kind: 'removed', before: prettyJson(bv) })
      } else if (bStr === aStr) {
        lines.push({ key, kind: 'same', before: prettyJson(bv), after: prettyJson(av) })
      } else {
        lines.push({ key, kind: 'changed', before: prettyJson(bv), after: prettyJson(av) })
      }
    }
    return lines
  }

  const bStr = prettyJson(before)
  const aStr = prettyJson(after)
  if (!bStr && aStr) return [{ key: '(value)', kind: 'added', after: aStr }]
  if (bStr && !aStr) return [{ key: '(value)', kind: 'removed', before: bStr }]
  if (bStr === aStr) return [{ key: '(value)', kind: 'same', before: bStr, after: aStr }]
  return [{ key: '(value)', kind: 'changed', before: bStr, after: aStr }]
}

const kindStyles: Record<DiffLine['kind'], string> = {
  same: 'bg-app-subtle',
  added: 'admin-diff--added',
  removed: 'admin-diff--removed',
  changed: 'admin-diff--changed',
}

export function AuditDiffViewer({
  before,
  after,
  className,
}: {
  before: unknown | null
  after: unknown | null
  className?: string
}) {
  const { t } = useTranslation('admin')
  const lines = buildDiffLines(before, after)
  const hasStructured = lines.some((l) => l.kind !== 'same')

  if (!before && !after) {
    return <p className="text-caption">{t('audit.diffNoData')}</p>
  }

  if (!hasStructured && lines.length === 1 && lines[0].kind === 'same') {
    return (
      <pre className={cn('max-h-96 overflow-auto rounded-button bg-app-subtle p-3 text-xs', className)}>
        {lines[0].after}
      </pre>
    )
  }

  return (
    <div className={cn('grid gap-3 md:grid-cols-2', className)}>
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-app-muted">
          {t('audit.diffBefore')}
        </p>
        <div className="max-h-96 space-y-2 overflow-auto rounded-button border border-app p-2">
          {lines.map((line) =>
            line.kind === 'added' ? null : (
              <div key={`b-${line.key}`} className={cn('rounded p-2 text-xs', kindStyles[line.kind])}>
                <span className="font-medium text-app">{line.key}</span>
                <pre className="mt-1 whitespace-pre-wrap break-all font-mono text-app">
                  {line.before ?? '—'}
                </pre>
              </div>
            ),
          )}
        </div>
      </div>
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-app-muted">
          {t('audit.diffAfter')}
        </p>
        <div className="max-h-96 space-y-2 overflow-auto rounded-button border border-app p-2">
          {lines.map((line) =>
            line.kind === 'removed' ? null : (
              <div
                key={`a-${line.key}`}
                className={cn('rounded p-2 text-xs', kindStyles[line.kind])}
              >
                <span className="font-medium text-app">{line.key}</span>
                <pre className="mt-1 whitespace-pre-wrap break-all font-mono text-app">
                  {line.after ?? '—'}
                </pre>
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  )
}
