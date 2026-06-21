# Flow การทำงาน PM Pepsi App — สำรวจก่อนปรับปรุง

**อัปเดต:** 2026-06-15  
**วัตถุประสงค์:** ไล่ flow ปัจจุบันจากโค้ด + เอกสารที่มี — ใช้เป็นฐานก่อนรอบปรับปรุง UI/UX และ business flow  
**แหล่งอ้างอิง:** `App.tsx` · `auth-paths.ts` · `WorkOrderDetailDialog.tsx` · `CONFIRM-QC-FLOW.md` · `USER-MANUAL-TH.md` · `PRE-UAT-UI-PHASES.md`

---

## 1. ภาพรวม

| รายการ | ค่า |
|--------|-----|
| **Stack** | React (Vite) + Express API + PostgreSQL (`app` schema) |
| **Auth** | Session cookie · login ด้วย `idwkctr` / member |
| **เมนู** | `tbmenu` (API) + fallback `nav-config.ts` · กรอง RBAC |
| **รูป** | เก็บใน DB (BYTEA/WebP) — ไม่ใช้โฟลเดอร์ `imgMember/` |
| **Portal** | `/portal` หลัง login (เมื่อ `VITE_PORTAL_ENABLED` ≠ false) |

### บทบาทหลัก (3 role)

| userst | userrole | หน้าเริ่มหลัง login (ไม่มี portal) | งานหลัก |
|--------|----------|-------------------------------------|---------|
| **A** | admin | `/` Dashboard | QC · Admin · รายงาน · SAP export |
| **U** | planner | `/planning` | จ่ายงาน · ปฏิทิน · IW37N |
| **W** | technician | `/plan-calendar` | รับงาน · ทำ PM · ปิดงาน · รูป After |

> Role **H (Manager)** map เป็น planner (`U`) แล้ว — deprecated

---

## 2. Flow ระดับระบบ (End-to-end)

```mermaid
flowchart TB
  subgraph ingress [ข้อมูลเข้า]
    SAP_IW37N[SAP IW37N export]
    SAP_CONFIRM[SAP Confirm IN]
    MANUAL[อัปโหลดมือ / Integration UI]
    SAP_IW37N --> MANUAL
    SAP_CONFIRM --> MANUAL
    MANUAL --> DB[(PostgreSQL app.*)]
  end

  subgraph plan [วางแผน]
    PLANNING[/planning จ่ายงาน]
    CAL[/calendar จัดวัน/ทีม]
    PCAL[/plan-calendar ปฏิทินช่าง]
    DB --> PLANNING
    PLANNING --> CAL
    PLANNING --> PCAL
  end

  subgraph exec [ช่างทำงาน]
    WO_MODAL[WO Modal]
    TASK[แท็บ Task — PM checklist]
    CLOSE[แท็บ Close WO — ปิดงานช่าง]
    PCAL --> WO_MODAL
    CAL --> WO_MODAL
    WO_MODAL --> TASK
    WO_MODAL --> CLOSE
    CLOSE --> PHOTO[รูป After PM]
    CLOSE --> PERS[เวลาปิดงานรายช่าง]
    CLOSE --> SUP[Supervisor close tbcofirm]
    PHOTO --> DB
    PERS --> DB
    SUP --> DB
  end

  subgraph qc [QC & ส่ง SAP]
    PENDING[confirm_qc_status = pending]
    ADMIN_QC[/confirmation คิว QC]
    APPROVE[อนุมัติ QC]
    EXPORT[CONFIRM_OUT CSV/XLSX]
    SUP --> PENDING
    PENDING --> ADMIN_QC
    ADMIN_QC --> APPROVE
    APPROVE --> DASH[Dashboard KPI]
    APPROVE --> PCONF[/personnel/confirm %]
    APPROVE --> EXPORT
  end
```

---

## 3. Authentication & Navigation

### 3.1 Login → หน้าแรก

```text
/login (Guest)
  → POST /api/v1/auth/login
  → resolvePostLoginPath(from, mode, userst)
       ├─ VITE_PORTAL_ENABLED → /portal (เก็บ deep link ใน sessionStorage)
       ├─ member → /
       └─ workcenter → A:/  U:/planning  W:/plan-calendar
  → AppShell + NavRouteGuard (เช็ค permission ต่อ route)
```

| URL | สิทธิ์ | หมายเหตุ |
|-----|--------|----------|
| `/login` | Guest | ลิงก์ `/board` (kiosk ไม่ login) |
| `/portal` | Auth | การ์ด module pm / store / repair |
| `/logout` | ทุกคน | ล้าง session → `/login` |
| `/board` | Public (+ token) | Engineering Board kiosk |

### 3.2 Portal (module hub)

```text
/portal
  → GET /api/v1/portal/modules (กรอง RBAC)
  → คลิก PM → เข้า AppShell (หรือ handoff module อื่นในอนาคต)
  → Topbar "กลับ Portal" เมื่อมี >1 module
```

