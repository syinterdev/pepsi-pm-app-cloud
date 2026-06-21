import { describe, expect, it } from 'vitest'
import {
  SUMMARY_WEEKLY_PM_WKTYPES,
  SUMMARY_WEEKLY_REACTIVE_WKTYPES,
  sqlWktypeInList,
} from './reports-wktype.js'

describe('reports-wktype', () => {
  it('PM uses ZB02 per Eng Utilization 2026', () => {
    expect(SUMMARY_WEEKLY_PM_WKTYPES).toEqual(['ZB02'])
    expect(sqlWktypeInList(SUMMARY_WEEKLY_PM_WKTYPES)).toBe("wktype IN ('ZB02')")
  })

  it('Reactive uses ZB01 and ZB05', () => {
    expect(SUMMARY_WEEKLY_REACTIVE_WKTYPES).toEqual(['ZB01', 'ZB05'])
    expect(sqlWktypeInList(SUMMARY_WEEKLY_REACTIVE_WKTYPES)).toBe(
      "wktype IN ('ZB01', 'ZB05')",
    )
  })
})
