# Checklist งานย้าย PHP → React (เรียงลำดับ — ทำตามนี้)

> **ใช้ไฟล์นี้เป็นหลัก** เมื่องงจาก [`PHP-REACT-PARITY-CHECKLIST.md`](../PHP-REACT-PARITY-CHECKLIST.md) (241 แถว)  
> รายละเอียดเต็ม: [`PLAN.md`](PLAN.md)

**งานลูกค้า / SAP / UX ระบบเก่า (Phase 1–8):** [**`../WORK-PHASES.md`**](../WORK-PHASES.md) — checklist เรียงความสำคัญ · ทำ **Phase 1 Parser** ก่อน UAT ขั้น 5

**อัปเดต:** 2026-05-21 (ขั้น 0–4 ✅ · ถัดไปขั้น 5 UAT + WORK-PHASES Phase 1–2)

---

## ภาพรวม 3 ขั้น

```text
[1] ตัดสินใจ 1 เรื่อง (login ไปหน้าไหน)
        ↓
[2] แก้เอกสารให้ตรงความจริง (ไม่เขียนโค้ด)
        ↓
[3] ย้ายฟีเจอร์ที่ยังขาด (~5–8 งาน) → UAT → (ทีหลัง) Admin test / Deploy
```

**ไม่ต้องทำ:** ย้ายทีละไฟล์ `tb_*.php`, `member*.php` (~90 ไฟล์) — รวมใน `/master-data` และ `/personnel` แล้ว

---

## ขั้นที่ 0 — ตัดสินใจก่อน (ทำครั้งเดียว)

เลือก **หนึ่งข้อ** แล้วติ๊ก:

- [x] **0A** — หลัง login ช่าง (WC) ต้องไป **Plan Calendar** เหมือน PHP (`M_plan_calendar`) → **ต้องทำขั้นที่ 2**
- [ ] **0B** — หลัง login ใช้ **`/line-calendar`** แทน (ไม่ทำ Plan Calendar) → **ข้ามขั้นที่ 2** ทั้งก้อน

บันทึกที่ติ๊ก: **0A** วันที่: 2026-05-21

---

## ขั้นที่ 1 — แก้เอกสาร (ไม่เขียนโค้ด, ~ครึ่งวัน) ✅ 2026-05-21

ทำให้ checklist หลักไม่หลอกว่า “เหลือ 100 ไฟล์” — **§4/§5 อัปเดตแล้ว** (~44 แถว `ยังไม่ทำ` เหลือ = P1 modal / `W_*` / utility)

### 1.1 เปลี่ยนสถานะใน `PHP-REACT-PARITY-CHECKLIST.md` §4 เป็น **เสร็จ**

- [x] `M_iw37n.php`
- [x] `M_iw37n_imports.php`
- [x] `M_planwork_view.php` → เสร็จ (แกน)
- [x] `M_filter_iw37.php` (รวมใน `/calendar` แล้ว)

### 1.2 เปลี่ยน §5 modal เป็น **เสร็จ** (ทำในโค้ดแล้ว)

- [x] `MovePlant.php`
- [x] `FilterDetail.php`, `ModalMHshow.php`, `ModalOrderDetail.php`
- [x] `confirmTab1.php` … `confirmTab4.php`
- [x] `plan_confirmTab1.php` … `plan_submit_upload_file.php`, `ShowPlan_Close.php`

### 1.3 เปลี่ยนกลุ่ม legacy เป็น **ข้าม** (ใส่หมายเหตุ route)

ติ๊กเมื่ออัปเดตครบ **อย่างน้อยหนึ่งกลุ่ม** ต่อแถว:

- [x] ทุก `tb_*.php` → ข้าม → `/master-data`
- [x] ทุก `member*.php` → ข้าม → `/personnel`, `/admin/users`
- [x] `iw37n.php`, `iw37n_form.php` → ข้าม → `/iw37n` (มีอยู่แล้วใน checklist)
- [x] `M_importConfrim.php` → ข้าม (ซ้ำ IW37N)
- [x] `content.php`, `charts.php`, `*_bk*`, `test_*` → ข้าม (ส่วนใหญ่มีอยู่แล้ว + `test_*` ใน §4)

