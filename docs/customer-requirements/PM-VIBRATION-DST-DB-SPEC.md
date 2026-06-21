# PM Vibration — ค่า Dst / dB (แทนแกน X/Y/Z)

**อัปเดต:** 2026-06-21  
**สถานะ:** **Design proposal** — เสนอลูกค้า meeting พรุ่งนี้ · implement 3A.1 ตาม draft นี้  
**Design (เสนอลูกค้า):** [`PM-VIBRATION-DST-DB-DESIGN-PROPOSAL.md`](PM-VIBRATION-DST-DB-DESIGN-PROPOSAL.md)  
**อ้างอิงไฟล์ลูกค้า:** [`Vibration Record 2019.xlsx`](../../Vibration Record 2019.xlsx) (root โปรเจกต์)  
**เกี่ยวข้อง:** [`PM-MEASUREMENTS-3PHASE-CURRENT.md`](PM-MEASUREMENTS-3PHASE-CURRENT.md) · [`PM-MANUAL-ENTRY-WORK-ORDER-FORM.md`](PM-MANUAL-ENTRY-WORK-ORDER-FORM.md) · [`PM-VIBRATION-IMPLEMENTATION-PHASES.md`](../pm-vibration/PM-VIBRATION-IMPLEMENTATION-PHASES.md)

---

## 1) สรุปการเปลี่ยนแปลง

| เดิม (spec 2026-06-03) | ใหม่ (Vibration Record 2019) |
|------------------------|-------------------------------|
| Vibration **3 แกน X / Y / Z** | **ไม่ใช้แล้ว** |
| หน่วย mm/s RMS · 3 ช่อง v1/v2/v3 | แต่ละจุดวัด = **Dst (Distortion)** + **dB** (2 ค่า) |
| กราฟ 3 เส้น X/Y/Z | ตาราง **Time \| Dst \| dB** · กราฟ 2 เส้น (dual Y-axis) |
| Template Excel คอลัมน์ F–H = แกน X/Y/Z | เปลี่ยนเป็น **Dst** · **dB** (+ Warning/Alarm ถ้ายังใช้) |

**กระแส 3 เฟส R/S/T — ไม่เปลี่ยน**

---

## 2) โครงสร้างจาก `Vibration Record 2019.xlsx`

ไฟล์มีหลาย sheet ตามไลน์/โซน: `BCP`, `Fry Pack`, `Stax`, `PC-50`, `Pellet`, `RBS` ฯลฯ

### 2.1 รูปแบบตาราง

| ส่วน | ตัวอย่าง |
|------|----------|
| วันที่ | `D/M/Y` — `16/1/2017`, `29/11/2017` |
| จุดวัด (คอลัมน์) | `Motor Front`, `Motor Rear`, `Pump Point#1`, `Peeler #1` … |
| ค่าในเซลล์ | **`Dst NN dB MM`** หรือ **`Dst:NN dB Lev:MM`** |

**ตัวอย่างจริง (sheet Fry Pack):**

```text
D/M/Y      | Main Oil Pump
           | Motor Front    | Motor Rear     | Pump Point#1   | Pump Point#2
16/1/2017  | Dst 08 dB 45   | Dst 07 dB 30   | Dst 07 dB 34   | Dst 07 dB 35
15/2/2017  | Dst 08 dB 42   | Dst 06 dB 34   | Dst 05 dB 30   | Dst 06 dB 37
```

**ตัวอย่าง (sheet Pellet — ใช้คำว่า Lev แทนเลข dB ตรง ๆ):**

```text
30/1/2015  | Dst:07 dB Lev:37  | Dst:07 dB Lev:35
```

**ตัวอย่าง (sheet PC-50 — บางจุด 2 แถวต่อรอบวัด):**

```text
42019 | Dst 05 dB 30 | (Motor)     แถวแรกมีวันที่
      | Dst 06 dB 40 | (Motor/Pump) แถวถัดไปไม่มีวันที่ — คนละ sub-point
```

### 2.2 ความหมายฟิลด์ (ข้อเสนอทีม — รอ confirm ลูกค้า)

| ฟิลด์ UI | ความหมายที่เสนอ | ตัวอย่าง | หมายเหตุ |
|---------|----------------|----------|----------|
| **Dst** | **Distortion** | `08`, `07`, `05` | ถามลูกค้า: ชื่อเต็ม + หน่วย |
| **dB** | ระดับ **dB** | `45`, `30`, `37` | UI ใช้คำว่า **dB** (import รับ `Lev` ได้) |
| **Time** | เวลาวัด | `08:00` | คู่กับ Dst/dB ในตาราง trend |

> **1 จุดวัด = 2 ค่า (Dst + dB)** · ตารางลูกค้า: **Time \| Dst \| dB**

> **ไม่มี** คอลัมน์ X, Y, Z ในไฟล์ลูกค้า

---

## 3) แมปเข้าระบบ PM App

### 3.1 ประเภทการวัด (`kind`)

| รายการ | แนวทาง |
|--------|--------|
| กระแส 3 เฟส | `current_3phase` — **คงเดิม** · v1/v2/v3 = R/S/T (A) |
| Vibration | `kind` = **`vibration_dst_db`** · **`v1` = Dst** · **`v2` = dB (Lev)** · **`v3` = ว่าง / ไม่ใช้** |
| ช่อง DB | **`v1` = Dst** · **`v2` = dB (Lev)** · **`v3` = ว่าง / ไม่ใช้** |

