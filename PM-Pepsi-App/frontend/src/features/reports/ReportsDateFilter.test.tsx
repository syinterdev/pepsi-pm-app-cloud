/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest'
import '@/i18n'
import { ReportsDateFilter } from '@/features/reports/ReportsDateFilter'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

describe('ReportsDateFilter', () => {
  afterEach(() => cleanup())
  it('calls onSearch with from/to when นำไปใช้ is clicked', () => {
    const onSearch = vi.fn()
    render(
      <ReportsDateFilter
        initial={{ from: '2026-04-01', to: '2026-05-01' }}
        onSearch={onSearch}
      />,
    )

    fireEvent.click(screen.getByTestId('reports-date-apply'))

    expect(onSearch).toHaveBeenCalledWith({
      from: '2026-04-01',
      to: '2026-05-01',
      weeksBack: undefined,
    })
  })

  it('includes weeksBack when showWeeksBack is enabled', () => {
    const onSearch = vi.fn()
    render(
      <ReportsDateFilter
        initial={{ from: '2026-04-01', to: '2026-05-01', weeksBack: 10 }}
        showWeeksBack
        onSearch={onSearch}
      />,
    )

    fireEvent.click(screen.getByTestId('reports-date-apply'))

    expect(onSearch).toHaveBeenCalledWith({
      from: '2026-04-01',
      to: '2026-05-01',
      weeksBack: 10,
    })
  })
})
