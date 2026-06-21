/**
 * PlanningMultiAssign — UI "เพิ่ม assignee" หลายคนในคลิกเดียว
 *
 * Supports multi-select instead of one-by-one ที่ต้องคลิกทีละช่าง — เราขยายเป็น
 * batch upsert ผ่าน `POST /api/v1/work-orders/:id/planning/batch`.
 *
 * รับข้อมูล workcenters + รายชื่อที่ถูกจ่ายแล้ว (เพื่อ disable),
 * ภายในจัดการ search/selection/recent-result เอง.
 *
 * Parent ส่ง `onAssign(codes)` (เช่น mutateAsync) และ component จะแสดงสรุป
 * (เพิ่ม/ข้าม/ไม่พบ) หลังจาก resolve.
 */

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatPlanningAvailableLine, type PlanningWorkcenterHours } from '@/lib/planning-available-hours'
import { cn } from '@/lib/utils'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

export type PlanningMultiAssignWorkcenter = PlanningWorkcenterHours

export type PlanningMultiAssignResult = {
  assigned: string[]
  skipped: string[]
  notFound: string[]
}

type Props = {
  workcenters: PlanningMultiAssignWorkcenter[]
  /** รหัสที่จ่ายงานไปแล้ว — จะ disabled เป็นสีจาง */
  assignedCodes: string[]
  /** หมายเหตุ — ถ้าไม่ส่ง ใช้ uncontrolled (ค่าใน component นี้) */
  comment?: string
  onCommentChange?: (v: string) => void
  /** เรียก mutation จริงและคืนผลลัพธ์ — parent invalidate queries เอง */
  onAssign: (codes: string[]) => Promise<PlanningMultiAssignResult>
  /** เช่น mutation.isPending */
  submitting?: boolean
  className?: string
}

