/** ระฆังเตือน TECO — ติดมุมซ้ายบนของ block ปฏิทิน */
export function mountCalendarTecoBell(el: HTMLElement): void {
  if (el.querySelector('.pm-cal-event-bell')) return
  el.classList.add('pm-cal-event--has-bell')
  const bell = document.createElement('span')
  bell.className = 'pm-cal-event-bell'
  bell.setAttribute('aria-hidden', 'true')
  bell.textContent = '🔔'
  bell.title = 'TECO ใน SAP แล้ว แต่ยังไม่ปิดงาน/ยืนยันชั่วโมงในระบบ'
  el.prepend(bell)
}
