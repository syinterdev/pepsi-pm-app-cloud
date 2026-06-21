# PM ค่าวัด — กระแส 3 เฟส vs Vibration (เอกสารลูกค้า)

อัปเดต: **2026-06-21** · แก้หลัง feedback ลูกค้า · Vibration เปลี่ยนเป็น **Dst/dB** (ดู [`PM-VIBRATION-DST-DB-SPEC.md`](PM-VIBRATION-DST-DB-SPEC.md))

---

## สิ่งที่ลูกค้าต้องการ (จาก WO + ตัวอย่างกราฟ)

**Manual entry ตามฟอร์มกระดาษ WO (4 ภาพลูกค้า):** ดูสเปกเต็ม [`PM-MANUAL-ENTRY-WORK-ORDER-FORM.md`](PM-MANUAL-ENTRY-WORK-ORDER-FORM.md) — มี 2 โหมด manual (จุดเดียวต่อ task / หลายจุดเวลาทำกราฟ) + หน้า 2 Comments and Findings

### 1) กระแสไฟฟ้า 3 เฟส — **ความต้องการหลัก PM ZB02**

| รายการ | รายละเอียด |
|--------|------------|
| หน่วย | **Ampere (A)** |
| 3 ค่าต่อจุดวัด | **เฟส R · เฟส S · เฟส T** (ไม่ใช่แกน X/Y/Z) |
| ต่อเครื่องจักร | WO 4001565681 — Main Oil Pump `97.5 / 97.6 / 96.2` · Combustion Fan · Thermal Oil Pump ฯลฯ |
| กราฟ | เส้น 3 สี R/S/T · แกน X = **เวลา** · แกน Y = A |
| ตาราง | เวลา \| Phase R (A) \| Phase S (A) \| Phase T (A) |
| Template Excel นำเข้า | **10 คอลัมน์** เหมือน Vibration — คอลัมน์ F–H = Phase R/S/T (A) · คอลัมน์ วันเวลาวัด ใส่ `26/05/2026 19:10` หรือ `08:00` (ตารางกราฟ) |
| หมายเหตุ | Comments and Findings — แยกจาก comment ปิดงาน |

### 2) Vibration — **Dst (Distortion) + dB** (แทนแกน X/Y/Z · 2026-06-21)

> Design: [`PM-VIBRATION-DST-DB-DESIGN-PROPOSAL.md`](PM-VIBRATION-DST-DB-DESIGN-PROPOSAL.md)

| รายการ | รายละเอียด |
|--------|------------|
| 2 ค่าต่อจุดวัด | **Dst (Distortion)** · **dB** |
| ตาราง trend | **Time \| Dst \| dB** |
| UI label | **dB** (import รับ Lev ได้) |
| รูปแบบใน Excel ลูกค้า | `Dst 08 dB 45` · `Dst:07 dB Lev:37` |
| จุดวัด | ตามคอลัมน์ equipment — เช่น Motor Front, Pump Point#1 |
| กราฟ | เส้น **Dst** + **dB** ต่อจุดวัด (รอยืนยัน UAT) |
| Template Excel นำเข้า | 10 คอลัมน์ — F = **Dst** · G = **dB** · H ว่าง · I/J = Warning/Alarm (ถ้ายังใช้) |
| DB mapping | `v1` = Dst · `v2` = dB · `v3` ไม่ใช้ |

---

## สิ่งที่เคยทำผิด (แก้แล้ว 2026-06-03)

| ปัญหา | แก้ |
|--------|-----|
| หน้า/เมนูเน้น **PM Vibration** | เปลี่ยนเป็น **PM ค่าวัด / กระแส 3 เฟส** |
| Template Excel ใช้ **แกน X/Y/Z** + ตัวอย่าง vibration | Sheet **กระแส 3 เฟส** — 10 คอลัมน์ · Phase R/S/T · Sheet Vibration = **Dst / dB** (ไม่ใช่ X/Y/Z) |
| Default import = vibration | Default = **current_3phase** |
| สลับลำดับ detect vibration ก่อนกระแส | **กระแสก่อน** vibration |

---

## Template Excel นำเข้า (โครงลูกค้า)

ดาวน์โหลด: `GET /api/v1/pm-readings/import-template.xlsx`

### Sheet «กระแส 3 เฟส» — 10 คอลัมน์

| A | B | C | D | E | F | G | H | I | J |
|---|---|---|---|---|---|---|---|---|---|
| เลข WO | เครื่องจักร | รายการ PM | ประเภทการวัด | วันเวลาวัด | **Phase R (A)** | **Phase S (A)** | **Phase T (A)** | Warning | Alarm |

- แถวจุดเดียว (จากกระดาษ WO): วันเวลาวัด = `26/05/2026 19:10`
- แถวทำกราฟ (หลายจุดเวลา): วันเวลาวัด = `08:00`, `09:00`, … ตามตารางกราฟลูกค้า

### Sheet «Vibration (Dst/dB)» — 10 คอลัมน์

| A–E | F | G | H | I | J |
|-----|---|---|---|---|---|
| เหมือนด้านบน | **Dst** | **dB** | *(ว่าง)* | Warning | Alarm |

ตัวอย่าง: WO `4001565681` · Main Oil Pump · Motor Front · `Dst 08` · `dB 45` · (Warning/Alarm รอยืนยันลูกค้า)

> **Deprecated:** Sheet «Vibration 3 แกน» (แกน X/Y/Z · mm/s) — ไม่ใช้แล้ว

### Sheet «ตารางกราฟ (อ้างอิง)»

| Time | Phase R (A) | Phase S (A) | Phase T (A) |

ใช้อ้างอิงทำ Line Chart ใน Excel — **ไม่นำเข้า DB** (ไม่มีเลข WO)

---

| จุด | การทำงาน |
|-----|----------|
| WO modal แท็บ Task | ต่อ **แถว task list** (เครื่องจักร + รายการ PM) — กรอก R/S/T 3 ช่อง |
| `/pm-vibration` | บันทึก bulk + import Excel · **manual ตามฟอร์ม WO** (ดู [`PM-MANUAL-ENTRY-WORK-ORDER-FORM.md`](PM-MANUAL-ENTRY-WORK-ORDER-FORM.md)) |
| Master PM (`pmlist`) | ข้อความมี "กระแส"/"3 เฟส" → auto เป็นกระแส 3 เฟส |

---

## UAT สั้น ๆ

1. เปิด WO ที่ task มี `ตรวจเช็คกระแสไฟฟ้าทั้ง 3 เฟส`
2. แท็บ Task — ต้องเห็นหัวข้อ **กระแสไฟฟ้า 3 เฟส** และช่อง **เฟส R/S/T**
3. บันทึก 3 ค่า → กราฟ 3 เส้น · ตารางมีคอลัมน์ R/S/T
4. ดาวน์โหลด template Excel — sheet แรก **กระแส 3 เฟส** ตรง WO ตัวอย่าง
