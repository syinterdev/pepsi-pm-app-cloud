# PM Vibration — Design Proposal (Dst / dB)

**วันที่:** 2026-06-21  
**วัตถุประสงค์:** เอกสารเสนอลูกค้า (meeting พรุ่งนี้)  
**สถานะ:** **Draft ฝั่งทีม** — รอ feedback ลูกค้า  
**อ้างอิง:** [`Vibration Record 2019.xlsx`](../../Vibration Record 2019.xlsx) · [`PM-VIBRATION-DST-DB-SPEC.md`](PM-VIBRATION-DST-DB-SPEC.md)

---

## 1) สรุปสำหรับเสนอลูกค้า

| หัวข้อ | ข้อเสนอของทีม |
|--------|---------------|
| **ไม่ใช้ X/Y/Z** | ยกเลิก vibration 3 แกน · ใช้ **2 ค่าต่อจุดวัด** |
| **Dst** | ย่อมาจาก **Distortion** (สมมติฐานจากรูปแบบ Excel) |
| **dB** | แสดงบน UI คำว่า **dB** (ไม่ใช่ Lev) |
| **1 จุดวัด** | = **1 task** (เครื่องจักร + รายการ PM) · แต่ละครั้งวัด = **Dst + dB** |
| **ตารางที่ต้องการ** | **Time \| Dst \| dB** (3 คอลัมน์) |
| **กระแส 3 เฟส** | **ไม่เปลี่ยน** — Time \| R \| S \| T |
| **การกรอกข้อมูล** | **ช่างลงข้อมูลเอง (manual)** ทั้งกระแสและ Vibration — กราฟ plot จากค่าที่ช่างกรอก |

---

## 1b) Workflow — ช่างลงข้อมูลเอง (Manual entry)

> **ยืนยันทีม 2026-06-21:** ไม่มี auto จากเครื่องวัด · **ช่างเป็นคนกรอก** ทุกค่า — ทั้ง **กระแส 3 เฟส** และ **Vibration (Dst/dB)**

| ประเภท | ช่างกรอก | กราฟ |
|--------|----------|------|
| **กระแส 3 เฟส** | Time (หรือวันเวลา) · Phase R · S · T (A) | 3 เส้น R/S/T · แกน Y = A |
| **Vibration** | Time · **Dst** · **dB** | **2 เส้น** · dual Y-axis (Dst ~05–10 · dB ~30–50) |

**Flow ช่าง (กระแส 3 เฟส):**

1. Login (`confirmation.write`) → เปิด WO ที่ `/pm-vibration` หรือ WO modal
2. ระบบ prefill task จาก Master Plan → ช่างกรอก **R · S · T (A)** ต่อจุด
3. *(Mode B)* ตาราง **Time \| R \| S \| T** → `+ เพิ่มแถวเวลา`
4. **บันทึก** → กราฟ **3 เส้น** R/S/T

**Flow ช่าง (Vibration):**

1. เลือก task vibration (เช่น Main Oil Pump · Motor Front)
2. กรอก **Dst + dB** — หรือตาราง **Time \| Dst \| dB** (Mode B)
3. **บันทึก** → `tbwo_pm_reading` (v1=Dst, v2=dB)
4. **กราฟ 2 เส้น** dual Y-axis จากค่าที่บันทึก

**Excel import** = ทางเลือกเสริม (bulk / ย้อนหลัง) — **ไม่ใช่ flow หลัก**

**สิทธิ์:** ช่างที่มี `confirmation.write` กรอกและบันทึกได้ · หัวหน้างาน read-only (ตาม RBAC เดิม)

---

## 2) ความหมายฟิลด์ (ข้อเสนอ)

| ฟิลด์ | ความหมายที่เสนอ | ตัวอย่างจาก Excel | หมายเหตุถามลูกค้า |
|-------|----------------|-------------------|-------------------|
| **Dst** | **Distortion** — ค่า distortion scale | `08`, `07`, `05` | หน่วย/ชื่อเต็มถูกไหม? |
| **dB** | ระดับ **dB** (decibel level) | `45`, `30`, `37` | เกณฑ์ Warning/Alarm ใช้ dB ไหม? |
| **Time** | เวลาที่วัด (ในวัน) หรือ วัน+เวลา | `08:00` · `16/1/2017` | WO ใช้เวลาในวัน หรือ datetime เต็ม? |

> Sheet Pellet ใช้คำว่า `Lev` — **import รับ Lev ได้** แต่ **UI แสดง dB**

---

## 3) โครงข้อมูลในระบบ

```
1 จุดวัด (task)
  └── machine + pmlist  เช่น "Main Oil Pump" + "Motor Front"
  └── kind = vibration_dst_db
  └── หลายแถว readings ต่อ task:
        measured_at | v1=Dst | v2=dB | v3=null
```

| DB column | Vibration (ใหม่) | กระแส 3 เฟส (เดิม) |
|-----------|------------------|---------------------|
| `v1` | **Dst** | Phase R (A) |
| `v2` | **dB** | Phase S (A) |
| `v3` | *(ไม่ใช้)* | Phase T (A) |

---

## 4) UI Design — ตาราง Time \| Dst \| dB

### 4.1 โครงหน้าจอต่อ 1 task (จุดวัด)

