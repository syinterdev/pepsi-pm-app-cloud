import { describe, expect, it } from 'vitest'
import {
  buildOperationText,
  buildOperationTextFromTask,
  buildWoPmFormHeader,
  formatMachineRunStatus,
  formatManValue,
  formatSapPrintDate,
} from './wo-pm-form-header.js'

const sampleRow = {
  wkorder: '4001565681',
  mntplan: '345969',
  functionalloc: 'PI-TH-7151-FA-F1-P1',
  funcdescrip: 'FACTORY 1 PC50MZ',
  mat: '10049361',
  equipment: '10049361',
  equdescrip: 'Oil Heating Unit',
  ostdescription: 'Oil Heating Zone',
  operationshorttext: '369039 & P14-NI-EE',
  wkctr: 'PRO002',
  bscstart: Math.floor(new Date('2026-05-26T00:00:00Z').getTime() / 1000),
  actfinish: Math.floor(new Date('2026-05-26T00:00:00Z').getTime() / 1000),
  untime: null,
  systemstatus: null,
  syst: 'REL',
  opac: '0010',
  wktype: 'ZB02',
  team: null,
}

const sampleTask = {
  mat: '001',
  matdescrip: 'Inspection & Cond. Monitoring',
  idwkctrtype: 'EE',
  wkctrtype: 'Electrical',
  legacy: 'P14-NI-EE',
  zone: 'Oil Heating Zone',
  machine: 'Oil Heating Unit',
  pmlist: 'ตรวจเช็คกระแส 3 เฟส',
  pmman: 2,
  machinestatus: 1,
  pmday: 2,
}

describe('wo-pm-form-header', () => {
  it('formats SAP print date', () => {
    expect(formatSapPrintDate('2026-05-26')).toBe('26.05.2026')
  })

  it('formats Man and machine run status', () => {
    expect(formatManValue(2)).toBe('2')
    expect(formatManValue(null)).toBe('—')
    expect(formatMachineRunStatus(1)).toBe('หยุด')
    expect(formatMachineRunStatus(0)).toBe('เดิน')
    expect(formatMachineRunStatus(null)).toBe('—')
    expect(formatMachineRunStatus(undefined)).toBe('—')
  })

  it('builds operation text from Master Plan task', () => {
    expect(buildOperationTextFromTask(sampleTask)).toBe('2W - EE Oil Heating Zone (P14-NI-EE)')
  })

  it('maps IW37N + Master Plan fields for PM form header', () => {
    const h = buildWoPmFormHeader(sampleRow, {
      firstTask: sampleTask,
      allTasks: [sampleTask],
    })
    expect(h.wkorder).toBe('4001565681')
    expect(h.functionalLocation).toBe('PI-TH-7151-FA-F1-P1')
    expect(h.equipment).toBe('10049361')
    expect(h.descriptionLine1).toBe('FACTORY 1 PC50MZ')
    expect(h.descriptionLine2).toBe('Oil Heating Unit')
    expect(h.headerShortText).toBe('345969')
    expect(h.man).toBe('2')
    expect(h.machineRunStatus).toBe('หยุด')
    expect(h.techId).toBe('2')
    expect(h.sysCond).toBe('หยุด')
    expect(h.workCentre).toBe('')
    expect(h.endDate).toBe('')
    expect(h.priority).toBe('')
    expect(h.description).toBe('')
    expect(h.objectList).toBe('')
    expect(h.operationNumber).toBe('0010')
    expect(h.operationWorkCentre).toBe('PRO002')
    expect(h.operationText).toBe('2W - EE Oil Heating Zone (P14-NI-EE)')
    expect(h.operationLongText).toEqual([
      { lineNo: 1, machine: 'Oil Heating Unit', pmlist: 'ตรวจเช็คกระแส 3 เฟส' },
    ])
    expect(h.printMetaLine).toContain('26.05.2026')
  })

  it('shows em dash for Man and machine run status when no tasklist', () => {
    const h = buildWoPmFormHeader(sampleRow)
    expect(h.man).toBe('—')
    expect(h.machineRunStatus).toBe('—')
    expect(h.sysCond).toBe('—')
    expect(h.operationLongText).toEqual([])
  })

  it('builds legacy IW37N operation text helper', () => {
    expect(
      buildOperationText(
        {
          wkorder: '1',
          functionalloc: null,
          mat: null,
          equipment: null,
          equdescrip: null,
          ostdescription: 'Oil Heating Zone',
          operationshorttext: '369039 & P14-NI-EE',
          wkctr: null,
          bscstart: null,
          actfinish: null,
          untime: null,
          systemstatus: null,
          syst: null,
          opac: null,
          wktype: 'ZB02',
          team: null,
        },
        'P14',
      ),
    ).toBe('2M - EE Oil Heating Zone (P14)')
  })
})
