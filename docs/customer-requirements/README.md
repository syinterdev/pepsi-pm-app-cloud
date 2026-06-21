# เอกสารจากลูกค้า (`from customer/`)

แหล่งไฟล์ต้นฉบับ: [`../../from customer/`](../../from%20customer/) (75 ไฟล์ — SRS, SAP ตัวอย่าง, บั๊กรายงาน, spec เซิร์ฟเวอร์)

| เอกสาร | ใช้เมื่อ |
|--------|---------|
| [**MEETING-MINUTES.md**](MEETING-MINUTES.md) | **รายงานประชุมครั้งที่ 1–2** (เม.ย.–พ.ค. 2569) — requirement ล่าสุดจากลูกค้า |
| [**MEETING-SUMMARY-REQUIREMENTS.md**](MEETING-SUMMARY-REQUIREMENTS.md) | **สรุปสไลด์ + รายการแก้งาน** — Integration · WO · Audit |
| [**ENG-TECHNICIAN-CODES.md**](ENG-TECHNICIAN-CODES.md) | **รหัสช่าง PAC/PRO/UTI (25 คน)** + ตารางคำนวณเวลาปิดงาน |
| [**ACTIVITY-TYPE-FILTER.md**](ACTIVITY-TYPE-FILTER.md) | **ตัวกรองกิจกรรม** Z1/Z2/Z5 บนปฏิทิน · WO · Backlog |
| [**CALENDAR-DISPLAY.md**](CALENDAR-DISPLAY.md) | **สี / title / description** event บน `/calendar` |
| [**MAINT-ACTIVITY-TYPE-ZB02.md**](MAINT-ACTIVITY-TYPE-ZB02.md) | **ประเภทงาน** MaintActivityType 19 รายการ (ZB02) |
| [**PM-MEASUREMENTS-3PHASE-CURRENT.md**](PM-MEASUREMENTS-3PHASE-CURRENT.md) | **PM ค่าวัด** — กระแส R/S/T vs Vibration **Dst/dB** · Excel template |
| [**PM-VIBRATION-DST-DB-SPEC.md**](PM-VIBRATION-DST-DB-SPEC.md) | **Vibration Dst/dB** — spec จาก Excel 2019 |
| [**PM-VIBRATION-DST-DB-DESIGN-PROPOSAL.md**](PM-VIBRATION-DST-DB-DESIGN-PROPOSAL.md) | **Design proposal** — Time \| Dst \| dB · เสนอลูกค้า |
| [**PM-MANUAL-ENTRY-WORK-ORDER-FORM.md**](PM-MANUAL-ENTRY-WORK-ORDER-FORM.md) | **Manual entry ตามฟอร์ม WO กระดาษ** — ฟิลด์ §header · 3 เฟส · กราห · Comments หน้า 2 |
| [**../USER-MANUAL-TH.md**](../USER-MANUAL-TH.md) | **คู่มือการใช้งานภาษาไทย** — ครบทุกหน้า/route |
| [**UAT-ROUND-3-TH.md**](UAT-ROUND-3-TH.md) | **ชีต UAT รอบ 3 (go-live)** — ส่งลูกค้ากรอก |
| [**INSTALL-DEPLOY-RUNBOOK-TH.docx**](INSTALL-DEPLOY-RUNBOOK-TH.docx) | **ติดตั้ง · Deploy · Runbook** (IT onsite) |
| [**SECURITY-DETAILED-TH.docx**](SECURITY-DETAILED-TH.docx) | **ความปลอดภัยระบบ** (Security & Cybersecurity) |
| [**E2E-TEST-DETAILED-TH.docx**](E2E-TEST-DETAILED-TH.docx) | **E2E / System Test** (Playwright) |
| [**TEST-CASE-SCENARIO-DETAILED-TH.docx**](TEST-CASE-SCENARIO-DETAILED-TH.docx) | **Test Case Scenario** (Manual/UAT) |
| [**../SETUP-NEW-MACHINE.md**](../SETUP-NEW-MACHINE.md) | **ติดตั้งเครื่องใหม่** — PostgreSQL, migration, backend, frontend, E2E |
| [**UAT-ROUND-1-TH.md**](UAT-ROUND-1-TH.md) | **ชีต UAT รอบ 1** — checklist ภาษาไทย + กรอก requirement ต่อหน้า |
| [**UAT-ROUND-2-TH.md**](UAT-ROUND-2-TH.md) · [**UAT-ROUND-2-TH.docx**](UAT-ROUND-2-TH.docx) | **ชีต UAT รอบ 2** — PM ฟอร์มกระดาษ · i18n · regression P0 + comment กลับทีม (Word สำหรับส่งลูกค้า) |
| [**PRE-UAT-UI-PHASES.md**](PRE-UAT-UI-PHASES.md) | **U4 UI ก่อน UAT** — popup · animation · ไล่ทีละหน้า (ทำก่อน) |
| [**../PRE-UAT-MASTER-PHASES.md**](../PRE-UAT-MASTER-PHASES.md) | Master checklist ก่อน UAT — SAP · Telegram · Deploy (ยังไม่ส่งลูกค้า) |
| [**CATALOG.md**](CATALOG.md) | สารบัญไฟล์ทั้งหมด + แมปไป parity 01–15 |
| [**LEGACY-ISSUES-CHECKLIST.md**](LEGACY-ISSUES-CHECKLIST.md) | บั๊ก/UX จาก Problem PM + screenshot ระบบเก่า (Must/Should) |
| [**SAP-SAMPLE-PROBE.md**](SAP-SAMPLE-PROBE.md) | ผลตรวจ parser กับไฟล์ตัวอย่างลูกค้า (รัน 2026-05-21) |

**รายงานประชุม (ต้นฉบับ):** [`รายงานการประชุม ครั้งที่ 1 PDF.pdf`](../../รายงานการประชุม%20ครั้งที่%201%20PDF.pdf) · [`รายงานการประชุม ครั้งที่ 2.docx`](../../รายงานการประชุม%20ครั้งที่%202.docx)

**อัปเดต integration:** [`../parity-pending/15-sap-csv-integration.md`](../parity-pending/15-sap-csv-integration.md) §13

**แผน Phase + Checklist งาน (เรียงความสำคัญ):** [**`../WORK-PHASES.md`**](../WORK-PHASES.md) · **ก่อน UAT:** [**`../PRE-UAT-MASTER-PHASES.md`**](../PRE-UAT-MASTER-PHASES.md)

**แผนพัฒนา:** [`../parity-pending/PLAN.md`](../parity-pending/PLAN.md) · ย้าย PHP [`../parity-pending/CHECKLIST-ORDER.md`](../parity-pending/CHECKLIST-ORDER.md)
