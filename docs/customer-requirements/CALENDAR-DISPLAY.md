# ปฏิทิน Work Scheduling — การแสดงผล event

อัปเดต: **9 มิ.ย. 2026**  
หน้า: `/calendar`  
อ้างอิง: สไลด์ลูกค้า Drag & Drop + Reason Code

---

## Title บน event

| ส่วน | รูปแบบ |
|------|--------|
| เลข WO | **เต็ม** ตาม SAP (เช่น `4001558092`) |
| ประเภท | `{wkorder} / {wktype}` เช่น `4001558092 / ZB02` |
| ย้ายแผน | ต่อท้าย `/N` เมื่อ `tbmoveplan.mpcount = N` เช่น `4000001 / PM01/2` = ย้ายครั้งที่ 2 |

---

## สี event (สไลด์ลูกค้า)

| สี | ความหมาย | เงื่อนไข |
|----|----------|----------|
| **แดง** `#FF3B30` | เลยกำหนด | CRTD/REL · วันแผนผ่านมาแล้ว · Reason **บังคับ** |
| **ส้ม** `#F7941D` | มีเลข WO | CRTD/REL · ยังไม่เลยกำหนด · มี `wkorder` · Reason **บังคับ** |
| **น้ำเงิน** `#4DA6FF` | ประมาณการ | CRTD/REL · ยังไม่เลยกำหนด · **ไม่มี**เลข WO · Reason **ไม่บังคับ** |
| **เขียว** `#7AC943` | เสร็จแล้ว | QC อนุมัติ / % ปิด 100 / TECO ปิด — **ลากย้ายไม่ได้** |
| **🔔** | เตือน TECO | `syst = TECO` แต่ยังไม่ปิดงาน/confirm ในโปรแกรม |

API `displayStatus`: `overdue` · `moved` (ส้ม = มี WO) · `in_progress` (น้ำเงิน = estimate) · `completed`

Legend แสดงใต้ตัวกรองบนหน้า `/calendar`

---

## การแสดง Z1 / Z2 / Z5

ปุ่ม **รวมทั้งหมด · Z1 · Z2 · Z5** — กรอง event ตาม `mat` (กิจกรรม) บนปฏิทิน  
แยกจาก multiselect **กิจกรรม** ในแถบตัวกรอง (ใช้ร่วมกันได้)

---

## ย้ายแผน (Drag & Drop)

ลาก event ไปวันใหม่ → เปิด **MovePlanDialog**:

- **Reason Code** จาก `app.tbreason` (01–04, 99)
- **Comment** → `tbmoveplan.resoncom`
- **บังคับ** เมื่องาน **แดง** (เลยกำหนด) หรือ **ส้ม** (มีเลข WO)
- **ไม่บังคับ** เมื่องาน **น้ำเงิน** (ประมาณการ · ไม่มี WO)
- **เขียว / TECO ปิดแล้ว** — ห้ามลาก (`canMovePlan: false`)

---

## Description (tooltip)

ชี้เมาส์ที่ event — popup `CalendarEventHoverCard` เช่น:

- Work Order · Start/End Date  
- Functional Location · Equipment  
- Work Centre · Activity Type (Z1/Z2/Z5)  
- Operation (opac + short text) · Operation long text  
- จำนวนครั้งย้ายแผน · สถานะการทำงาน  

---

## โค้ด

| ส่วน | ไฟล์ |
|------|------|
| กฎ Reason + WO | [`calendar-move-policy.ts`](../../PM-Pepsi-App/backend/src/lib/calendar-move-policy.ts) |
| สร้าง title / สี / description | [`calendar-event-display.ts`](../../PM-Pepsi-App/backend/src/lib/calendar-event-display.ts) |
| API events | [`calendar.ts`](../../PM-Pepsi-App/backend/src/services/calendar.ts) |
| UI legend + Z1/Z2/Z5 | [`CalendarColorLegend.tsx`](../../PM-Pepsi-App/frontend/src/components/scheduling/CalendarColorLegend.tsx) · [`CalendarPage.tsx`](../../PM-Pepsi-App/frontend/src/features/calendar/CalendarPage.tsx) |

---

## เอกสารที่เกี่ยวข้อง

- [`ACTIVITY-TYPE-FILTER.md`](ACTIVITY-TYPE-FILTER.md) — ตัวกรอง mat Z1/Z2/Z5  
- [`USER-MANUAL-TH.md`](../USER-MANUAL-TH.md) §5.3
