/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest'
import '@/i18n'
import { ManhourSummaryDialog } from '@/components/scheduling/ManhourSummaryDialog'
import { postBacklogManhourSummary } from '@/lib/api-public'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api-public', () => ({
  postBacklogManhourSummary: vi.fn(),
}))

function renderDialog(props: {
  open?: boolean
  fromDate?: string
  toDate?: string
} = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <ManhourSummaryDialog
        open={props.open ?? true}
        onOpenChange={vi.fn()}
        fromDate={props.fromDate ?? '2026-05-01'}
        toDate={props.toDate ?? '2026-05-01'}
      />
    </QueryClientProvider>,
  )
}

describe('ManhourSummaryDialog', () => {
  it('shows Man Hours Date header and plan/action summary from API', async () => {
    vi.mocked(postBacklogManhourSummary).mockResolvedValue({
      fromDate: '2026-05-01',
      toDate: '2026-05-01',
      plannedMinutes: 480,
      plannedHours: 8,
      actualMinutes: 60,
      actualHours: 1,
      totalOrders: 1,
      completionCount: 0,
      completionPercent: 0,
      byWkzb: [{ code: 'ZB01', label: 'ZB01', count: 1 }],
      rows: [
        {
          wkorder: '1001',
          wktype: 'ZB01',
          syst: 'REL',
          work: 8,
          actwork: 1,
          unit: 'H',
          operationshorttext: 'Test WO',
        },
      ],
    })

    renderDialog()

    expect(await screen.findByText(/Man Hours/)).toBeInTheDocument()
    expect(await screen.findByText(/Man Hour Plan/)).toBeInTheDocument()
    expect(screen.getByText(/480/)).toBeInTheDocument()
    expect(screen.getByText('1001 / ZB01')).toBeInTheDocument()
    expect(postBacklogManhourSummary).toHaveBeenCalledWith({
      fromDate: '2026-05-01',
      toDate: '2026-05-01',
    })
  })

  it('shows empty state when no work orders on selected day', async () => {
    vi.mocked(postBacklogManhourSummary).mockResolvedValue({
      fromDate: '2026-05-01',
      toDate: '2026-05-01',
      plannedMinutes: 0,
      plannedHours: 0,
      actualMinutes: 0,
      actualHours: 0,
      totalOrders: 0,
      completionCount: 0,
      completionPercent: 0,
      byWkzb: [],
      rows: [],
    })

    renderDialog()

    expect(
      await screen.findByText(/No work orders for the selected date/),
    ).toBeInTheDocument()
  })

  it('does not fetch when dialog is closed', async () => {
    vi.mocked(postBacklogManhourSummary).mockClear()
    renderDialog({ open: false })
    await waitFor(() => expect(postBacklogManhourSummary).not.toHaveBeenCalled())
  })
})
