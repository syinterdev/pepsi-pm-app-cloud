# ลำดับที่ 12 — Reports & สรุปรายสัปดาห์

**สถานะรวม:** **เสร็จ (แกน + §3)** — API + Chart.js + filter ช่วงวันที่ 2026-05-19  
**Stack เต็มรูปแบบ ([skills.md](../../skills.md)):** ยังไม่มี — ดู [00-stack-target.md](00-stack-target.md)
**Route:** `/reports`, `/summary-weekly`  
**Checklist หลัก:** `W_summary_weekly*.php`, KPI ใน `skills.md` (Chart.js)

---

## ทำแล้ว

- [x] **`GET /api/v1/reports/kpi`** — 2026-05-19
  - [`reports.ts`](../../PM-Pepsi-App/backend/src/services/reports.ts): แนวโน้มรายสัปดาห์ `utilization` (Confirm/HR manhour) + `backlogHours` (open WO จาก `view_order`)
  - [`ReportsPage.tsx`](../../PM-Pepsi-App/frontend/src/features/reports/ReportsPage.tsx): Chart.js Bar + Line จาก DB จริง
- [x] **`GET /api/v1/reports/summary-weekly`** — 2026-05-19
  - เทียบ `W_summary_weekly_chart2.php` (Technician Utilizations bar) + ตาราง `W_summary_weekly.php`
  - รวมต่อ `wkctr`: PM (**`ZB02`** ตาม Eng Utilization 2026), Reactive (`ZB01`/`ZB05`), RCA (`view_confirmation`), HR/OT จาก `tbmanhours`, %PM/%Reactive/%RCA
  - **`importCoverage`** ใน response — ช่วง `tbiw37n` / manhour ใน DB + ปุ่ม「ใช้ช่วงข้อมูล SAP」บน `/summary-weekly`
  - [`SummaryWeeklyPage.tsx`](../../PM-Pepsi-App/frontend/src/features/reports/SummaryWeeklyPage.tsx) แทน placeholder
- [x] **Filter ช่วงวันที่** — 2026-05-19
  - Backend [`reports-range.ts`](../../PM-Pepsi-App/backend/src/lib/reports-range.ts): `from`/`to` query + `range` ใน response
  - [`ReportsDateFilter.tsx`](../../PM-Pepsi-App/frontend/src/features/reports/ReportsDateFilter.tsx) บน `/reports`, `/summary-weekly`, fullscreen chart
  - Fullscreen ส่ง `?from=&to=` ใน URL (เทียบ PHP filter ช่วง)

- [x] **Tests** — `reports.test.ts`, `reports-range.test.ts` (backend); `reports-schemas.test.ts`, `ReportsDateFilter.test.tsx`, `SummaryWeeklyUtilizationChart.test.tsx` (frontend)

- [x] **Fullscreen charts** — 2026-05-19
  - [`SummaryWeeklyChartFullPage.tsx`](../../PM-Pepsi-App/frontend/src/features/reports/SummaryWeeklyChartFullPage.tsx) — `/summary-weekly/chart/full` (ไม่มี sidebar)
  - `?variant=chart2` → `W_summary_weekly_chart2_full` (สีหลายสี, ค่าเริ่มต้น)
  - `?variant=chart` → `W_summary_weekly_chart_full` (แท่งสีเดียว)
  - ลิงก์ **ดูกราฟแบบขยาย** จาก `/summary-weekly` เปิดแท็บใหม่ (เทียบ PHP `target="_blank"`)

- [x] **เกณฑ์ §3 ครบ (ขอบเขตแกน)** — 2026-05-19
  - **UI:** `/reports` (KPI + date filter), `/summary-weekly` (ตาราง + chart + filter), `/summary-weekly/chart/full` (fullscreen + filter + `from`/`to` ใน URL)
  - **Data:** Zod `reportsRangeSchema`, `kpiResponseSchema`, `summaryWeeklyResponseSchema`; PG `tbmanhours`, `view_order`, `view_confirmation`
  - **Business rules:** %PM/%Reactive/%RCA ตาม `W_summary_weekly.php`; utilization = Confirm/HR manhour; backlog จาก open WO; กรอง `workday`/`endate`/`bscstart` ตามช่วง
  - **Modal:** N/A (กราฟขยายเป็นหน้าเต็มจอ ไม่ใช่ modal)
  - **Tests:** Vitest — backend `reports-range.test.ts` + `reports.test.ts`; frontend filter + chart component tests (ไม่มี Playwright ใน repo)

---

## บันทึกการอัปเดต

| วันที่ | สรุป |
|--------|------|
| 2026-05-16 | สร้างไฟล์ลำดับ 12 |
| 2026-05-19 | **API KPI + สรุปรายสัปดาห์** — routes `/api/v1/reports/kpi`, `/api/v1/reports/summary-weekly`; UI `/reports`, `/summary-weekly` |
| 2026-05-19 | **Fullscreen charts** — `/summary-weekly/chart/full?variant=chart|chart2` |
| 2026-05-19 | **§3 ครบ (แกน)** — `from`/`to` filter + `range` ใน API; Vitest E2E-style component tests; สถานะ → เสร็จ (แกน + §3) |
| 2026-05-22 | PM filter **ZB02** (ไม่ใช้ legacy `<> ZB029`) · `importCoverage` หลัง import SAP |
| 2026-05-22 | **`/manhours-hr`** — % Utilization Confirm÷HR รายคน/ทีม + ตัวกรองวันที่ (เทียบ `M_manhour_chart_performance`) |