export function PlanningMultiAssign({
  workcenters,
  assignedCodes,
  comment: commentProp,
  onCommentChange,
  onAssign,
  submitting = false,
  className,
}: Props) {
  const { t } = useTranslation(['scheduling', 'common'])
  const assignedSet = useMemo(() => new Set(assignedCodes.map((c) => c.trim())), [assignedCodes])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [innerComment, setInnerComment] = useState('')
  const [lastResult, setLastResult] = useState<PlanningMultiAssignResult | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const commentControlled = typeof onCommentChange === 'function'
  const comment = commentControlled ? (commentProp ?? '') : innerComment

  const q = search.trim().toLowerCase()
  const filtered = useMemo(() => {
    if (!q) return workcenters
    return workcenters.filter(
      (w) =>
        w.wkctr.toLowerCase().includes(q) ||
        (w.displayName ?? '').toLowerCase().includes(q),
    )
  }, [workcenters, q])

  const availableInFilter = useMemo(
    () => filtered.filter((w) => !assignedSet.has(w.wkctr)),
    [filtered, assignedSet],
  )

  const allSelectedInView = availableInFilter.length > 0 && availableInFilter.every((w) => selected.has(w.wkctr))

  function toggle(code: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(code)) next.delete(code)
      else next.add(code)
      return next
    })
    setLastResult(null)
    setErrorMsg(null)
  }

  function toggleAllInView() {
    setSelected((prev) => {
      const next = new Set(prev)
      if (allSelectedInView) {
        for (const w of availableInFilter) next.delete(w.wkctr)
      } else {
        for (const w of availableInFilter) next.add(w.wkctr)
      }
      return next
    })
    setLastResult(null)
    setErrorMsg(null)
  }

  function clearSelection() {
    setSelected(new Set())
    setLastResult(null)
    setErrorMsg(null)
  }

  async function handleSubmit() {
    if (submitting || selected.size === 0) return
    setLastResult(null)
    setErrorMsg(null)
    try {
      const codes = Array.from(selected)
      const res = await onAssign(codes)
      setLastResult(res)
      // ล้างเฉพาะคนที่สำเร็จ + คนที่ "ข้าม" (มีอยู่แล้ว) — ส่วน not-found ยังคงไว้ให้เห็นว่าผิดพลาด
      setSelected((prev) => {
        const next = new Set(prev)
        for (const c of res.assigned) next.delete(c)
        for (const c of res.skipped) next.delete(c)
        return next
      })
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : t('filters.genericError'))
    }
  }

  const selectedArr = Array.from(selected)
  const selectedCount = selectedArr.length

  return (
    <div className={`rounded-card border border-indigo-200 bg-indigo-50/40 p-3 ${className ?? ''}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium text-indigo-900">{t('planning.multiTitle')}</p>
          <p className="text-xs text-indigo-900/70">{t('planning.multiDesc')}</p>
        </div>
        <span className="rounded-full bg-indigo-600 px-2 py-1 text-xs font-medium text-white tabular-nums">
          {t('planning.selectedCount', { count: selectedCount })}
        </span>
      </div>

      {!commentControlled ? (
        <div className="mt-3 space-y-1">
          <Label htmlFor="multi-plan-comment">{t('planning.commentShared')}</Label>
          <Input
            id="multi-plan-comment"
            value={comment}
            onChange={(e) => setInnerComment(e.target.value)}
            placeholder="pwcomment"
          />
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('planning.searchWkctr')}
          className="max-w-[260px]"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={toggleAllInView}
          disabled={availableInFilter.length === 0}
        >
          {allSelectedInView ? t('planning.deselectAllInView') : t('planning.selectAllInView')}
        </Button>
        {selectedCount > 0 ? (
          <Button type="button" size="sm" variant="ghost" onClick={clearSelection}>
            {t('planning.clearSelection')}
          </Button>
        ) : null}
      </div>

      {selectedCount > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedArr.map((c) => {
            const w = workcenters.find((x) => x.wkctr === c)
            return (
              <button
                key={c}
                type="button"
                onClick={() => toggle(c)}
                className="inline-flex items-center gap-1 rounded-full border border-indigo-300 app-surface-panel px-2 py-1 text-xs text-indigo-900 hover:bg-[color-mix(in_srgb,var(--app-accent)_10%,var(--app-surface))] dark:text-indigo-200"
                title={t('planning.clickToRemove')}
              >
                <span className="font-mono">{c}</span>
                {w?.displayName && w.displayName !== c ? <span className="text-indigo-900/70">— {w.displayName}</span> : null}
                <span aria-hidden className="text-indigo-700">×</span>
              </button>
            )
          })}
        </div>
      ) : null}

      <div className="mt-3 max-h-64 overflow-auto rounded border border-indigo-200 app-surface-panel">
        {filtered.length === 0 ? (
          <p className="px-3 py-4 text-caption">{t('planning.noWkctrMatch')}</p>
        ) : (
          <ul className="divide-y divide-[var(--app-border)]">
            {filtered.map((w) => {
              const already = assignedSet.has(w.wkctr)
              const checked = selected.has(w.wkctr)
              return (
                <li key={w.wkctr} className="flex items-center justify-between gap-2 px-3 py-2">
                  <label className={`flex flex-1 cursor-pointer items-start gap-2 ${already ? 'cursor-not-allowed opacity-50' : ''}`}>
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 shrink-0 accent-indigo-600"
                      checked={checked}
                      disabled={already}
                      onChange={() => toggle(w.wkctr)}
                    />
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <span className="font-mono text-body-sm text-app">{w.wkctr}</span>
                        {w.displayName && w.displayName !== w.wkctr ? (
                          <span className="text-caption">— {w.displayName}</span>
                        ) : null}
                      </span>
                      {(() => {
                        const line = formatPlanningAvailableLine(w)
                        return line ? (
                          <span
                            className={cn(
                              'mt-0.5 block text-[10px] font-medium',
                              w.availableHours != null && w.availableHours <= 0
                                ? 'app-tone-danger-text'
                                : 'text-indigo-900/75',
                            )}
                          >
                            {line}
                          </span>
                        ) : null
                      })()}
                    </span>
                  </label>
                  {already ? (
                    <span className="app-tone-success-badge rounded px-2 py-1 text-badge font-medium">
                      {t('shared.assigned')}
                    </span>
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-app-muted">
          {t('planning.stats', {
            total: workcenters.length,
            assigned: assignedSet.size,
            available: workcenters.length - assignedSet.size,
          })}
        </p>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || selectedCount === 0}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          {submitting
            ? t('planning.submitting')
            : t('planning.addAssignee', { count: selectedCount })}
        </Button>
      </div>

      {lastResult ? (
        <div className="mt-3 rounded border border-indigo-200 app-surface-panel p-2 text-xs text-app">
          <p>
            {t('planning.resultSummary', {
              added: lastResult.assigned.length,
              skipped: lastResult.skipped.length,
              notFound: lastResult.notFound.length,
            })}
          </p>
          {lastResult.skipped.length > 0 ? (
            <p className="mt-1">
              {t('planning.skippedList', { list: lastResult.skipped.join(', ') })}
            </p>
          ) : null}
          {lastResult.notFound.length > 0 ? (
            <p className="app-tone-danger-text mt-1">
              {t('planning.notFoundList', { list: lastResult.notFound.join(', ') })}
            </p>
          ) : null}
        </div>
      ) : null}
      {errorMsg ? (
        <p className="app-tone-danger-text mt-2 text-xs">{errorMsg}</p>
      ) : null}
    </div>
  )
}
