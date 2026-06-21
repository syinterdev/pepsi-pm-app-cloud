# คู่มือการใช้งาน PM Pepsi App

**อัปเดต:** 2026-05-22  
**แอป:** PM-Pepsi-App (React + API)  
**ผู้ใช้เป้าหมาย:** Planner / ช่าง / หัวหน้างาน / Admin / Auditor

เอกสารนี้อธิบาย **ทุกหน้าในระบบ** ตามเมนู sidebar และเส้นทาง URL จริงจาก `App.tsx` / `nav-config.ts`  
สำหรับ flow เทคนิค (QC, SAP, RBAC) ดูเพิ่มใน [`customer-requirements/`](customer-requirements/)

---

## สารบัญ

1. [เริ่มต้นใช้งาน](#1-เริ่มต้นใช้งาน)
2. [โครงสร้างหน้าจอทั่วไป](#2-โครงสร้างหน้าจอทั่วไป)
3. [สิทธิ์และบทบาท (RBAC)](#3-สิทธิ์และบทบาท-rbac)
4. [จอมอนิเตอร์ & สาธารณะ](#4-จอมอนิเตอร์--สาธารณะ)
5. [ปฏิทิน & ใบงาน](#5-ปฏิทิน--ใบงาน)
6. [แผน PM/CM & นำเข้า SAP](#6-แผน-pmcm--นำเข้า-sap)
7. [ชั่วโมงงาน & บุคลากร](#7-ชั่วโมงงาน--บุคลากร)
8. [รายงาน & ตรวจสอบ](#8-รายงาน--ตรวจสอบ)
9. [ระบบ & ตั้งค่าผู้ใช้](#9-ระบบ--ตั้งค่าผู้ใช้)
10. [โซนผู้ดูแลระบบ `/admin`](#10-โซนผู้ดูแลระบบ-admin)
11. [เส้นทางพิเศษ & ข้อผิดพลาด](#11-เส้นทางพิเศษ--ข้อผิดพลาด)
12. [Workflow แนะนำ (วันทำงาน)](#12-workflow-แนะนำ-วันทำงาน)
13. [คำถามที่พบบ่อย](#13-คำถามที่พบบ่อย)

---

## 1. เริ่มต้นใช้งาน

### 1.1 เข้าระบบ (`/login`)

| รายการ | รายละเอียด |
|--------|------------|
| **URL** | `/login` |
| **สิทธิ์** | ผู้ที่ยังไม่ล็อกอิน (Guest) |
| **ฟิลด์** | ชื่อผู้ใช้ (work center / idwkctr) · รหัสผ่าน |
| **หลังล็อกอินสำเร็จ** | ไปหน้าที่เคยเปิดค้างไว้ หรือ Dashboard `/` |

**ขั้นตอน**

1. เปิด URL แอปในเบราว์เซอร์ (Chrome / Edge แนะนำ)
2. กรอก **ชื่อผู้ใช้** และ **รหัสผ่าน** ที่ Admin ออกให้
3. กด **เข้าสู่ระบบ**
4. หากรหัสผิด / บัญชีล็อก / โหมดบำรุงรักษา ระบบแสดงกล่องข้อความภาษาไทย — อ่านแล้วดำเนินการตาม (เปลี่ยนรหัส, ติดต่อ Admin)

**หมายเหตุ:** หน้า Login รองรับโลโก้/พื้นหลังจาก Admin → ธีม & โลโก้ · สลับ Light/Dark ได้ที่มุมการ์ด

### 1.2 ออกจากระบบ (`/logout`)

| รายการ | รายละเอียด |
|--------|------------|
| **URL** | `/logout` |
| **การทำงาน** | ล้าง session ฝั่ง client แล้วพากลับ `/login` |

ใช้เมนูผู้ใช้ / ลิงก์ออกจากระบบใน shell

### 1.3 Command Palette (ทางลัด)

- กด **Ctrl+K** (Windows) หรือ **Cmd+K** (Mac) จากหน้าที่มี shell
- พิมพ์ชื่อหน้า / เมนู / คำสั่ง admin
- เลือกด้วยลูกศร + Enter

---

## 2. โครงสร้างหน้าจอทั่วไป

หลังล็อกอิน หน้าส่วนใหญ่อยู่ใน **App Shell**:

| ส่วน | หน้าที่ |
|------|---------|
| **Sidebar ซ้าย** | เมนูตามสิทธิ์ · กลุ่มหัวข้อ (ปฏิทิน, รายงาน ฯลฯ) |
| **แถบบน** | ชื่อแอป · ประกาศ (banner) · ผู้ใช้ · ธีม |
| **พื้นที่เนื้อหา** | หัวหน้า (title + ปุ่ม action) · การ์ด/ตาราง |

**มือถือ / จอแคบ (< lg):** Sidebar เป็นตัวลาก (drawer) — เปิดจากไอคอนเมนู · ปิดอัตโนมัติเมื่อเปลี่ยนหน้า

**องค์ประกอบที่พบบ่อย**

- **AppCard** — กล่องเนื้อหาหลัก
- **EmptyState** — ไม่มีข้อมูล / ไม่มีสิทธิ์ / โหลดไม่สำเร็จ + ปุ่มลองใหม่
- **ตาราง** — หัวคอลัมน์ติดด้านบนเมื่อเลื่อน (sticky) บนหน้ารายการยาว
- **Dialog / Drawer** — รายละเอียด WO, ยืนยันลบ, ตัวกรองวันที่บนมือถือ

---

## 3. สิทธิ์และบทบาท (RBAC)

เมนูและหน้า **กรองตาม permission** (เช่น `work-orders.read`) ไม่ใช่แค่ตัวอักษร A/U/W แบบระบบเก่า

| Permission (ตัวอย่าง) | หน้าที่เกี่ยวข้อง |
|----------------------|------------------|
| `dashboard.read` | `/` |
| `calendar.read` | `/calendar`, `/line-calendar`, `/plan-calendar` |
| `backlog.read` | `/backlog` |
| `work-orders.read` / `.write` | `/work-orders` |
| `confirmation.read` / `.import` / `.export` | `/confirmation`, export |
| `planning.read` / `.assign` | `/planning`, `/plan-calendar` |
| `iw37n.read` / `.import` / `.write` | `/iw37n`, `/integration` |
| `master-data.read` / `.write` | `/master-plan`, `/master-data`, `/admin/master` |
| `manhours.read` / `manhours.admin` | `/manhours`, `/manhours/admin`, `/worktime` |
| `personnel.read` / `.confirm.read` | `/personnel`, `/personnel/confirm` |
| `reports.read` | รายงานทุกหน้าในกลุ่มรายงาน |
| `admin.*` | `/admin/*` |

**ถ้าเปิด URL โดยไม่มีสิทธิ์:** แสดง EmptyState “ไม่มีสิทธิ์เข้าถึง” หรือ redirect

**จัดการสิทธิ์:** Admin → บทบาท & สิทธิ์ (`/admin/roles`) · ผู้ใช้งาน (`/admin/users`)

---

## 4. จอมอนิเตอร์ & สาธารณะ

### 4.1 Engineering Board — Kiosk (`/board`)

| รายการ | รายละเอียด |
|--------|------------|
| **URL** | `/board` |
| **สิทธิ์** | เปิดได้โดยไม่ผ่าน NavRouteGuard (จอ TV / kiosk) |
| **จุดประสงค์** | แสดง KPI / Utilization / ทีมช่าง แบบเต็มจอ สำหรับห้อง Engineering |

**การใช้งาน**

1. เปิด `/board` บนจอ TV (แนะนำ Chromium kiosk mode)
2. เลือกช่วงเวลา / ธีมสว่าง-มืด ตามปุ่มบนจอ
3. ข้อมูลรีเฟรชตามรอบที่ตั้งใน backend — ไม่ต้องล็อกอิน

**เทียบระบบเก่า:** จอ Engineering / สรุป utilization ในห้องประชุม

---

## 5. ปฏิทิน & ใบงาน

### 5.1 Dashboard / หน้าแรก (`/`)

| รายการ | รายละเอียด |
|--------|------------|
| **สิทธิ์** | `dashboard.read` |
| **เนื้อหา** | KPI การ์ด (WO, ปฏิทิน, IW37N ฯลฯ) · sparkline 7 วัน · ทางลัดตามเมนูที่เข้าถึงได้ |
| **Tour** | ครั้งแรกอาจมี Joyride แนะนำ KPI และ quick links |

**ขั้นตอน:** คลิกการ์ด KPI เพื่อไปโมดูลที่เกี่ยวข้อง · ใช้ quick links แทนการเปิด sidebar

---

### 5.2 Plan Calendar — จ่ายงาน (`/plan-calendar`)

| รายการ | รายละเอียด |
|--------|------------|
| **สิทธิ์** | `planning.read` |
| **จุดประสงค์** | ปฏิทินรายเดือนสำหรับ **แผนจ่ายงาน** (plan events) |

**ขั้นตอน**

1. เลือก **ปี/เดือน** (ปุ่มก่อนหน้า / ถัดไป)
2. ดู event บนปฏิทิน — คลิกเพื่อดูรายละเอียด (ถ้ามี)
3. ลิงก์ไป Planning หรือ WO ตามสิทธิ์

**เทียบ PHP:** ปฏิทินแผนจ่ายงาน

---

### 5.3 ปฏิทิน Work Scheduling (`/calendar`)

| รายการ | รายละเอียด |
|--------|------------|
| **URL** | `/calendar` · `/calendar/wc/:code` (กรอง work center) |
| **สิทธิ์** | `calendar.read` |
| **จุดประสงค์** | ปฏิทินงานจริง — ลากวาง / กำหนดทีม / ดูสถานะ workflow |

**ขั้นตอนหลัก**

1. เลือกช่วง **เดือน / สัปดาห์ / รายวัน** (ตามตัวควบคุม FullCalendar)
2. **กรอง** ตามแถบ **ตัวกรองงาน** (เลือกหลายค่า — Ctrl/Cmd ค้าง):

   | หัวข้อ | ตัวอย่างค่า |
   |--------|-------------|
   | **กิจกรรม** | Z1 = Break Down Maintenance · Z2 = Preventive Maintenance · Z5 = Corrective Maintenance |
   | **ประเภทงาน (MaintActivityType · ZB02)** | 001 Inspection · 002 Preventive Maintenance · … (19 รายการ) |
   | สถานะระบบ (syst) | CRTD, REL, … |
   | ศูนย์งาน (wkctr) | PAC007, … |
   | **ทีม (A / B / EE / UT)** | A, B, EE, UT |

   **การแสดงบนปฏิทิน:** ปุ่ม **รวมทั้งหมด / Z1 / Z2 / Z5** ใต้ legend สี · title รูปแบบ `{เลข WO เต็ม} / {wktype}` · ย้ายแผนครั้งที่ N แสดง `/N` · สี **ม่วง** กำลังทำ · **ส้ม** โอนย้าย · **เขียว** เสร็จแล้ว · ชี้เมาส์ที่ event ดู description (FL, Equipment, Operation ฯลฯ)

   รายละเอียด: [`customer-requirements/ACTIVITY-TYPE-FILTER.md`](customer-requirements/ACTIVITY-TYPE-FILTER.md) · [`customer-requirements/CALENDAR-DISPLAY.md`](customer-requirements/CALENDAR-DISPLAY.md)
3. **คลิก event** → เปิดรายละเอียด WO (modal)
4. **ลาก event** เปลี่ยนวัน (ถ้ามีสิทธิ์ write) — บนมือถือใช้ **กดค้าง ~0.4 วินาที** แล้วลาก
5. ดู **suffix ตัวเลข workflow** บน event (ขั้นตอน 1–4 รวม confirm)

**เทียบ PHP:** `W_calendar.php` — Month/Week/Day, drag & drop

---

### 5.4 ปฏิทินเส้น / Line Calendar (`/line-calendar`)

| รายการ | รายละเอียด |
|--------|------------|
| **สิทธิ์** | `calendar.read` |
| **จุดประสงค์** | ปฏิทินตาม **สายการผลิต (Line)** — แยกจากปฏิทิน WO ทั่วไป |

**ขั้นตอน**

1. เลือกเดือน
2. ดู/แก้ event ของ Line (สิทธิ์ write ตาม RBAC)
3. Dialog แก้ไข — บันทึกแล้วรีเฟรชปฏิทิน

---

### 5.5 Backlog / แผนค้าง (`/backlog`)

| รายการ | รายละเอียด |
|--------|------------|
| **สิทธิ์** | `backlog.read` |
| **จุดประสงค์** | รายการ WO ค้างแผน แยกตามช่วงเวลา / เงื่อนไข backlog |

**ขั้นตอน**

1. ตั้ง **ตัวกรอง** (วันที่, กิจกรรม Z1/Z2/Z5, สถานะ, ประเภทงาน)
2. กด **ค้นหา** — ตารางแสดง WO ค้าง
3. เปิด WO จากแถว → modal รายละเอียด · ไปจ่ายงานใน Planning/Calendar

---

### 5.6 ใบงาน / Work Orders (`/work-orders`)

| รายการ | รายละเอียด |
|--------|------------|
| **URL** | `/work-orders` · `/work-orders/:id` (เปิด modal WO โดยตรง) |
| **สิทธิ์** | `work-orders.read` · แก้ทีม `work-orders.write` |
| **จุดประสงค์** | ค้นหา WO แบบละเอียด · สรุป filter · จัดทีม A/B/EE/UT แบบ batch |

**ตัวกรอง (เลือกได้หลายค่า — Ctrl/Cmd ค้าง)**

- คำค้น (WO, equipment, ฯลฯ)
- **ประเภทงาน** (MaintActivityType MAT 001–040 ใต้ ZB02) · Wktype legacy ZB* · Status · Work center · Team · Functional loc · Equipment
- ช่วงวันที่ (ถ้าตั้ง)

**ขั้นตอนค้นหา**

1. กรอก/เลือกตัวกรอง
2. กด **ค้นหา**
3. ดูตาราง + แถบสรุป Filter Detail (จำนวน WO, ชั่วโมง, แยกทีม)
4. **คลิกแถว** หรือเปิด `/work-orders/12345` → **Work Order Detail Dialog**

**Modal รายละเอียด WO (แท็บหลัก)**

| แท็บ | เนื้อหา |
|------|---------|
| ข้อมูลทั่วไป | Header WO, สถานะ SAP, ทีม, phase badge (สร้าง/จ่าย/ปิด/QC) |
| Task / Planning | รายการ task, การวางแผน |
| Confirm | ปิดงาน supervisor · เวลาช่าง · **QC** · รูป Before/After |
| อื่นๆ | ตามที่ implement ใน dialog |

**รูปยืนยัน:** โหลดรูป confirm **เฉพาะเมื่อเปิดแท็บ Confirm → รูป** (ไม่ดึงทั้งก้อนตอนเปิด modal) — จำนวนรูปแสดงจาก `imageCount` ก่อนเข้าแท็บ

**จัดทีมแบบ batch**

1. เลือก checkbox หลายแถว
2. เลือกทีม A / B / EE / UT
3. บันทึก — UI อัปเดตทันที (optimistic) โดยไม่กระตุกทั้งตาราง

---

### 5.7 รับรองงาน / Confirmation (`/confirmation`)

| รายการ | รายละเอียด |
|--------|------------|
| **สิทธิ์** | `confirmation.read` · ปิดงาน/import `confirmation.import` · export `confirmation.export` |
| **จุดประสงค์** | ค้นหา WO · บันทึกปิดงาน · รูป · Mass Confirm · คิว QC |

**แท็บ / ส่วนหลัก**

1. **ค้นหา WO** — autocomplete หมายเลขใบงาน
2. **บันทึกปิดงาน** — ฟอร์ม close + รูป + เวลา (เทียบ modal 3 แท็บ PHP)
3. **Mass Confirm** — เลือกหลาย WO (สูงสุด **44 รายการ** ต่อชุด SAP) → ปิดครั้งเดียว
4. **คิวรอ Admin QC** (`ConfirmQcPendingQueue`) — สำหรับ Admin อนุมัติก่อนนับ % และ export

**Flow QC (สรุป)**

```
ช่างบันทึกรูป/เวลา/ปิดงาน → สถานะ QC = pending
→ Admin อนุมัติ (approved) → นับใน Personnel Confirm + Export SAP
→ หรือส่งกลับ (rejected) ให้แก้แล้วส่งใหม่
```

ดูรายละเอียด: [`CONFIRM-QC-FLOW.md`](customer-requirements/CONFIRM-QC-FLOW.md)

**หลัง Mass Confirm สำเร็จ**

- แผง **MassConfirmExportPanel** แสดงสรุป QC ต่อ WO
- Admin อนุมัติ QC ทั้งชุด → ดาวน์โหลด **CONFIRM_OUT CSV / Excel** (เฉพาะชุดนั้น)

---

### 5.8 ส่งออก Confirm — Preview (`/confirmation/export`)

| รายการ | รายละเอียด |
|--------|------------|
| **สิทธิ์** | `confirmation.read` · ดาวน์โหลด `confirmation.export` หรือ `confirmation.import` |
| **จุดประสงค์** | ดูตาราง `view_exportconfirm` ก่อนส่ง SAP |

**ขั้นตอน**

1. ระบบโหลดตัวอย่างแถวที่พร้อม export (ตาม scope ALL / OWN wkctr)
2. ตรวจคอลัมน์ · จำนวนแถว
3. กด **ส่งออก Excel** หรือ **CSV สำหรับ SAP** (ปุ่มมีไอคอน + ข้อความไทย)
4. ส่งไฟล์ตามขั้นตอน SAP ของโรงงาน

---

## 6. แผน PM/CM & นำเข้า SAP

### 6.1 แผน PM/CM (`/planning`)

| รายการ | รายละเอียด |
|--------|------------|
| **สิทธิ์** | `planning.read` · จ่ายงาน `planning.assign` |
| **จุดประสงค์** | รายการ WO เปิด/ปิด · จ่ายงานให้ work center / ทีม |

**ขั้นตอน**

1. ดูรายการงานเปิด
2. เลือก WO → dialog **จ่ายงาน** (multi-assign ได้ถ้ามีสิทธิ์)
3. ยืนยัน — สถานะบนปฏิทิน/WO อัปเดต

---

### 6.2 SAP CSV / Integration (`/integration`)

| รายการ | รายละเอียด |
|--------|------------|
| **สิทธิ์** | `iw37n.read` · import ตาม `iw37n.import` / confirmation |
| **จุดประสงค์** | ศูนย์รวม **นำเข้า/ส่งออก** ระหว่าง SAP กับ PM |

**แท็บหลัก (ตามสิทธิ์)**

| แท็บ | งาน |
|------|-----|
| IW37N | ดู batch นำเข้า · ดาวน์โหลด log |
| Confirm → SAP | Preview + ส่งออก CONFIRM_OUT (Excel/CSV) |
| งานอื่น | Integration jobs / สถานะ (ถ้าเปิดใช้) |

**ส่งออก Confirm**

1. เปิดแท็บ Confirm
2. ตรวจจำนวนแถว + scope สิทธิ์
3. **ส่งออก Excel** / **CSV สำหรับ SAP**
4. หรือไป **ดูตัวอย่างเต็ม** ที่ `/confirmation/export`

---

### 6.3 IW37N / นำเข้า SAP (`/iw37n`)

| รายการ | รายละเอียด |
|--------|------------|
| **สิทธิ์** | `iw37n.read` · `iw37n.import` · `iw37n.write` |
| **จุดประสงค์** | อัปโหลด export IW37N จาก SAP · ตรวจ batch · แก้แถว · ส่ง job |

**ขั้นตอนนำเข้า**

1. เตรียมไฟล์ **SAP ALV (Dynamic List Display)** หรือรูปแบบที่ระบบรองรับ (มี Order, Bsc start, FunctLoc)
2. กด **เลือกไฟล์** → **ตรวจสอบ (Preview)** — ดูจำนวนแถว OK/ผิด
3. แก้ mapping ถ้ามีแถวเตือน · ยืนยันนำเข้า
4. หลังสำเร็จ — ดู batch ในตาราง · **ดาวน์โหลด CSV/Excel** ของ batch · เปิดดูแถวใน dialog

**กรณีไฟล์ซ้ำ (duplicate):** ระบบแจ้ง batch เดิม · ลิงก์ไป batch ซ้ำ

**ข้อจำกัด XLSX:** การดาวน์โหลดอาจจำกัดจำนวนแถว (เช่น 5000) — ใช้ CSV หรือแบ่งช่วงถ้าข้อมูลมาก

---

### 6.4 Master Plan (`/master-plan`) และ Master Data SAP (`/master-data`)

| รายการ | รายละเอียด |
|--------|------------|
| **Master Plan** | `/master-plan` — แผน PM ประจำปี EE / ME / PK จาก Excel ลูกค้า |
| **Master Data (SAP)** | `/master-data` — ตารางอ้างอิง SAP (~17 กลุ่ม) |
| **สิทธิ์** | `master-data.read` · แก้ master SAP ใช้ `master-data.write` |
| **เมนู sidebar** | Master Plan → `/master-plan` · Master Data (SAP) → `/master-data` |

**Master Plan — ดูและแก้ไข (Phase 2)**

1. เปิด **`/master-plan`** (เมนู Master Plan)
2. เลือกแท็บ:
   - **Process · ไฟฟ้า (EE)** — แผน PM ไฟฟ้า ฝั่งหน้าเตา
   - **Process · เครื่องกล (ME)** — แผน PM เครื่องกล ฝั่งหน้าเตา
   - **Packing (PK)** — แผน PM ห้องแพ็ค
3. เลือก **แท็บ sheet** ตามชื่อใน Excel ลูกค้า (เช่น SCHAAF#1, BCP, STAX) — EE/ME ใช้แท็บเลื่อน · PK ใช้ช่องค้นหา sheet
4. ดูตาราง PM — คอลัมน์ต่อ sheet · Zone / Machine List แสดง fill-down เหมือน Excel · scroll แนวนอนแล้ว Zone/Machine List ติดซ้าย
5. **แก้ไขเซลล์** (ต้องมี `master-data.write`) — ดับเบิลคลิกเซลล์บน detail sheet · Zone / Machine List อ่านอย่างเดียว · ไอคอน **?** ที่หัวคอลัมน์ = คำอธิบาย (EN/TH) · Enter บันทึก · Esc ยกเลิก
6. **ประวัติการแก้ไข** — ปุ่ม **Change history** (สีน้ำเงิน) เปิดแผงกลางจอ · กรองตาม sheet / วันที่ / ผู้แก้ / ชื่อคอลัมน์ · แสดง before/after · **Go to row** กระโดดไปแถว · **Export CSV** ดาวน์โหลด log
7. **ลิงก์แถว** (คอลัมน์ **ลิงก์** ด้านขวา) — เปิดเมนูเพื่อไป IW37N (กรอง mntplan) · เปิด WO modal · PM 3-phase · Task list / Equipment master · badge แสดงจำนวน WO ที่ match

**Master Plan — นำเข้า / ส่งออก / เผยแพร่ (Phase 4)**

ปุ่มที่หัวหน้า (ต้องมี `master-data.write` สำหรับ Import / Publish):

| ปุ่ม | หน้าที่ |
|------|--------|
| **Import Excel** | อัปโหลดไฟล์ `.xlsx` จากลูกค้า → บันทึกเป็น **draft** (version ใหม่) · แสดงสรุป diff ถ้าโครง sheet ไม่ตรงจะ reject |
| **Export Excel** | ดาวน์โหลด workbook **published** ปัจจุบันเป็น `.xlsx` (round-trip ตามข้อมูลใน DB) |
| **Export draft** | แสดงเมื่อมี draft — ดาวน์โหลด draft ก่อนเผยแพร่ |
| **Publish to task list** | เลื่อน draft เป็น published (ถ้ามี) · sync แถว detail ไป **`tbtasklist`** · แถวที่ข้อมูลไม่ครบถูกข้าม |

**สถานะ sync (badge หัวหน้า):**

| Badge | ความหมาย |
|-------|----------|
| **Task list in sync** | เคย Publish แล้ว · ไม่มี draft ค้าง |
| **Draft pending** | มี draft จาก Import รอ Publish |
| **Not published to task list yet** | ยังไม่เคย Publish ไป task list |
| **Draft vN** | มี workbook draft version N |

**วงจรอัปเดตแผนประจำปี (แนะนำ):** ลูกค้าส่ง Excel ใหม่ → **Import** → ตรวจ diff บนจอ → **Publish** → ตรวจ Task list ที่ `/master-data` แท็บ Task list

**ภาษาและความเหมือนต้นฉบับ (Fidelity — ไม่แปลข้อมูล Excel)**

| รายการ | พฤติกรรม |
|--------|----------|
| **ชื่อคอลัมน์** | แสดงตามไฟล์ Excel ของ sheet นั้น (เช่น `Zone`, `PM list`, `freq (day)`) — เก็บใน DB เป็น `column_headers_json` · **ไม่แปล** เมื่อสลับ EN/ไทย |
| **ค่าในเซลล์** | ข้อความ PM list ภาษาไทย/อังกฤษ แสดง **ตามที่ seed จาก Excel** · ไม่ผ่าน i18n |
| **ชื่อ sheet** | ตรงไฟล์ลูกค้า (เช่น `PK1 (Production)`) |
| **สิ่งที่แปลได้** | ปุ่ม เมนู ข้อความช่วยเหลือ ตัวกรอง changelog — คีย์ `masterPlan.*` / `masterPlanPage.*` · ไอคอน **?** ที่หัวคอลัมน์ |

**UAT Phase 1.5–4 (ตรวจแล้วใน dev):**

| รายการ | ผล |
|--------|-----|
| หน้า Master Plan ไม่มีแท็บ Equipment / Material | ✅ แยก route `/master-plan` — SAP อยู่ `/master-data` |
| สลับ sheet STAX → BCP (EE) ≤ 3 คลิก | ✅ 2 คลิก (แท็บ sheet) |
| PK ค้นหา `PK1 (Production)` | ✅ dropdown + search บน PK (37 sheets) |
| แก้เซลล์ + changelog who/when/before/after | ✅ Phase 2 |
| ลิงก์แถว → IW37N / WO / PM 3-phase | ✅ Phase 3 |
| Import draft · Export xlsx · Publish → task list | ✅ Phase 4 |

**ลิงก์เก่า:** `/master-data?entity=pm-master-ee|me|pk` → redirect ไป `/master-plan?discipline=EE|ME|PK`

**Dev — โหลดข้อมูลครั้งแรก:** `cd PM-Pepsi-App/backend && npm run seed:master-plan`

**Master Data (SAP)** — `/master-data`

1. เลือกแท็บประเภทข้อมูล (ไม่มีแท็บ Master Plan · ปุ่ม **เปิด Master Plan** ที่หัวหน้า)
2. **ค้นหา/กรอง** · **เพิ่ม/แก้/ลบ** (ถ้ามีสิทธิ์ write)
3. บางแท็บรองรับ **นำเข้า CSV/Excel**

**Hub สรุป:** `/admin/master` — ลิงก์และ KPI ตาราง master

---

## 7. ชั่วโมงงาน & บุคลากร

### 7.1 Manhours (`/manhours`)

| รายการ | รายละเอียด |
|--------|------------|
| **สิทธิ์** | `manhours.read` |
| **จุดประสงค์** | ค้นหาช่าง · ดูกราฟชั่วโมง · สรุปตามช่วงวันที่ |

**ขั้นตอน**

1. ตั้ง **วันที่จาก–ถึง**
2. ค้นหา idwkctr / ชื่อ
3. ดูกราฟ Bar/Pie และตารางสรุป
4. รูปช่างโหลดแบบ lazy + ตัวอักษรย่อเมื่อไม่มีรูป

---

### 7.2 จัดการ Man Hour — Admin (`/manhours/admin`)

| รายการ | รายละเอียด |
|--------|------------|
| **สิทธิ์** | `manhours.admin` |
| **จุดประสงค์** | CRUD ชั่วโมง · นำเข้า ManHours.xlsx |

**นำเข้า Excel**

- คอลัมน์: `idwkctr`, `StartDate`, `EndDate`, `WH`, `OT1`, `OT1.5`, `OT1HOL`, `OT2`, `OT3`
- ข้าม **2 แถวแรก** ของไฟล์ Excel (เทียบ PHP)
- ปุ่ม **รูปแบบไฟล์** แสดงคำอธิบายคอลัมน์

---

### 7.3 ดู Worktime ทั้งหมด (`/worktime`)

| รายการ | รายละเอียด |
|--------|------------|
| **สิทธิ์** | `manhours.read` |
| **จุดประสงค์** | ตาราง worktime รวมทุกคน — ตรวจสอบรายละเอียดรายวัน |

ใช้ตัวกรองวันที่ + ค้นหา · เลื่อนตารางแนวนอนได้บนจอเล็ก

---

### 7.4 Personal Dashboard (`/personnel`)

| รายการ | รายละเอียด |
|--------|------------|
| **สิทธิ์** | `personnel.read` |
| **จุดประสงค์** | แดชบอร์ดรายบุคคล — สรุปงาน/ชั่วโมง/รูปโปรไฟล์ |

**ขั้นตอน:** เลือกหรือล็อกอินเป็นผู้ใช้ที่มีสิทธิ์ดู · ดูการ์ดสรุป · ลิงก์ไป confirm / admin ตามบทบาท

---

### 7.5 Personnel Confirmation (`/personnel/confirm`)

| รายการ | รายละเอียด |
|--------|------------|
| **สิทธิ์** | `personnel.confirm.read` |
| **จุดประสงค์** | % การปิดงานรายคน · แท็บรอ Admin QC |

**ขั้นตอน**

1. เลือกช่วงวันที่ / สัปดาห์
2. ดูตารางรายชื่อ + เปอร์เซ็นต์
3. แท็บ **รอ Admin QC** — รายการที่ยังไม่อนุมัติ (ไม่นับใน % จนกว่า approved)

---

### 7.6 ผู้ใช้งาน (เดิม Personnel Admin)

| รายการ | รายละเอียด |
|--------|------------|
| **URL เดิม** | `/personnel/admin` → redirect **`/admin/users`** |
| **สิทธิ์** | `admin.users.read` / `admin.users.write` |

ดู [§10.3 ผู้ใช้งาน](#103-ผู้ใช้งาน-adminusers)

---

## 8. รายงาน & ตรวจสอบ

### 8.1 รายงานรวม (`/reports`)

| รายการ | รายละเอียด |
|--------|------------|
| **สิทธิ์** | `reports.read` |
| **จุดประสงค์** | ทางเข้ารายงาน KPI · ลิงก์ไป Eng Utilization, Auditor, Activity Log |

ใช้เป็นศูนย์กลาง — เลือกรายงานที่ต้องการจากการ์ด/ลิงก์

---

### 8.2 Auditor Hub (`/reports/audit`)

| รายการ | รายละเอียด |
|--------|------------|
| **สิทธิ์** | `reports.read` |
| **จุดประสงค์** | มุมมอง auditor — สรุป/ลิงก์ตรวจสอบข้อมูล (ตาม implementation) |

---

### 8.3 Activity Log (`/activity-log`)

| รายการ | รายละเอียด |
|--------|------------|
| **สิทธิ์** | `reports.read` |
| **จุดประสงค์** | บันทึกกิจกรรม — คน · เวลา · WO · action |

**ขั้นตอน**

1. เลือก **ช่วงวันที่** (ReportsDateFilter — บนมือถือเป็น drawer + ปุ่ม **นำไปใช้**)
2. ค้นหาข้อความ (คน, WO, Line, action)
3. ดูตารางสูงสุด 200 แถว · หัวตารางติดเมื่อเลื่อน

---

### 8.4 Manhour HR (`/manhours-hr`)

| รายการ | รายละเอียด |
|--------|------------|
| **สิทธิ์** | `manhours.read` |
| **จุดประสงค์** | รายงาน HR — สรุปชั่วโมงสำหรับ HR (เทียบรายงานพิมพ์/ส่ง HR) |

---

### 8.5 Eng Utilization — สรุปรายสัปดาห์ (`/summary-weekly`)

| รายการ | รายละเอียด |
|--------|------------|
| **สิทธิ์** | `reports.read` |
| **จุดประสงค์** | กราฟ Technician Utilization · ตาราง week-to-week · แจ้งรูปช่างขาด |

**ขั้นตอน**

1. เลือกช่วงวันที่ / สัปดาห์
2. ดูกราฟ **chart** (utilization แบบ legacy) หรือ **chart2** (ชั่วโมงรวม)
3. กด **ดูกราฟแบบขยาย** → เปิด `/summary-weekly/chart/full` ในแท็บใหม่
4. ตรวจรายชื่อ **ไม่มีรูป** — ลิงก์ไปจัดการรูปที่ Admin users (ถ้ามีสิทธิ์)

---

### 8.6 กราฟขยายเต็มจอ (`/summary-weekly/chart/full`)

| รายการ | รายละเอียด |
|--------|------------|
| **สิทธิ์** | `reports.read` |
| **พารามิเตอร์ URL** | `?from=YYYY-MM-DD&to=...&variant=chart|chart2` |
| **จุดประสงค์** | กราฟเต็มจอสำหรับประชุม / **พิมพ์** |

**ขั้นตอนพิมพ์**

1. โหลดกราฟให้ครบ
2. กด **พิมพ์กราฟ** หรือ Ctrl+P
3. ตัวกรองและปุ่มนำทางจะถูกซ่อน — เหลือหัวกระดาษ (ชื่อกราฟ, ช่วงวันที่, เวลาพิมพ์) + กราฟ
4. ตั้งค่าเครื่องพิมพ์เป็น **แนวนอน (Landscape)** แนะนำ

---

## 9. ระบบ & ตั้งค่าผู้ใช้

### 9.1 User Log (`/user-log`)

| รายการ | รายละเอียด |
|--------|------------|
| **สิทธิ์** | `user-log.read` |
| **จุดประสงค์** | ประวัติการใช้งาน/ล็อกอินของผู้ใช้ (ตามที่ backend บันทึก) |

---

### 9.2 ตั้งค่า (`/settings`)

| รายการ | รายละเอียด |
|--------|------------|
| **สิทธิ์** | `admin.settings.read` (ผู้ใช้ทั่วไปอาจไม่เห็น) |
| **จุดประสงค์** | โปรไฟล์ · สุขภาพ API · รายชื่อผู้ใช้ (สำหรับ admin ระดับหนึ่ง) |

**แท็บโปรไฟล์:** เปลี่ยนรหัสผ่าน (ถ้ามีฟอร์ม Change Password) · ข้อมูล work center

---

## 10. โซนผู้ดูแลระบบ `/admin`

เข้าได้เมื่อมีบทบาท **admin** และ permission ตามหน้า — layout แยกจากแอปหลัก (Admin shell, breadcrumb, tour)

### 10.1 Admin Console (`/admin`)

- KPI สรุป · quick links ไปทุกหน้า admin ที่เข้าถึงได้
- เริ่ม **Admin Tour** (แนะนำทีละขั้น)

### 10.2 บทบาท & สิทธิ์ (`/admin/roles`)

| งาน | ขั้นตอน |
|------|---------|
| ดูบทบาท | เลือก role จากรายการ |
| แก้สิทธิ์ | ติ๊กในตาราง Permission matrix |
| บันทึก | ยืนยัน — มีผลกับเมนูและ API ทันที |

### 10.3 ผู้ใช้งาน (`/admin/users`)

| งาน | ขั้นตอน |
|------|---------|
| ค้นหา | กรองสถานะ, บทบาท, รูปขาด |
| เพิ่ม/แก้ | ฟอร์ม 3 แท็บ — ข้อมูล work center, บัญชี, **รูป** (WebP หลังอัปโหลด) |
| รีเซ็ตรหัส | ปุ่มตามสิทธิ์ · อาจต้องยืนยันวลี |
| Impersonate | เข้าใช้แทนผู้ใช้ (สิทธิ์ `admin.users.impersonate`) — มีแถบเตือนด้านบน |

### 10.4 Menu Builder (`/admin/menu`)

- จัดลำดับเมนู sidebar (ลากวาง)
- ซิงค์จาก PHP (ถ้าใช้ migration จากระบบเก่า)
- ตั้งค่า **รูปแบบเมนูหลัก** (Nav layout card)

### 10.5 ธีม & โลโก้ (`/admin/branding`)

- ชื่อแอป, สีหลัก/สำเร็จ/เตือน/อันตราย
- อัปโหลด **โลโก้**, favicon, พื้นหลัง login
- Typography · ขนาด asset · ตัวอย่าง Theme preview

### 10.6 ตั้งค่าระบบ (`/admin/settings`)

- Locale, feature flags, ขีดจำกัด upload
- Board kiosk, maintenance mode, session TTL (ตามฟิลด์ที่เปิดใช้)

### 10.7 Master Data Hub (`/admin/master`)

- สรุปตาราง master 17 กลุ่ม · ลิงก์ไป `/master-data`

### 10.8 Audit log (`/admin/audit`)

| งาน | ขั้นตอน |
|------|---------|
| ค้นหา | วันที่, action, ผู้ใช้ |
| ดู diff | คลิกแถว → dialog แสดง before/after |
| ส่งออก | ปุ่ม **ส่งออก CSV** (ไอคอน + ไทย) |
| ลบเก่า | ตาม retention (สิทธิ์ delete) |

### 10.9 สุขภาพระบบ (`/admin/health`)

- สถานะ DB, disk, migration
- รัน migration / ตรวจเวอร์ชัน (ตามปุ่มที่เปิดใช้)

### 10.10 สำรอง & กู้คืน (`/admin/backup`)

| งาน | ขั้นตอน |
|------|---------|
| สำรองทันที | สร้าง backup pg_dump |
| ดาวน์โหลด | จากรายการ backup |
| กู้คืน | อัปโหลดไฟล์ · ยืนยันวลีอันตราย |
| ตั้งเวลา | cron schedule (ถ้ามี) |

### 10.11 ประกาศ (`/admin/announcements`)

- สร้างประกาศแบบ banner ด้านบนแอป
- กำหนดวันเริ่ม–สิ้นสุด · ข้อความไทย

### 10.12 ความปลอดภัย (`/admin/security`)

- ดู failed login, IP ที่ถูกบล็อก
- นโยบายรหัสผ่าน / lockout (ตาม implementation)

### 10.13 เกี่ยวกับระบบ (`/admin/about`)

- เวอร์ชันแอป, API, license
- ข้อมูล vendor / ติดต่อ

---

## 11. เส้นทางพิเศษ & ข้อผิดพลาด

| URL | คำอธิบาย |
|-----|----------|
| `/error/403` | ไม่มีสิทธิ์ |
| `/error/404` | ไม่พบหน้า |
| `/error/500` | ข้อผิดพลาดเซิร์ฟเวอร์ |
| `/dev/ui` | Playground คอมโพเนนต์ (เฉพาะ build DEV) |

หน้า error ใช้ **ErrorPageShell** — ข้อความภาษาไทย · ปุ่มกลับหน้าหลัก

---

## 12. Workflow แนะนำ (วันทำงาน)

### 12.1 Planner — รับงานจาก SAP

```
IW37N import (/iw37n)
  → ตรวจ batch / แก้แถวผิด
  → Backlog (/backlog) ดูค้าง
  → Planning (/planning) จ่ายงาน
  → Calendar (/calendar) จัดวัน + ทีม
```

### 12.2 ช่าง — ปิดงานและรูป

```
Work Orders (/work-orders) หรือ Calendar
  → เปิด WO → แท็บ Confirm
  → อัปโหลดรูป Before/After + เวลา + ปิดงาน
  → รอ Admin QC (ถ้ายังไม่ approved)
```

### 12.3 Admin — QC และส่ง SAP

```
Confirmation (/confirmation) คิว QC
  → อนุมัติทีละใบ หรือหลัง Mass Confirm ทั้งชุด
  → Integration หรือ /confirmation/export
  → ดาวน์โหลด CSV/Excel CONFIRM_OUT → SAP
```

### 12.4 HR / รายงาน — สัปดาห์ละครั้ง

```
นำเข้า Manhours (/manhours/admin)
  → Eng Utilization (/summary-weekly)
  → พิมพ์กราฟ (/summary-weekly/chart/full) สำหรับประชุม
  → Personnel Confirm (/personnel/confirm) ตรวจ %
```

---

## 13. คำถามที่พบบ่อย

**ถาม:** ทำไมเมนูไม่เหมือนเพื่อนร่วมทีม?  
**ตอบ:** เมนูมาจาก RBAC — ให้ Admin ตรวจบทบาทที่ `/admin/roles` และผู้ใช้ที่ `/admin/users`

**ถาม:** Mass Confirm เกิน 44 รายการ?  
**ตอบ:** แบ่งหลายชุด — ข้อจำกัด SAP/legacy

**ถาม:** Export Confirm ไม่มีแถว?  
**ตอบ:** ต้อง **Admin QC อนุมัติ** ก่อน — ดูคิวที่ `/confirmation`

**ถาม:** รูปช่างไม่ขึ้น?  
**ตอบ:** อัปโหลดที่ Admin users · หรือยังไม่มี `hasImage` — ระบบแสดงตัวอักษรย่อแทน

**ถาม:** ปฏิทินลากไม่ได้บนมือถือ?  
**ตอบ:** กดค้าง event ~0.4 วินาที แล้วลาก · ต้องมีสิทธิ์ calendar write

**ถาม:** ลืมรหัสผ่าน?  
**ตอบ:** ติดต่อ Admin รีเซ็ตที่ `/admin/users` — ไม่มี self-service ถ้าไม่ได้เปิดใช้

---

## เอกสารที่เกี่ยวข้อง

| เอกสาร | เนื้อหา |
|--------|---------|
| [`customer-requirements/CONFIRM-QC-FLOW.md`](customer-requirements/CONFIRM-QC-FLOW.md) | Flow QC ก่อน export |
| [`customer-requirements/ENG-UTILIZATION-2026.md`](customer-requirements/ENG-UTILIZATION-2026.md) | รายงาน utilization |
| [`customer-requirements/UI-POLISH-PHASES.md`](customer-requirements/UI-POLISH-PHASES.md) | เกณฑ์ UI/UX รายหน้า |
| [`WORK-PHASES.md`](WORK-PHASES.md) | แผนพัฒนาระบบ |
| [`parity-pending/README.md`](parity-pending/README.md) | รายการเทียบ PHP |

---

*คู่มือนี้สร้างจาก route และ UI ปัจจุบันของ PM-Pepsi-App — หากหน้าจอไม่ตรง ให้ยึดข้อความบนหน้าจริงเป็นหลัก และแจ้งทีมพัฒนาเพื่ออัปเดตเอกสาร*
