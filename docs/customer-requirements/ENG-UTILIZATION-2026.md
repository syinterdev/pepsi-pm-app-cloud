# Eng Utilization 2026 (ไฟล์ลูกค้า)

ไฟล์ต้นฉบับ: [`new file/Eng Utilization 2026.xlsx`](../../new%20file/Eng%20Utilization%202026.xlsx)

## แผ่นงานใน Excel

| Sheet | ใช้เมื่อ | คอลัมน์หลัก |
|-------|----------|-------------|
| Summary Daily | รายวัน | PM, Reactive, RCA, HR hour, %PM, %Reactive, Total, Average |
| Summary Weekly | รายสัปดาห์ | PM, Reactive, WO, HR hour, %PM, %Reactive, Total, Average |
| Summary Monthly | รายเดือน | เหมือน Weekly (บางแผ่นใช้ RCA แทน WO) |

- แถว = ช่างรูปแบบ `PAC010 (Narit)` (= work center + ชื่อ)
- **Total (Excel)** = %PM + %Reactive (ทศนิยมใน Excel ≈ 0–1, ในระบบแสดงเป็น 0–100%)
- **%PM** = ชั่วโมง PM (ZB02) ÷ HR hour  
- **%Reactive** = ชั่วโมง Reactive (ZB01/ZB05) ÷ HR hour  

## รูปช่าง — เก็บใน Database เท่านั้น

- อัปโหลดที่ **Admin → Users** → เก็บ `app.tbworkcenter.imgmember_data` (WebP BYTEA)
- แสดงที่ Eng Utilization / Manhours ผ่าน `GET /api/v1/personnel/:idwkctr/image` — **ไม่** อ่านจาก `imgMember/` บนเซิร์ฟร์
- ดู checklist ข้าม Phase ใน [`WORK-PHASES.md`](../WORK-PHASES.md) §หลักการข้าม Phase — รูปภาพเก็บใน Database

## การ integrate ใน PM-Pepsi-App

| Excel | ระบบ React |
|-------|------------|
| สรุปรายสัปดาห์ | หน้า **`/summary-weekly`** (ชื่อหัวข้อ Eng Utilization) |
| ข้อมูล | `POST /api/v1/reports/summary-weekly` — `tbmanhours`, `view_order`, `view_confirmation` |
| กราฟรายคน + รูป | `EngUtilizationTeamGrid` — รูปจาก `GET /api/v1/personnel/:idwkctr/image` (`imgmember_data` ใน DB) |
| กราฟ stacked % รวม | `EngUtilizationChart.tsx` |
| ตาราง | คอลัมน์ PM/Reactive/RCA ชม., %PM, %Reactive, Total (Excel), Total+RCA |
| Admin ไม่มีรูป | แถบเตือนบน `/summary-weekly` + แบนเนอร์ Go-live บน `/admin/users` (bulk ปิด TERMINATED) · กรอง **ไม่มีรูป** · Eng Util ไม่แสดงคนที่ปิดแล้ว |
| ช่วงเวลา | **รายวัน** = เมื่อวาน · **รายสัปดาห์** = 7 วันล่าสุด · **รายเดือน** = ต้นเดือน–วันนี้ · **รายปี** = ปีก่อนหน้าเต็มปี (เช่น 2025-01-01–2025-12-31 เมื่ออยู่ปี 2026) + ตัวกรองวันที่ |

## ไฟล์อื่นในโฟลเดอร์ `new file`

- [`IW47 Daily 12May2026.xlsx`](../../new%20file/IW47%20Daily%2012May2026.xlsx) — **Confirm IN จาก SAP รายวัน** (ALV) → ไม่ใช่กราฟ utilization โดยตรง — ดู [IW47-DAILY-SAMPLE.md](IW47-DAILY-SAMPLE.md)

## UAT แนะนำ

1. Login มีสิทธิ์รายงาน → เปิด `/summary-weekly`
2. หลัง import IW37N — ถ้าช่วงวันที่ไม่ทับข้อมูล SAP ระบบแสดงแถบเตือน + ปุ่ม **ใช้ช่วงข้อมูล SAP** (จาก `importCoverage` ใน API)
3. เลือกช่วงที่มี `tbmanhours` และ WO (PM **ZB02**, Reactive **ZB01/ZB05**) ในช่วงเดียวกัน
4. เปรียบตัวเลข 1–2 แถวกับ Excel (ยอมรับความต่างถ้า Excel เป็นช่วงคนละวัน)
5. เปลี่ยนช่วงวันที่ → กราฟและตาราง refresh จาก DB (ไม่ import Excel ทุกครั้ง)

## งานถัดไป (ถ้าลูกค้าต้องการ parity 100%)

- [ ] Export ดาวน์โหลด `.xlsx` รูปแบบเดียวกับไฟล์ลูกค้า
- [ ] แผ่น Daily แยก endpoint ตามวัน (ตอนนี้ใช้ช่วงวันที่เดียวกัน)
- [ ] คอลัมน์ Average ตามสูตร Excel (ถ้ายืนยันสูตร)
