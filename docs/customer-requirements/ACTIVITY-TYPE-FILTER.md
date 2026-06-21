# ตัวกรองกิจกรรม (Activity / mat) — Z1 / Z2 / Z5

อัปเดต: **2026-06-02**  
ใช้ใน: `/calendar`, `/work-orders`, `/backlog` — หัวข้อ **กิจกรรม** ในแถบ **ตัวกรองงาน**

---

## รายการที่แสดงใน UI (ลูกค้า)

| รหัสใน UI | ข้อความใน dropdown |
|-----------|-------------------|
| **Z1** | Z1 = Break Down Maintenance |
| **Z2** | Z2 = Preventive Maintenance |
| **Z5** | Z5 = Corrective Maintenance |

ผู้ใช้เลือก **Z1 / Z2 / Z5** — ระบบแปลงเป็นค่า `mat` ใน IW37N ก่อนค้นหา SQL

---

## แมปกับข้อมูล SAP / DB

| UI (filter) | ความหมาย | ค่า `mat` ใน `tbiw37n` (ตัวอย่าง) | Legacy master `tbactivitytype` |
|-------------|----------|-----------------------------------|--------------------------------|
| **Z1** | Break Down Maintenance | `1`, `01`, `Z1` | — |
| **Z2** | Preventive Maintenance | `2`, `02`, `Z2`, `PM01` | PM01 |
| **Z5** | Corrective Maintenance | `5`, `05`, `Z5`, `CM01` | CM01 |

> **หมายเหตุ:** ไฟล์ IW37N มักเก็บ `mat` เป็นตัวเลข `1` / `2` / `5` ไม่ใช่ PM01/CM01 — dropdown จึงแสดง Z1/Z2/Z5 ตามประชุมลูกค้า แทนการอ่าน label จาก `tbactivitytype` โดยตรง

---

## โค้ด

| ส่วน | ไฟล์ |
|------|------|
| รายการตัวเลือก + แปลง filter → SQL | [`PM-Pepsi-App/backend/src/lib/activity-type-label.ts`](../../PM-Pepsi-App/backend/src/lib/activity-type-label.ts) |
| Unit test | [`activity-type-label.test.ts`](../../PM-Pepsi-App/backend/src/lib/activity-type-label.test.ts) |
| Calendar filter API | [`calendar.ts`](../../PM-Pepsi-App/backend/src/services/calendar.ts) → `listCalendarFilterOptions()` |
| Work orders / Backlog | [`work-orders.ts`](../../PM-Pepsi-App/backend/src/services/work-orders.ts), [`backlog.ts`](../../PM-Pepsi-App/backend/src/services/backlog.ts) |

---

## เอกสารที่เกี่ยวข้อง

- [`WKTYPE-ZD-ZB-MAPPING.md`](WKTYPE-ZD-ZB-MAPPING.md) — ประเภทงาน ZB/ZD (คนละฟิลด์กับ mat)
- [`USER-MANUAL-TH.md`](../USER-MANUAL-TH.md) §5.3 ปฏิทิน Work Scheduling
- [`UAT-ROUND-1-TH.md`](UAT-ROUND-1-TH.md) §B.4 ปฏิทิน
