import { describe, expect, it } from 'vitest'
import { getWorkOrderModalDetail } from './work-orders.js'

type QueryCall = { text: string; params?: unknown[] }

function createModalDetailPoolMock() {
  const calls: QueryCall[] = []
  let tasklistParam: unknown = null

  const pool = {
    async query(text: string, params?: unknown[]) {
      calls.push({ text, params })

      if (text.includes('FROM app.tbiw37n i') && text.includes('JOIN app.view_order')) {
        return {
          rows: [
            {
              idiw37: 220,
              wkorder: '4001560529',
              mntplan: '342596',
              wktype: 'ZB02',
              equipment: 'EQ1',
              equdescrip: 'SSN Dust Collector',
              functionalloc: '7151-P17',
              funcdescrip: 'FACTORY 1 SSN',
              untime: '2',
              syst: 'CRTD',
              bscstart: 1780246800,
              actfinish: 1780333200,
              systemstatus: 'CRTD',
              wkctr: 'ME01',
              operationshorttext: 'PM',
              ostdescription: 'PM job',
              opac: '0010',
              work: 60,
              actwork: 0,
              team: 'A',
              mat: 'MAT1',
              cday: 1780246800,
              wkstcolor: '#22c55e',
              mpcount: 0,
              reasoncode: null,
              mwkctr: null,
              resoncom: null,
              reasonname: null,
            },
          ],
        }
      }

      if (text.includes('FROM app.tbtasklist tl') && text.includes('WHERE tl.mntplan = $1')) {
        tasklistParam = params?.[0]
        return {
          rows: [
            {
              tasklist: '596',
              legacy: 'P17-HR-ME2',
              machine: 'SSN Dust Collector',
              pmlist: 'เปลี่ยน Bearing เพลาขับ',
              machinestatus: 1,
              pmman: 2,
              pmday: 4,
              mat: '',
              matdescrip: null,
              mpoint: null,
              ment: null,
              idzone: 'P17',
              zone: 'Zone P17',
              idwkctrtype: 'ME',
              wkctrtype: 'ME',
              idproductline: null,
              prolinedescrip: null,
            },
          ],
        }
      }

      if (text.includes('FROM app.tbmainteanance')) return { rows: [] }
      if (text.includes('FROM app.tblineschdul')) return { rows: [] }
      if (text.includes('FROM app.tbmaterial')) return { rows: [] }
      if (text.includes('FROM app.tbwkctrgroup')) return { rows: [] }
      if (text.includes('FROM app.tbworkcenter wc') && text.includes('userrole')) {
        return {
          rows: [
            {
              wkctr: 'PAC001',
              titlewkctr: 'Mr.',
              namewkctr: 'Somchai',
              surnamewkctr: 'Tech',
              cat: 'A',
              idwkctrtype: 'EE',
              wkctrtype_label: 'EE',
            },
          ],
        }
      }
      if (text.includes('FROM app.tbworkcenter') && text.includes('ORDER BY')) return { rows: [] }
      if (text.includes('FROM app.tbplangingwork mp')) return { rows: [] }
      if (text.includes('FROM app.tbwo_pm_execution')) return { rows: [] }
      if (text.includes('FROM app.tbwo_pm_note_entry')) return { rows: [] }
      if (text.includes('FROM app.tbwo_pm_reading')) return { rows: [] }
      if (text.includes('FROM app.tbwo_pm_page2')) return { rows: [] }
      if (text.includes('FROM app.tbmanhours')) return { rows: [] }
      if (text.includes('FROM app.view_planwork')) return { rows: [] }

      return { rows: [] }
    },
  }

  return { pool, calls, getTasklistParam: () => tasklistParam }
}

describe('getWorkOrderModalDetail taskList', () => {
  it('loads task list by mntplan (not wkorder) and maps legacy + displayLine', async () => {
    const mock = createModalDetailPoolMock()
    const result = await getWorkOrderModalDetail(mock.pool as never, '220', {}, undefined)

    expect(result).not.toBeNull()
    expect(result!.planning.closeWoAccess).toEqual({
      canView: false,
      canWrite: false,
      reason: 'not_technician',
    })
    expect(mock.getTasklistParam()).toBe('342596')
    expect(mock.calls.some((c) => c.text.includes('WHERE tl.mntplan = $1'))).toBe(true)
    expect(mock.calls.every((c) => !c.text.includes('WHERE tl.wkorder'))).toBe(true)

    expect(result!.taskList.mntplan).toBe('342596')
    expect(result!.taskList.summary?.legacy).toBe('P17-HR-ME2')
    expect(result!.taskList.summary?.tasklist).toBe('596')
    expect(result!.taskList.items).toHaveLength(1)
    expect(result!.taskList.items[0]!.displayLine).toBe(
      'SSN Dust Collector — เปลี่ยน Bearing เพลาขับ',
    )
    expect(result!.woHeader.wkorder).toBe('4001560529')
    expect(result!.woHeader.headerShortText).toBe('342596')
    expect(result!.woHeader.descriptionLine1).toBe('FACTORY 1 SSN')
    expect(result!.woHeader.descriptionLine2).toBe('SSN Dust Collector')
    expect(result!.woHeader.man).toBe('2')
    expect(result!.woHeader.machineRunStatus).toBe('หยุด')
    expect(result!.woHeader.operationLongText).toHaveLength(1)
    expect(result!.taskList.items[0]!.pmman).toBe(2)
    expect(result!.taskList.items[0]!.pmday).toBe(4)
    expect(result!.dataReadiness).toEqual({
      mntplan: '342596',
      tasklistPublished: true,
      taskCount: 1,
      currentTaskCount: 0,
      vibrationTaskCount: 0,
      readingCount: 0,
    })
    expect(result!.planning.workcenters.some((w) => w.wkctr === 'ADMIN01')).toBe(false)
    expect(result!.planning.workcenters[0]?.shiftTags).toContain('AA')
    expect(result!.page2Form).toEqual({
      activityReportWkctr: null,
      completedByName: null,
      closedDate: null,
      signatureText: null,
      signatureAt: null,
      signatureAction: null,
      equipmentOk: null,
    })
  })
})
