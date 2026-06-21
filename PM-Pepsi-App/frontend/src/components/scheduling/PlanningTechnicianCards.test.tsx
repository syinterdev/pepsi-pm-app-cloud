/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest'
import '@/i18n'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PlanningTechnicianCards } from './PlanningTechnicianCards'

const workcenters = [
  { wkctr: 'PAC001', displayName: 'Somchai Technician', craftTags: ['EE'] as ('EE' | 'UT')[] },
  { wkctr: 'PAC002', displayName: 'Assigned Person', shiftTags: ['AA'] as ('AA' | 'BB')[] },
  { wkctr: 'ADMIN01', displayName: 'Should not appear in pool' },
]

describe('PlanningTechnicianCards', () => {
  it('multi-selects cards and batch assigns', async () => {
    const onBatchAssign = vi.fn().mockResolvedValue({
      assigned: ['PAC001'],
      skipped: [],
      notFound: [],
    })

    render(
      <PlanningTechnicianCards
        workcenters={workcenters}
        assignedCodes={['PAC002']}
        onBatchAssign={onBatchAssign}
      />,
    )

    expect(screen.getByText('Assigned')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /PAC001/i }))
    fireEvent.click(screen.getByRole('button', { name: /Assign selected \(1\)/i }))

    await waitFor(() => expect(onBatchAssign).toHaveBeenCalledWith(['PAC001']))
  })
})