### 1.4 อัปเดตสรุปลำดับ 1–12

- [x] [`COMPLETION-MATRIX.md`](COMPLETION-MATRIX.md) — ลำดับ 7 IW37N, 8 Planning → **เสร็จ (แกน)**
- [x] [`README.md`](README.md) — ลำดับ 7–12 ตรง matrix

---

## ขั้นที่ 2 — Plan Calendar (P0) — **ข้ามทั้งก้อนถ้าเลือก 0B**

> เฉพาะเมื่อติ๊ก **0A** ในขั้นที่ 0

### 2.1 อ่าน PHP

- [x] เปิด [`sap/pages/M_plan_calendar.php`](../../sap/pages/M_plan_calendar.php) — query `view_planwork`, สี event, คลิก → form

### 2.2 Backend

- [x] API ดึง events จาก `view_planwork` กรอง `idwkctr` = user ที่ login (เปิด CRTD+REL ตาม PHP) — `GET /api/v1/plan-calendar/events`
- [x] ลงทะเบียนใน `routes/planning.ts` (permission `planning.read`)

### 2.3 Frontend

- [x] Route `/plan-calendar` — `PlanCalendarPage.tsx`
- [x] FullCalendar + คลิก event → `WorkOrderDetailDialog` · ลากช่วงวัน → `ManhourSummaryDialog`
- [x] redirect หลัง login WC → `/plan-calendar` (`auth-paths.ts`)

### 2.4 ปิดงานเอกสาร

- [x] §4 `M_plan_calendar.php` → **เสร็จ** (อัปเดตใน `PHP-REACT-PARITY-CHECKLIST.md` ขั้นที่ 1)
- [x] บันทึก §7 ใน checklist หลัก

---

## ขั้นที่ 3 — Modal / flow ที่อาจยังขาด (P1)

ทำทีละข้อ — ถ้าเทียบ PHP แล้ว React มีครบ ให้ติ๊ก **ข้าม** พร้อมหมายเหตุ

| ลำดับ | งาน | ติ๊ก |
|------|-----|------|
| 3.1 | **`ChackStatus`** — แสดงขั้นตอน WO (มี team แล้ว? มี assign แล้ว?) | [x] ทำ |
| 3.2 | **`AddTeam`** — ตั้ง Team A/B/P บน WO | [x] มีใน `/work-orders` + `WorkOrderDetailDialog` |
| 3.3 | **`FilterDetail_AddTeam`** — สรุป filter + team | [x] `/backlog` + `/work-orders` (`filter-detail` API) |
| 3.4 | **`AddClose` / `AddClosePersonel`** — ปิดงาน | [x] Confirm → Close Work (`tbcofirm`) + Personnel Close (`tbwrkclose`, migration 073) |
| 3.5 | **`ShowPlan` / `ShowPlanGroup`** — แผน/กลุ่ม | [x] Planning tab — ตารางรายบุคคล/รายกลุ่ม + จ่ายงาน; sidebar เติม `/plan-calendar` (migration 074) |
| 3.6 | **`TabWorkOrder` … `TabMaterial`** — เทียบ `WorkOrderDetailDialog` | [x] ครบ 5 แท็บ PHP + Confirm (React); WO tab เติมฟิลด์ TabWorkOrder |

อัปเดต §5 modal ที่ปิดแล้ว → **เสร็จ** หรือ **ข้าม**

---

## ขั้นที่ 4 — Auth / Settings (P2)

- [x] เปลี่ยนรหัสผ่านใน `/settings` + API (เทียบ `member_change_password.php`)
- [x] จำกัดบัญชี `member` — บันทึกใน [`01-auth.md`](01-auth.md) (RBAC + menuright)

---

## ขั้นที่ 5 — ทดสอบมือโมดูลธุรกิจ (ก่อนปิดโปรเจกต์)