### 3.2 UI เป้าหมาย (`/pm-vibration` + WO modal)

| ส่วน | เดิม | ใหม่ |
|------|------|------|
| Label ช่องกรอก | แกน X · Y · Z | **Dst** · **dB** (2 ช่อง · ไม่มีช่องที่ 3) |
| ตาราง trend | Time \| X \| Y \| Z | **Time \| Dst \| dB** |
| กราฟ | 3 เส้น mm/s | 2 เส้น Dst+dB · dual Y-axis · **plot จาก manual entry ช่าง** |
| i18n | `axisX/Y/Z` | **`dst`**, **`db`** |
| การกรอก | — | **ช่าง manual** ทั้งกระแสและ Vibration · Excel import = เสริม |
| Warning / Alarm | ใช้กับ vibration | **รอยืนยัน** — ใน Excel 2019 ไม่เห็นคอลัมน์ Warning/Alarm ชัด · อาจใช้ threshold จาก dB |

### 3.3 Template Excel นำเข้า

**Sheet Vibration (แทน «Vibration 3 แกน»):**

| A | B | C | D | E | F | G | H | I | J |
|---|---|---|---|---|---|---|---|---|---|
| เลข WO | เครื่องจักร | รายการ PM | ประเภทการวัด | วันเวลาวัด | **Dst** | **dB** | *(ว่าง)* | Warning | Alarm |

- Parser: รองรับเซลล์แบบ `Dst 08 dB 45` (split) นอกจากตัวเลขล้วน
- คอลัมน์ alias: `dst`, `db`, `lev`, `level`, `d b`

### 3.4 Infer จาก Master Plan (`pmlist` / `mpoint`)

| เดิม | ใหม่ |
|------|------|
| regex แกน `[xyz]`, mm/s | เพิ่ม/แทนที่ด้วย `dst`, `db`, `lev`, `vibrat`, `สั่น` |
| `suggestsPmVibrationDstDb` | Phase 3B ✅ — แยกจาก current 3-phase |

---

## 4) ผลกระทบ Phase 3B (Master Plan links)

**หยุด implement 3B จนกว่าจะ:**

1. ลูกค้ายืนยันความหมาย **Dst** และ **dB/Lev** (หน่วย / threshold)
2. ~~ตัดสิน `kind` enum~~ → **`vibration_dst_db`** (migration 114)
3. อัปเดต UI + import + tests ตาม §3

**3B ที่ปรับแล้ว (draft):**

- แยกลิงก์ MP: «PM กระแส 3 เฟส» vs «PM Vibration (Dst/dB)»
- Deep link `/pm-vibration?wkorder=&machine=&pmlist=` — เปิดฟอร์ม **Dst/dB** ไม่ใช่ X/Y/Z

---

## 5) คำถาม meeting ลูกค้า (พรุ่งนี้)

ดูตารางเต็ม + wireframe: [`PM-VIBRATION-DST-DB-DESIGN-PROPOSAL.md`](PM-VIBRATION-DST-DB-DESIGN-PROPOSAL.md) §7

| # | คำถาม | ข้อเสนอทีมแล้ว |
|---|--------|----------------|
| Q1 | **Dst** = Distortion ถูกไหม? หน่วย? Warning/Alarm ผูก dB? | Dst = **Distortion** |
| Q2 | UI **dB** หรือ Lev? | **dB** |
| Q3 | 1 คอลัมน์ Excel = 1 task? | ใช่ · 1 จุด = Dst + dB |
| Q4 | แถวไม่มีวันที่ (PC-50)? | ถามลูกค้า |
| Q5 | Warning/Alarm บนจอ? | optional · แนะนำผูก dB |
| Q6 | ตาราง **Time \| Dst \| dB** ตรงไหม? | ใช่ |

---

## 6) ไฟล์ที่ต้องแก้เมื่อ implement (หลัง confirm)

| ชั้น | ไฟล์ |
|------|------|
| Spec | เอกสารนี้ · `PM-MEASUREMENTS-3PHASE-CURRENT.md` · `PM-MANUAL-ENTRY-WORK-ORDER-FORM.md` §3 |
| Backend | `pm-measurement-kind.ts` · `pm-readings-import.ts` · `master-plan-row-links.ts` |
| Frontend | `PmCustomerTrendPanel.tsx` · `WorkOrderPmMeasurementBlock.tsx` · i18n · import template |
| DB | อาจไม่ต้อง migration ถ้าใช้ v1/v2 = Dst/dB |

**Script ตรวจ Excel:** `PM-Pepsi-App/backend/scripts/inspect-vibration-record-2019.mjs`

---

## 7) สิ่งที่โค้ดวันนี้ยัง **ไม่ตรง** spec ใหม่

- UI / i18n ยังใช้ **X/Y/Z** และ mm/s RMS
- [x] Import template — sheet **Vibration Dst dB** · F=**Dst** · G=**dB** · H ว่าง
- [x] `pmMeasurementMeta` labels = **Dst (Distortion)** · **dB**
- Phase 3A kind = **`vibration_dst_db`**

**Phase 3B — รอ implement หลัง confirm Q1–Q5**