```text
┌─ Vibration — Main Oil Pump · Motor Front ─────────────────────┐
│  [Line chart — 2 เส้น: Dst (สี 1) · dB (สี 2)]                 │
│  แกน X = Time · แกน Y ซ้าย = Dst · แกน Y ขวา = dB (scale ต่างกัน) │
├─ ตารางกรอก (Manual) ──────────────────────────────────────────┤
│  Time   │  Dst  │  dB   │  [ลบ]                                 │
│  08:00  │  08   │  45   │                                       │
│  09:00  │  07   │  42   │                                       │
│  10:00  │  08   │  40   │                                       │
│  [+ เพิ่มแถวเวลา]                                              │
│  [ บันทึก ]  [ โหลดจากที่บันทึกแล้ว ]                           │
└───────────────────────────────────────────────────────────────┘
```

### 4.2 โหมดกรอก 2 แบบ (เทียบกระแส 3 เฟส)

| โหมด | เมื่อไหร่ใช้ | ตาราง |
|------|-------------|--------|
| **A — จุดเดียว (WO กระดาษ)** | วัดครั้งเดียวต่อ task | วันเวลา 1 ชุด + Dst + dB (ไม่มีคอลัมน์ Time หลายแถว) |
| **B — Trend (ทำกราฟ)** | หลายเวลาในวันเดียวกัน | **Time \| Dst \| dB** หลายแถว → line chart |

### 4.3 WO modal (แท็บ Task)

- Task ที่ infer เป็น vibration → แสดง **2 ช่อง: Dst · dB** (ไม่แสดงช่องที่ 3)
- ตารางย้อนหลัง: **Time \| Dst \| dB** (ไม่ใช่ X \| Y \| Z)

### 4.4 หน้า `/pm-vibration`

- แยก section **กระแส 3 เฟส** (R/S/T) กับ **Vibration (Dst/dB)**
- ต่อ task vibration: ตาราง **Time \| Dst \| dB** + กราฟ 2 เส้น

---

## 5) กราฟ — 2 เส้น Dst + dB (จากค่าที่ช่างกรอก)

> กราฟ **ไม่ auto** — plot จาก readings ที่ช่าง manual entry แล้วบันทึก

| รายการ | ข้อเสนอ |
|--------|---------|
| แหล่งข้อมูล | **Manual entry ช่าง** → `tbwo_pm_reading` → line chart |
| เส้นกราฟ | **Dst** (เส้น 1) · **dB** (เส้น 2) |
| แกน X | **Time** (จากคอลัมน์ Time ที่ช่างกรอก) |
| แกน Y | **Dual axis** — ซ้าย **Dst** (~05–10) · ขวา **dB** (~30–50) |
| Legend | `Dst (Distortion)` · `dB` |
| หลังบันทึก | refresh กราฟทันที · ไม่ต้อง reload หน้า (ถ้า implement ได้) |
| Warning/Alarm | **รอ confirm** — ถ้าใช้ แนะนำผูกกับ **dB** |

---

## 6) Excel ลูกค้า ↔ แอป

### Excel ลูกค้า (wide format)

```text
D/M/Y      | Motor Front    | Motor Rear
16/1/2017  | Dst 08 dB 45   | Dst 07 dB 30
```

### แอป (1 task = 1 จุด, tall format)

```text
Task: Main Oil Pump · Motor Front
Time  | Dst | dB
08:00 | 08  | 45
09:00 | 07  | 42
```

| Excel | แอป |
|-------|-----|
| 1 คอลัมน์ (Motor Front) | 1 task (`machine` + `pmlist`) |
| เซลล์ `Dst 08 dB 45` | แยกเป็น Dst=08, dB=45 |
| คอลัมน์วันที่ D/M/Y | `measured_at` (วัน) + Time (ถ้ามีหลายเวลา/วัน) |

### Template import (sheet Vibration)

| A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|
| เลข WO | เครื่องจักร | รายการ PM | ประเภท | วันเวลาวัด | **Dst** | **dB** |

Parser รองรับ: ตัวเลขล้วน · `Dst 08 dB 45` · `Dst:07 dB Lev:37`

---

## 7) คำถามเสนอลูกค้า (meeting พรุ่งนี้)

| # | คำถาม | ข้อเสนอทีมแล้ว | ต้อง confirm |
|---|--------|----------------|--------------|
| Q1 | Dst = Distortion ถูกไหม? หน่วยคืออะไร? | ใช้ชื่อ **Dst (Distortion)** | ☐ |
| Q2 | UI ใช้ **dB** หรือ Lev? | **dB** | ☐ |
| Q3 | 1 คอลัมน์ Excel = 1 task? | ใช่ | ☐ |
| Q4 | แถวไม่มีวันที่ (PC-50) คืออะไร? | — | ☐ |
| Q5 | ต้องการ Warning/Alarm ไหม? ผูก dB? | แนะนำ dB · optional | ☐ |
| Q6 | ตาราง **Time \| Dst \| dB** ตรงความต้องการไหม? | ใช่ | ☐ |

**ลายเซ็นลูกค้า:** ☐ ตกลง design · ☐ แก้ไข (ระบุ) ______ · วันที่ ______

---

## 8) ลำดับ implement (หลัง meeting)

1. **3A.1** — UI + import ตาม design นี้  
2. **Confirm Q1–Q6** — ปรับ label/threshold ถ้าจำเป็น  
3. **3B** — Master Plan links → PM Vibration (Dst/dB)

ดู checklist: [`PM-VIBRATION-IMPLEMENTATION-PHASES.md`](../pm-vibration/PM-VIBRATION-IMPLEMENTATION-PHASES.md) § Phase 3