ไม่บังคับ Vitest ทั้ง repo — แค่ลอง flow จริงกับ PG

- [ ] Login WC + เมนู sidebar ตรงสิทธิ์
- [ ] `/line-calendar` — สร้าง/แก้/ลาก
- [ ] `/calendar` + ฟิลเตอร์ + ย้ายแผน
- [ ] `/backlog`
- [ ] `/work-orders` + เปิดรายละเอียด WO
- [ ] `/planning` — เปิด/ปิด + จ่ายงาน
- [ ] `/iw37n` — import + แก้แถว
- [ ] `/confirmation` — ปิดงาน + import/export
- [ ] `/personnel` + `/personnel/confirm` (Admin)
- [ ] `/manhours`, `/worktime`, `/manhours-hr`
- [ ] `/reports`, `/summary-weekly`
- [ ] `/master-data` — สุ่ม 2–3 แท็บ CRUD/import

เมื่อครบ → อัปเดต [`COMPLETION-MATRIX.md`](COMPLETION-MATRIX.md) ลำดับ 2–12 เป็น **เสร็จ (แกน)** ตามจริง

---

## ขั้นที่ 6 — หลัง parity ธุรกิจเสร็จ (อย่าทำก่อน)

- [ ] Admin: `npm test`, Playwright (`14-administrator.md` §15)
- [ ] Deploy: docker-compose, D:, backup (`13-deploy-offline.md`)

---

## สรุป: ตอนนี้ทำอะไรก่อน?

| ลำดับ | ทำอะไร | สถานะ |
|------|--------|--------|
| 0–4 | ตัดสินใจ, เอกสาร, Plan Calendar, modal P1, Auth | ✅ เสร็จ — ดู [`PLAN.md`](PLAN.md) §0 |
| **5** | **UAT มือ** โมดูลธุรกิจ (ด้านล่าง) | ⏳ หลัง [`WORK-PHASES`](../WORK-PHASES.md) Phase 1–2 |
| 6 | Admin test / Deploy | หลังขั้น 5 · WORK-PHASES Phase 8 |

---

## โมดูลที่ **ย้ายแล้ว** (ไม่ต้องเปิด PHP อีก — แค่ UAT ในขั้นที่ 5)

| หน้า PHP เดิม | React |
|--------------|-------|
| `line_calendar` | `/line-calendar` |
| `calendar` + filter | `/calendar` |
| `backlog` | `/backlog` |
| `workorder` | `/work-orders` |
| `M_confirmation` | `/confirmation` |
| `M_iw37n` | `/iw37n` |
| `M_planwork_view` | `/planning` |
| **`M_plan_calendar`** | **`/plan-calendar`** |
| `M_personel*` | `/personnel`, `/admin/users` |
| `M_manhour*` | `/manhours`, `/manhours/admin` |
| `W_worktime_view` | `/worktime` |
| `W_manhours_hr` | `/manhours-hr` |
| `W_summary_weekly*` | `/summary-weekly`, `/reports` |
| Master `M_*` | `/master-data` |
| `login` / `logout` | `/login`, `/logout` |

---

## ลิงก์ด่วน

| ไฟล์ | ใช้เมื่อ |
|------|---------|
| **[`../WORK-PHASES.md`](../WORK-PHASES.md)** | **Phase 1–8** — SAP parser, bulk UX, ประชุมลูกค้า |
| **ไฟล์นี้** | งง — ทำตามลำดับย้าย PHP |
| [`PLAN.md`](PLAN.md) | รายละเอียด / เหตุผลจัดกลุ่ม |
| [`PHP-REACT-PARITY-CHECKLIST.md`](../PHP-REACT-PARITY-CHECKLIST.md) | อ้างอิง PHP ทีละไฟล์ (หลังขั้นที่ 1 แล้วอ่านง่ายขึ้น) |
| [`COMPLETION-MATRIX.md`](COMPLETION-MATRIX.md) | สถานะโมดูล 1–14 |
