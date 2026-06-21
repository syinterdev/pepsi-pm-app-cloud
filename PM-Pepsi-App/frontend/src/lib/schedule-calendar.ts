import type { EventInput } from '@fullcalendar/core'
import type { CalendarEventHoverDetail } from '@/api/schemas'
import { calendarEventSurfaceClasses } from '@/lib/calendar-event-classes'

export type ScheduleCalendarEvent = {
  id: string
  date: string
  title: string
  color: string
  orderId?: string
  description?: string
  hoverDetail?: CalendarEventHoverDetail
  /** false = แผนเขียว TECO/ปิดแล้ว — ห้าม drag */
  canMovePlan?: boolean
  syst?: string
  pmPhase?: 'create' | 'rel' | 'confirm'
  pmExecutionStatus?: 'in_progress' | 'done' | 'closed'
  activityCode?: string
  moveCount?: number
  /** ศูนย์งาน — Backlog note บนปฏิทิน */
  wkctr?: string
  workHours?: number
  planStartIso?: string
  planEndIso?: string
  moveReasonRequired?: boolean
  tecoBellAlert?: boolean
  displayStatus?: 'in_progress' | 'overdue' | 'moved' | 'completed'
  team?: 'A' | 'B' | 'EE' | 'UT'
  pipelineStatus?: 'unassigned' | 'assigned' | 'in_progress' | 'closed'
  pipelineBadges?: Array<
    'ack_pending' | 'ack_done' | 'qc_pending' | 'qc_approved' | 'qc_rejected'
  >
}

export function toFullCalendarEvents(items: ScheduleCalendarEvent[]): EventInput[] {
  return items.map((e) => {
    const canMove = e.canMovePlan !== false
    return {
      id: e.id,
      title: e.title,
      start: e.date,
      allDay: true,
      backgroundColor: e.color,
      borderColor: e.color,
      startEditable: canMove,
      extendedProps: {
        orderId: e.orderId,
        description: e.description,
        hoverDetail: e.hoverDetail,
        canMovePlan: canMove,
        syst: e.syst,
        pmPhase: e.pmPhase,
        pmExecutionStatus: e.pmExecutionStatus,
        activityCode: e.activityCode,
        moveCount: e.moveCount,
        workHours: e.workHours,
        planStartIso: e.planStartIso,
        planEndIso: e.planEndIso,
        moveReasonRequired: e.moveReasonRequired,
        tecoBellAlert: e.tecoBellAlert,
        displayStatus: e.displayStatus,
        team: e.team,
        pipelineStatus: e.pipelineStatus,
        pipelineBadges: e.pipelineBadges,
        surfaceClasses: calendarEventSurfaceClasses(e),
      },
    }
  })
}

export function eventFromClickArg(arg: {
  event: {
    id: string
    title: string
    start: Date | null
    backgroundColor?: string
    extendedProps: Record<string, unknown>
  }
}): ScheduleCalendarEvent | null {
  const start = arg.event.start
  if (!start) return null
  const y = start.getFullYear()
  const m = String(start.getMonth() + 1).padStart(2, '0')
  const d = String(start.getDate()).padStart(2, '0')
  const orderId = arg.event.extendedProps.orderId
  const description = arg.event.extendedProps.description
  const props = arg.event.extendedProps
  const canMovePlan = props.canMovePlan
  const syst = props.syst
  const pmPhase = props.pmPhase
  const pmExecutionStatus = props.pmExecutionStatus
  return {
    id: arg.event.id,
    date: `${y}-${m}-${d}`,
    title: arg.event.title,
    color: arg.event.backgroundColor ?? '#003366',
    orderId: typeof orderId === 'string' ? orderId : undefined,
    description: typeof description === 'string' ? description : undefined,
    canMovePlan: canMovePlan !== false,
    syst: typeof syst === 'string' ? syst : undefined,
    pmPhase:
      pmPhase === 'create' || pmPhase === 'rel' || pmPhase === 'confirm' ? pmPhase : undefined,
    pmExecutionStatus:
      pmExecutionStatus === 'in_progress' ||
      pmExecutionStatus === 'done' ||
      pmExecutionStatus === 'closed'
        ? pmExecutionStatus
        : undefined,
    moveReasonRequired:
      props.moveReasonRequired === true
        ? true
        : props.moveReasonRequired === false
          ? false
          : undefined,
    tecoBellAlert: props.tecoBellAlert === true ? true : undefined,
    displayStatus:
      props.displayStatus === 'in_progress' ||
      props.displayStatus === 'overdue' ||
      props.displayStatus === 'moved' ||
      props.displayStatus === 'completed'
        ? props.displayStatus
        : undefined,
    team:
      props.team === 'A' || props.team === 'B' || props.team === 'EE' || props.team === 'UT'
        ? props.team
        : undefined,
  }
}
