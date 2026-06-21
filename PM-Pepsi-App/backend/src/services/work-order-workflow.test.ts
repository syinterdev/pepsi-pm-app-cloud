import { describe, expect, it } from 'vitest'
import { appendWorkflowSuffixToTitle, workflowSuffixFromSteps } from './work-order-workflow.js'

describe('work-order-workflow', () => {
  it('builds suffix from completed steps', () => {
    expect(
      workflowSuffixFromSteps([
        { step: 1, key: 'team', label: 't', done: true },
        { step: 2, key: 'assign', label: 'a', done: true },
        { step: 3, key: 'worktime', label: 'w', done: false },
      ]),
    ).toBe('12')
  })

  it('appends suffix to calendar title', () => {
    expect(appendWorkflowSuffixToTitle('WO1 / PM01', '12')).toBe('WO1 / PM01/12')
    expect(appendWorkflowSuffixToTitle('WO1 / PM01', '')).toBe('WO1 / PM01')
  })
})