---

## 4. Flow ตามบทบาท

### 4.1 Planner (U) — วางแผนและจ่ายงาน

```text
/planning
  → ดูรายการ WO เปิด (filter วันที่ · ทีม · สถานะ)
  → จ่ายงาน (PlanningMultiAssign) — ต้อง planning.assign
  → Ack รับทราบงาน (acknowledge) — แจ้ง Telegram ถ้าตั้งค่าแล้ว
  → เปิด WO modal (full layout) — แท็บ Planning จ่ายช่าง/กลุ่ม

/calendar
  → ปฏิทิน FullCalendar — ลากวัน · ตั้งทีม A/B/EE/UT
  → คลิก event → WO modal

/plan-calendar
  → ปฏิทินงานที่จ่ายแล้ว (มุมมองช่าง/planner)
  → คลิก event → WO modal (assigned layout — 3 แท็บ)

/backlog · /work-orders
  → ค้นหา WO · filter · เปิด modal
```

**ข้อมูลเข้า SAP (Planner/Admin):**

```text
/integration หรือ /iw37n
  → อัป IW37N (batch log insert/update)
  → อัป Confirm IN (จับคู่ WO ใน tbiw37n)
  → watch folder: backend/data/integration/inbound/*
```

### 4.2 Technician (W) — ทำงานและปิดงาน

```text
/plan-calendar (หรือ /calendar / /work-orders)
  → เปิด WO → modal แบบ assigned (3 แท็บ)

แท็บ Task
  → PM comment / checklist (WorkOrderPmCommentSection)
  → Task list + PM execution

แท็บ Planning
  → ดูการจ่ายงาน (read-only ถ้าไม่มี planning.write)

แท็บ Close WO  ← งานช่างหลัก
  1. PersonnelClosePanel — บันทึกเวลาปิดงานรายช่าง (tbwrkclose)
  2. ConfirmationImagesPanel — รูป After PM เท่านั้น (phase=after)
  3. WorkOrderSupervisorCloseSection — บันทึก supervisor close (tbcofirm)

/personnel
  → Dashboard ส่วนตัวช่าง

/personnel/confirm
  → ดู % ปิดงาน · สถานะรอ Admin QC
```

**เกณฑ์ก่อนกดปิด supervisor close** (`work-order-close-ready.ts`):

- มี **comment** ≥ 1 แถว (`tbconfirmcomment`)
- มี **รูป After** ≥ 1 ใบ (`tbconfirmimg` phase=after)

> ⚠️ ดู §7 — assigned layout ไม่มี UI ความคิดเห็น แต่ยังเช็ค commentCount

### 4.3 Admin (A) — QC, Export, ระบบ

```text
/confirmation
  → คิว WO รอ QC (ConfirmQcPendingQueue)
  → Mass Confirm (สูงสุด 44 WO/ครั้ง)
  → อนุมัติ QC ทีละใบ / ทั้งชุด
  → Export CONFIRM_OUT → SAP

/ (Dashboard)
  → KPI ปิดเดือนนี้ — นับเฉพาะ confirm_qc_status = approved

/admin/*
  → Users · Roles · Menu · Branding · Backup · Security · Telegram ...

/summary-weekly · /reports
  → Eng Utilization · Auditor Hub
```

---

## 5. WO Modal — สองรูปแบบ

| | **full** (`tabLayout=full`) | **assigned** (`tabLayout=assigned`) |
|--|---------------------------|-------------------------------------|
| **เปิดจาก** | `/work-orders` · `/calendar` · `/planning` | `/plan-calendar` (และจุดที่ส่ง `assigned`) |
| **แท็บ** | Work Order · Task List · Machine · Planning · Material · **Confirm** | **Task** · **Planning** · **Close WO** |
| **รูป After** | แท็บ Confirm → sub-tab Images | แท็บ **Close WO** (หลัง PersonnelClose) |
| **QC Panel** | แท็บ Confirm (ConfirmQcPanel) | ไม่มีใน assigned — QC ทำที่ `/confirmation` |
| **ความคิดเห็น** | แท็บ Confirm → sub-tab Comments | **ไม่มี UI** (แต่ API ยังโหลด comments) |

---

## 6. สถานะ WO & QC (ย่อ)

```text
SAP import → tbiw37n (system status REL/…)
  → จ่ายงาน tbplangingwork
  → ช่างปิดงาน + รูป → tbcofirm + tbconfirmimg + tbwrkclose
  → confirm_qc_status: pending
  → Admin approve → approved
       → Dashboard / Personnel Confirm / Export SAP
  → reject → ช่างแก้ → pending ใหม่
```

รายละเอียด API: [`customer-requirements/CONFIRM-QC-FLOW.md`](customer-requirements/CONFIRM-QC-FLOW.md)

---

## 7. จุดที่เอกสาร/โค้ดไม่ตรงกัน (รอปรับปรุง)

ใช้เป็น backlog ก่อนรอบแก้ถัดไป:

