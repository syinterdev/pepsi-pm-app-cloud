import { describe, expect, it } from 'vitest'
import {
  buildConfirmationExportSapCsv,
  confirmationSapCsvFilename,
} from '../services/confirmation-export-csv.js'

describe('buildConfirmationExportSapCsv', () => {
  it('emits SAP headers and DDMMYYYY / HH:mm columns', () => {
    const csv = buildConfirmationExportSapCsv([
      {
        no: 1,
        confirmation: '',
        wkorder: '10001234',
        opac: '0010',
        subO: '',
        ca: '',
        split: '',
        wkctr: 'PAC007',
        timewk: 2.5,
        unitc: 'H',
        startDateExe: '21052026',
        endDateExe: '21052026',
        startExecute: '08:00',
        endExecute: '10:30',
      },
    ])
    expect(csv.startsWith('\ufeff')).toBe(true)
    const lines = csv.replace(/^\ufeff/, '').trimEnd().split('\r\n')
    expect(lines[0]).toContain('Comfirmation')
    expect(lines[0]).toContain('Start date Exe.')
    expect(lines[1]).toBe(
      '1,,10001234,0010,,,,PAC007,2.5,H,21052026,21052026,08:00,10:30',
    )
  })

  it('quotes cells with commas', () => {
    const csv = buildConfirmationExportSapCsv([
      {
        no: 1,
        confirmation: '',
        wkorder: 'WO,1',
        opac: '',
        subO: '',
        ca: '',
        split: '',
        wkctr: '',
        timewk: 0,
        unitc: '',
        startDateExe: '',
        endDateExe: '',
        startExecute: '',
        endExecute: '',
      },
    ])
    expect(csv).toContain('"WO,1"')
  })
})

describe('confirmationSapCsvFilename', () => {
  it('uses CONFIRM_OUT timestamp pattern', () => {
    expect(
      confirmationSapCsvFilename(new Date('2026-05-21T14:05:09')),
    ).toBe('CONFIRM_OUT_20260521_140509.csv')
  })
})
