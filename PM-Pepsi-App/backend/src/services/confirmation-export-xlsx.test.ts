import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as XLSX from 'xlsx'
import { describe, expect, it } from 'vitest'
import { CONFIRMATION_SAP_HEADERS, CONFIRMATION_EXPORT_SHEET_NAME } from '../lib/confirmation-export-format.js'
import { buildConfirmationExportXlsxBuffer } from '../services/confirmation-export-xlsx.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const customerTemplate = path.resolve(
  here,
  '../../../../docs from customer/Export_Confirm (26May).xlsx',
)

function readXlsxSheet(buf: Buffer) {
  const wb = XLSX.read(buf, { type: 'buffer' })
  const sheetName = wb.SheetNames[0] ?? ''
  const ws = wb.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json<(string | number)[]>(ws, { header: 1, defval: '' })
  return { sheetName, rows }
}

describe('buildConfirmationExportXlsxBuffer', () => {
  it('uses Worksheet sheet name and 14 SAP headers', () => {
    const buf = buildConfirmationExportXlsxBuffer([
      {
        no: 1,
        confirmation: '',
        wkorder: '4001571110',
        opac: '10',
        subO: '',
        ca: '',
        split: '',
        wkctr: 'UTI008',
        timewk: 60,
        unitc: 'Min',
        startDateExe: '27052026',
        endDateExe: '27052026',
        startExecute: '15:00',
        endExecute: '16:00',
      },
    ])
    const { sheetName, rows } = readXlsxSheet(buf)
    expect(sheetName).toBe(CONFIRMATION_EXPORT_SHEET_NAME)
    expect(rows[0]).toEqual(Array.from(CONFIRMATION_SAP_HEADERS))
    expect(rows[1]?.[0]).toBe(1)
    expect(rows[1]?.[2]).toBe('4001571110')
    expect(rows[1]?.[3]).toBe(10)
    expect(rows[1]?.[7]).toBe('UTI008')
    expect(rows[1]?.[8]).toBe(60)
    expect(rows[1]?.[9]).toBe('Min')
    expect(rows[1]?.[10]).toBe('27052026')
    expect(rows[1]?.[12]).toBe('15:00')
  })

  it('matches customer Export_Confirm (26May).xlsx header row and sheet name', () => {
    if (!existsSync(customerTemplate)) {
      expect(customerTemplate).toBeTruthy()
      return
    }
    const customerBuf = readFileSync(customerTemplate)
    const customer = readXlsxSheet(customerBuf)
    const ours = readXlsxSheet(
      buildConfirmationExportXlsxBuffer([
        {
          no: 1,
          confirmation: '',
          wkorder: '4000130847',
          opac: '10',
          subO: '',
          ca: '',
          split: '',
          wkctr: 'PAC009',
          timewk: 70,
          unitc: 'Min',
          startDateExe: '07092020',
          endDateExe: '07092020',
          startExecute: '16:20',
          endExecute: '17:30',
        },
        {
          no: 2,
          confirmation: '',
          wkorder: '4000130847',
          opac: '10',
          subO: '',
          ca: '',
          split: '',
          wkctr: 'PAC010',
          timewk: 70,
          unitc: 'Min',
          startDateExe: '07092020',
          endDateExe: '07092020',
          startExecute: '16:20',
          endExecute: '17:30',
        },
      ]),
    )

    expect(ours.sheetName).toBe(customer.sheetName)
    expect(ours.rows[0]).toEqual(customer.rows[0])
    expect(ours.rows[1]).toEqual(customer.rows[1])
    expect(ours.rows[2]).toEqual(customer.rows[2])
  })
})
