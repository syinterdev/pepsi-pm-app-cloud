import type { GenericSheetSection } from '@/features/master-plan/master-plan-grid-layout'
import { MasterPlanColumnHeader } from '@/features/master-plan/MasterPlanColumnHeader'
import { useTranslation } from 'react-i18next'

type MasterPlanSummaryGridProps = {
  sections: GenericSheetSection[]
}

function sectionBannerRow(row: string[]): string | null {
  const filled = row.map((c) => c.trim()).filter(Boolean)
  if (filled.length === 1) return filled[0]
  return null
}

function SummarySectionTable({ section }: { section: GenericSheetSection }) {
  let headerRowIndex = 0
  const banner = sectionBannerRow(section.rows[0] ?? [])
  if (banner) headerRowIndex = 1

  const headerCells = section.rows[headerRowIndex] ?? []
  const dataRows = section.rows.slice(headerRowIndex + 1)

  return (
    <div className="min-w-[14rem] flex-1 overflow-hidden rounded-lg border border-[#2f5597]/30">
      {banner ? (
        <div className="bg-[#2f5597] px-3 py-2 text-center text-xs font-bold text-white">{banner}</div>
      ) : null}
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-[#2f5597] text-white">
            {headerCells.map((cell, idx) => (
              <th
                key={`${section.startCol}-h-${idx}`}
                className="border border-[#2f5597]/60 px-2 py-1.5 text-left text-[11px] font-semibold text-white"
              >
                <MasterPlanColumnHeader column={cell} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataRows.map((row, rowIdx) => {
            const hasContent = row.some((c) => c.trim())
            if (!hasContent) return null
            const isTotal = row.some((c) => /^\d+\s+maintenance plan$/i.test(c.trim()))
            return (
              <tr
                key={`${section.startCol}-r-${rowIdx}`}
                className={`border-[#b4c6e7] ${
                  isTotal
                    ? 'bg-[#dae3f3] font-semibold text-[#1f3864]'
                    : rowIdx % 2 === 1
                      ? 'bg-[#f5f8fc]'
                      : 'bg-white'
                }`}
              >
                {row.map((cell, cellIdx) => (
                  <td
                    key={`${section.startCol}-c-${rowIdx}-${cellIdx}`}
                    className="border border-[#b4c6e7] px-2 py-1 align-top text-[11px] text-[#1f1f1f]"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export function MasterPlanSummaryGrid({ sections }: MasterPlanSummaryGridProps) {
  const { t } = useTranslation('masterData')

  if (sections.length === 0) {
    return (
      <p className="px-2 py-6 text-center text-xs text-app-muted">{t('panel.empty')}</p>
    )
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
      {sections.map((section) => (
        <SummarySectionTable key={section.startCol} section={section} />
      ))}
    </div>
  )
}