| # | หัวข้อ | สถานะปัจจุบัน | แนะนำ |
|---|--------|---------------|--------|
| 1 | **รูป After อยู่แท็บไหน** | assigned → **Close WO** แล้ว (2026-06-15) | อัปเดต `USER-MANUAL-TH.md` §12.2 (ยังเขียน "แท็บ Confirm") |
| 2 | **closeReady ต้องมี comment** | assigned layout **ไม่มี** UI comment แต่ `isWorkOrderCloseReady` ยังเช็ค `commentCount` | แยกเกณฑ์ assigned vs full หรือเพิ่ม comment ใน Close WO |
| 3 | **หลัง login** | โค้ด → `/portal` · คู่มือ → `/` | sync คู่มือ + UAT script |
| 4 | **Phase 2 UAT SAP** | ปฏิทินว่างถ้า functionalloc ไม่ตรง 7151 | ตรวจ mapping IW37N กับลูกค้า |
| 5 | **Store / Repair module** | Portal แสดง "เร็วๆ นี้" | รอ URL/handoff จากลูกค้า |
| 6 | **Mass Confirm 44** | ข้อจำกัด legacy/SAP | แสดงใน UI ชัดเมื่อเกิน |
| 7 | **Mobile sidebar** | แก้ full-height drawer แล้ว | QA บน iPhone/Android จริง |

---

## 8. แผนผังหน้า (Route map ย่อ)

```text
Public     /login  /logout  /board  /error/*
Portal     /portal
App shell  /  /calendar  /plan-calendar  /backlog  /work-orders
             /planning  /confirmation  /integration  /iw37n
             /personnel  /personnel/confirm  /manhours  /worktime
             /summary-weekly  /reports  /reports/audit  /activity-log
             /pm-vibration  /master-data  /settings  /user-log
Admin        /admin  (+ branding, users, roles, menu, …)
Dev only     /dev/ui
```

RBAC ราย route: `lib/nav-route-permissions.ts` · permission จาก `/auth/me`

---

## 9. Checklist ก่อนรอบปรับปรุง

ใช้ติ๊กเมื่อทีม walkthrough กับลูกค้าแล้ว:

### 9.1 Flow ช่าง (W)

- [ ] Login → portal/plan-calendar ตรง role
- [ ] เปิด WO จาก plan-calendar → 3 แท็บถูกต้อง
- [ ] Task: PM checklist ครบ
- [ ] Close WO: บันทึกเวลา → อัปโหลดรูป After → supervisor close
- [ ] ถ้าปิดไม่ได้ — ข้อความ block ชัด (comment vs รูป)
- [ ] `/personnel/confirm` แสดง % และสถานะ QC

### 9.2 Flow Planner (U)

- [ ] `/planning` จ่ายงาน + ack + Telegram (ถ้าเปิด)
- [ ] `/calendar` ลากวัน / ทีม
- [ ] Import IW37N แล้วเห็น WO ในปฏิทิน (ปี/เดือนถูก)

### 9.3 Flow Admin (A)

- [ ] `/confirmation` QC approve/reject
- [ ] Mass confirm + export ชุดเดียว
- [ ] Dashboard KPI หลัง approve เท่านั้น
- [ ] Admin users/roles/menu ตรง RBAC

### 9.4 เอกสารที่ควร sync หลังปรับ flow

- [ ] [`USER-MANUAL-TH.md`](USER-MANUAL-TH.md) — §12 workflow · §5 WO modal
- [ ] [`customer-requirements/CONFIRM-QC-FLOW.md`](customer-requirements/CONFIRM-QC-FLOW.md) — ตำแหน่งรูป After
- [ ] [`PRE-UAT-MASTER-PHASES.md`](PRE-UAT-MASTER-PHASES.md) — UAT checklist
- [ ] ชีต UAT ลูกค้า (ถ้ามี)

---

## 10. เอกสารที่เกี่ยวข้อง

| เอกสาร | ใช้เมื่อ |
|--------|----------|
| [`USER-MANUAL-TH.md`](USER-MANUAL-TH.md) | คู่มือรายหน้า (ต้อง sync กับ §7) |
| [`WORK-PHASES.md`](WORK-PHASES.md) | Phase พัฒนา / SAP / UAT |
| [`PRE-UAT-UI-PHASES.md`](customer-requirements/PRE-UAT-UI-PHASES.md) | UI polish U0–U4 |
| [`CONFIRM-QC-FLOW.md`](customer-requirements/CONFIRM-QC-FLOW.md) | QC + export |
| [`ON-SITE-DATABASE-SETUP.md`](ON-SITE-DATABASE-SETUP.md) | Deploy DB |
| [`AGENTS.md`](../AGENTS.md) | แนวทาง dev สำหรับ AI |

---

*เอกสารนี้สรุปสถานะ 2026-06-15 — อัปเดตเมื่อเปลี่ยน flow สำคัญ (WO modal, QC, portal, SAP)*
