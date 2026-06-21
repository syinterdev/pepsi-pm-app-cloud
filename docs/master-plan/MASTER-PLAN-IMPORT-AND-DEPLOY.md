# Master Plan — การนำเข้าไฟล์และการ Deploy

**อัปเดต:** 2026-06-21

---

## 1) หลักการแยก EE / ME / PK

| แท็บ | ความหมาย | ไฟล์อ้างอิง (ชื่ออาจเปลี่ยน) |
|------|----------|------------------------------|
| **EE** | Electrical · ไฟฟ้า | `01-MASTER PM PROCESS EE 2026.xlsx` |
| **ME** | Mechanics · เครื่องกล | `02-MASTER PM PROCESS ME 2026.xlsx` |
| **PK** | Packing | `03-MASTER PM PACKING 2026.xlsx` |

### แนวคิดออกแบบ (รองรับลูกค้าแก้ไขไฟล์เอง)

1. **แท็บ = ช่องเก็บข้อมูล (authoritative)** — นำเข้าที่แท็บ ME ข้อมูลเข้า ME เสมอ ไม่ปน EE/PK
2. **ชื่อไฟล์ = คำใบ้ (soft hint)** — ลูกค้าเปลี่ยนชื่อได้ ระบบแค่เตือน + ให้ยืนยัน
3. **เนื้อหา Excel = ตรวจเฉพาะ PK vs Process** — PK มี sheet PK1/PK2 ชัดเจน; EE กับ ME ใช้ line เดียวกัน (Schaaf, BCP…) แยกจาก sheet ไม่ได้
4. **Database** — workbook ผูก `discipline` แยก slot ต่อแท็บ

### ชั้นป้องกัน

| ชั้น | การทำงาน |
|------|----------|
| **UI** | บล็อก PK ↔ EE/ME ที่ชัดเจน; เตือน + checkbox เมื่อชื่อไฟล์ไม่ตรง |
| **API Import** | บล็อก PK content บน EE/ME และ Process content บน PK |
| **API Publish** | ตรวจซ้ำก่อน sync task list |
| **DB** | แต่ละ discipline แยก workbook / version |

---

## 2) Cloud UAT (ทดสอบลูกค้า)

- นำเข้า EE, ME, PK **ทีละแท็บ** → Publish แต่ละแท็บ
- ชื่อไฟล์เปลี่ยนได้ — ยืนยันใน dialog ก่อนนำเข้า
- IW37N แยกจาก Master Plan

---

## 3) Production — Windows Server ลูกค้า

- โค้ดและ validation เหมือน Cloud UAT
- ข้อมูล Master Plan นำเข้าผ่าน UI ไม่ copy ไฟล์ลง server โดยตรง

---

## 4) API อ้างอิง

| Method | Path | คำอธิบาย |
|--------|------|----------|
| GET | `/api/v1/master-plan/import-spec` | รายละเอียดแต่ละ discipline (reference filename) |
| POST | `/api/v1/master-plan/import` | `multipart`: `file` + `discipline` |
| POST | `/api/v1/master-plan/publish` | `{ "discipline": "EE" }` |
