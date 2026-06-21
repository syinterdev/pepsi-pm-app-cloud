# รหัสช่าง Engineering (WorkCntr)

อัปเดต: **2026-06-01**  
แหล่ง: [`docs from customer/Code ช่าง Eng.xls`](../../docs%20from%20customer/Code%20ช่าง%20Eng.xls) · UI Confirm ผู้ปฏิบัติงาน (ลูกค้า)

---

## คำศัพท์ (สำคัญ)

| คำ | ฟิลด์ DB | ความหมาย |
|----|----------|----------|
| **WorkCntr** | `tbworkcenter.wkctr` | **รหัสช่าง** Engineering — PAC / PRO / UTI + เลข 3 หลัก (เช่น `PAC007`) |
| **รหัส HR** | `tbworkcenter.idwkctr` | รหัสพนักงาน / Login — **คนละฟิลด์กับ WorkCntr** |

---

## สรุป

| หัวข้อ | รายละเอียด |
|--------|-------------|
| **ฟิลด์ใน DB** | `app.tbworkcenter.wkctr` — รหัส PAC/PRO/UTI |
| **ใช้เมื่อ** | Grid เลือกช่างใน Confirm · `tbwrkclose` · Eng Utilization (`PAC010 (Narit)`) |
| **จำนวนช่าง Engineering** | **25 คน** (ไม่รวมกลุ่ม PAC000, UTI000 ฯลฯ) |
| **Migration** | [`085`](../../database/migrations/085_eng_technician_wkctr.sql) (ชื่อไทย) · [`086`](../../database/migrations/086_backfill_wkctr.sql) (backfill ข้อมูล import ผิดคอลัมน์) |
| **ข้อมูล canonical (โค้ด)** | [`PM-Pepsi-App/backend/src/data/eng-technician-codes.ts`](../../PM-Pepsi-App/backend/src/data/eng-technician-codes.ts) |
| **UI ปิดงานช่าง** | [`PersonnelClosePanel.tsx`](../../PM-Pepsi-App/frontend/src/components/confirmation/PersonnelClosePanel.tsx) |

---

## รายการรหัส 25 ช่าง

| รหัส | ชื่อ-สกุล (ไทย) | กลุ่ม |
|------|-----------------|-------|
| PAC007 | นางสาวพชรพรรณ ชัยเนตร | Packing |
| PAC009 | นายอนุวัฒน์ จันทร์ดี | Packing |
| PAC010 | นายกฤษฎิ์ อนนท์ | Packing |
| PAC011 | นายเจษฎา ปากกองวัน | Packing |
| PAC012 | นายนพดล จีดมั่น | Packing |
| PAC013 | นายออมทรัพย์ สกุลประกายพร | Packing |
| PAC014 | นายภูวดล คนดี | Packing |
| PAC015 | นายจักรพงษ์ กาบศรี | Packing |
| PRO007 | นายจิรวัฒน์ ปันขันธ์ | Process |
| PRO008 | นายจักรกริศน์ แสนขัติย์ | Process |
| PRO009 | นายเอกนรินทร์ ไชยวงค์ | Process |
| PRO010 | นายสรรเสริญ จายนวล | Process |
| PRO011 | นายธวัชชัย แก้วจันทร์ | Process |
| PRO013 | นายรัชชานนท์ นนทะธรรม | Process |
| PRO014 | นายสมนึก มงคลแก้ว | Process |
| PRO015 | นายเจษฎาพงศ์ ดวงแก้ว | Process |
| PRO016 | นายยุทธการ คาวิชา | Process |
| PRO017 | นายศรัล แป้นเพชร | Process |
| PRO019 | นายกฤษดา รังสิตวัฒนะ | Process |
| UTI004 | นายอานนท์ สุริยะมณี | Utility |
| UTI006 | นายกรณ์ เที่ยงโคกสูง | Utility |
| UTI007 | นายภาณุวัช ไชยชุมภู | Utility |
| UTI008 | นายอภินันท์ ถาคำ | Utility |
| UTI011 | นายประพันธ์ ผัดกันตุ้ย | Utility |
| UTI012 | นายณัฐวุฒิ มีงิ้ว | Utility |

---

## การคำนวณระยะเวลา (ตาราง Confirm ช่าง)

ตาม UI ลูกค้า (`AddClosePersonel.php` / `tbwrkclose`):

| รายการ | รูปแบบ |
|--------|--------|
| วันเวลาเริ่ม / สิ้นสุด | `DD.MM.YYYY HH:mm` (เช่น `22.05.2026 13:00`) |
| ระยะเวลา | `(เวลาสิ้นสุด − เวลาเริ่ม)` เป็น **นาที** แสดง `40.00 Min` |
| เก็บใน DB | `cstdate`, `cendate` (epoch วินาที) · `wktimewk` (integer นาที) · `wkunit = 'Min'` |
| Backend | [`personnel-close.ts`](../../PM-Pepsi-App/backend/src/services/personnel-close.ts) |
| Frontend format | [`personnel-close-format.ts`](../../PM-Pepsi-App/frontend/src/lib/personnel-close-format.ts) |

**ตัวอย่าง:** เริ่ม `22.05.2026 13:00` → สิ้นสุด `22.05.2026 13:40` = **40.00 Min**

---

## วิธีนำรหัสเข้า DB

```bash
# หลัง migration อื่น ๆ แล้ว
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/085_eng_technician_wkctr.sql
```

Migration จับคู่ด้วย **ชื่อ-สกุลไทย** แล้วตั้ง `wkctr` — **ไม่เปลี่ยน** `idwkctr` (login เดิม)

ตรวจหลังรัน:

```sql
SELECT wkctr, namewkctr, surnamewkctr
FROM app.tbworkcenter
WHERE wkctr ~ '^(PAC|PRO|UTI)[0-9]{3}$'
ORDER BY wkctr;
```

---

## API / UI

| ส่วน | พฤติกรรม |
|------|----------|
| `GET /api/v1/workcenters` | คืน **25 รหัส** ตามลำดับลูกค้า (ชื่อจาก DB หรือ fallback จาก `eng-technician-codes.ts`) |
| WO Dialog → แท็บ **เวลาช่าง** | Grid ปุ่มรหัส + ตารางระยะเวลา |
| Admin → Users | ฟิลด์ **Work center / รหัสช่าง** = `wkctr` |

---

## เอกสารที่เกี่ยวข้อง

- [`ENG-UTILIZATION-2026.md`](ENG-UTILIZATION-2026.md) — แถวรายงาน `PAC010 (Narit)`
- [`MEETING-SUMMARY-REQUIREMENTS.md`](MEETING-SUMMARY-REQUIREMENTS.md) § D.3 Automated Resource Allocation
- [`CONFIRM-QC-FLOW.md`](CONFIRM-QC-FLOW.md)
