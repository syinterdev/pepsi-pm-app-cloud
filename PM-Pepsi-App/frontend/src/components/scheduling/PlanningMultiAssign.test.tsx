/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest'
import '@/i18n'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PlanningMultiAssign } from './PlanningMultiAssign'

const workcenters = [
  { wkctr: 'PAC001', displayName: 'Somchai Technician' },
  { wkctr: 'PAC002', displayName: 'Assigned Person' },
  { wkctr: 'PAC003', displayName: 'Planner Support' },
]

describe('PlanningMultiAssign', () => {
  it('searches, blocks already assigned users, selects visible users, and submits selected codes', async () => {
    const onAssign = vi.fn().mockResolvedValue({
      assigned: ['PAC001'],
      skipped: [],
      notFound: [],
    })

    render(
      <PlanningMultiAssign
        workcenters={workcenters}
        assignedCodes={['PAC002']}
        comment="Batch comment"
        onCommentChange={vi.fn()}
        onAssign={onAssign}
      />,
    )

    expect(screen.getByText('Assigned')).toBeInTheDocument()
    expect(screen.getByLabelText(/PAC002/)).toBeDisabled()

    fireEvent.change(screen.getByPlaceholderText('Search wkctr or name…'), {
      target: { value: 'Somchai' },
    })
    expect(screen.getByText('PAC001')).toBeInTheDocument()
    expect(screen.queryByText('PAC003')).not.toBeInTheDocument()

    fireEvent.click(screen.getByText('Select all in view'))
    fireEvent.click(screen.getByRole('button', { name: 'Add Assignee (1)' }))

    await waitFor(() => expect(onAssign).toHaveBeenCalledWith(['PAC001']))
    expect(await screen.findByText(/Summary — added 1/)).toBeInTheDocument()
  })

  it('renders uncontrolled comment input when parent does not control comment state', () => {
    render(
      <PlanningMultiAssign
        workcenters={workcenters}
        assignedCodes={[]}
        onAssign={vi.fn()}
      />,
    )

    const input = screen.getByLabelText('Comment (shared for all)')
    fireEvent.change(input, { target: { value: 'same comment' } })

    expect(input).toHaveValue('same comment')
  })
})
