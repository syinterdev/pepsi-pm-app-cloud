# MaintActivityType — Type ZB02 (ประเภทงาน)

อัปเดต: **2026-06-02**  
ใช้ใน: `/calendar`, `/work-orders`, `/backlog` — หัวข้อ **ประเภทงาน**

---

## ที่มา

ลูกค้าส่งตาราง **MaintActivityType 19 Entries** — Order Type **ZB02** พร้อมรหัส **MAT** และคำอธิบายภาษาอังกฤษ

---

## รายการ 19 ประเภท (dropdown)

| MAT | MAT Description |
|-----|-----------------|
| 001 | Inspection & Cond. Monitoring |
| 002 | Preventive Maintenance |
| 007 | Cleaning |
| 009 | Work out of inspection |
| 013 | Audit (AIB) / Food Safety |
| 016 | Meeting |
| 017 | Assistance to Ops |
| 018 | Statutory |
| 019 | Training |
| 022 | Environmental & Sustainability |
| 023 | Safety |
| 027 | Modification |
| 029 | RCA (Root Cause Analysis) |
| 033 | Lubrication |
| 034 | Calibration |
| 035 | Improve Perf to Spec (IPS) |
| 038 | Maintenance - Entry list WM |
| 039 | Operations - Entry list WM |
| 040 | Dry run - Entry list WM |

**ป้ายใน UI:** `002 = Preventive Maintenance`

---

## การกรองในระบบ

| หัวข้อ | ฟิลด์ DB | หมายเหตุ |
|--------|----------|----------|
| **กิจกรรม** | `mat` (Z1/Z2/Z5) | ระดับกว้าง Break Down / Preventive / Corrective |
| **ประเภทงาน** | `mat` (001–040) | MaintActivityType ภายใต้ ZB02 |

เมื่อเลือก MAT 002 ระบบค้นหา `mat IN ('002','2','02')` ใน IW37N

รหัส **ZB*** ที่ส่งผ่าน API (legacy) ยังกรองที่คอลัมน์ `wktype` ได้

---

## โค้ด / DB

| ส่วน | ไฟล์ |
|------|------|
| ข้อมูล canonical | [`maint-activity-type-zb02.ts`](../../PM-Pepsi-App/backend/src/data/maint-activity-type-zb02.ts) |
| Filter + expand mat | [`maint-activity-type.ts`](../../PM-Pepsi-App/backend/src/lib/maint-activity-type.ts) |
| Migration master | [`087_maint_activity_type_zb02.sql`](../../database/migrations/087_maint_activity_type_zb02.sql) |
| UI หมายเหตุ | [`MaintActivityTypeNote.tsx`](../../PM-Pepsi-App/frontend/src/components/scheduling/MaintActivityTypeNote.tsx) |

---

## เอกสารที่เกี่ยวข้อง

- [`WKTYPE-ZD-ZB-MAPPING.md`](WKTYPE-ZD-ZB-MAPPING.md) — ZB02 → ZD02 (Order Type ระดับ SAP)
- [`ACTIVITY-TYPE-FILTER.md`](ACTIVITY-TYPE-FILTER.md) — กิจกรรม Z1/Z2/Z5
