import { afterEach, describe, expect, it } from 'vitest'
import { isModuleHandoffEnabled, isPortalEnabled } from './portal-enabled.js'

describe('portal-enabled', () => {
  afterEach(() => {
    delete process.env.PORTAL_ENABLED
    delete process.env.MODULE_HANDOFF_ENABLED
  })

  it('enables portal by default', () => {
    expect(isPortalEnabled()).toBe(true)
  })

  it('disables portal when PORTAL_ENABLED=false', () => {
    process.env.PORTAL_ENABLED = 'false'
    expect(isPortalEnabled()).toBe(false)
  })

  it('enables handoff by default', () => {
    expect(isModuleHandoffEnabled()).toBe(true)
  })

  it('disables handoff when MODULE_HANDOFF_ENABLED=false', () => {
    process.env.MODULE_HANDOFF_ENABLED = 'false'
    expect(isModuleHandoffEnabled()).toBe(false)
  })
})
