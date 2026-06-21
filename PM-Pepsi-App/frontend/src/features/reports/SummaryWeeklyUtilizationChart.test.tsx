/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest'
import { SummaryWeeklyUtilizationChart } from '@/features/reports/SummaryWeeklyUtilizationChart'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('react-chartjs-2', () => ({
  Bar: () => <div data-testid="summary-weekly-bar-chart" />,
}))

describe('SummaryWeeklyUtilizationChart', () => {
  it('renders chart placeholder for utilization bars', () => {
    render(
      <SummaryWeeklyUtilizationChart
        items={[
          { idwkctr: 'HR001', wkctr: 'PAC001', summaryHours: 40 },
          { idwkctr: 'HR002', wkctr: 'PAC002', summaryHours: 32 },
        ]}
        variant="chart2"
      />,
    )

    expect(screen.getByTestId('summary-weekly-bar-chart')).toBeInTheDocument()
  })
})
