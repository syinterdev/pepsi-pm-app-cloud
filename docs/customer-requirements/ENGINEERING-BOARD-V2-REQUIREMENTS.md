# Engineering Board Phase 2 — ความต้องการลูกค้า (Kiosk ขยาย)

**อัปเดต:** 2026-05-22  
**สถานะ:** รออนุมัติ scope / ลำดับทำ  
**อ้างอิง Excel:** [`new file/Eng Utilization 2026.xlsx`](../../new%20file/Eng%20Utilization%202026.xlsx)  
**Board ปัจจุบัน (Phase 1):** [`ENGINEERING-BOARD.md`](ENGINEERING-BOARD.md) · หน้า `/board` · UI-POLISH U1 kiosk/KPI ผ่านแล้ว

---

## สรุปคำขอจากลูกค้า

| # | ความต้องการ | หมายเหตุ |
|---|-------------|----------|
| 1 | แสดงว่า **ใครรับงานอะไร** / **ปิดงานอะไรไปแล้ว** | feed ล่าสุดบนจอ TV |
| 2 | แสดง **รูปช่าง** ที่อัปเดตแล้ว | **เฉพาะรูปประจำตัว** บน kiosk (B0) |
| 3 | **การ์ดสวยๆ** อ่านจากระยะไกล | สไตล์ kiosk มืด · ตัวเลขใหญ่ |
| 4 | **กราฟรวมการทำงานรายคน** | เหมือน Excel / รายงาน Eng Utilization |

**คำตอบสั้น:** **เพิ่มได้** — ข้อมูลหลักมีใน PostgreSQL และ API รายงานแล้วส่วนใหญ่ แต่ต้อง **ขยาย Board UI + API สำหรับ kiosk** (โดยเฉพาะรูปและ feed) ไม่ใช่แค่ปรับ CSS

---

## สิ่งที่ Excel `Eng Utilization 2026.xlsx` มี (อ้างอิง)

### ชีต

| ชีต | ใช้ทำอะไร |
|-----|-----------|
| Summary Daily | รายคนต่อวัน |
| Summary Daily (2) | ชุดข้อมูลรายวัน (สำเนา/ทดสอบ) |
| Summary Weekly | **หลัก** — รายคนต่อสัปดาห์ + กราฟ |
| Summary Weekly (3) | สัปดาห์ (variant) |
| Summary Monthly | รายเดือน |
| Summary Monthly (March) | เดือนตัวอย่าง |
| Summary Monthly Test | ทดสอบ |
| Summary Daily (April) | รายวัน เดือนเมษา |

### คอลัมน์ต่อแถวช่าง (ตัวอย่างแถว 3)

| คอลัมน์ Excel | แมป API ปัจจุบัน (`GET /api/v1/reports/summary-weekly` → `rows[]`) |
|--------------|---------------------------------------------------------------------|
| `PAC010 (Narit)` | `wkctr` + `displayName` → `formatEngUtilizationLabel()` |
| PM | `pmWork` / `pmHours` |
| Reactive | `reactiveWork` / `reactiveHours` |
| RCA | `rcaWork` |
| HR hour | `hrHour` |
| %PM | `percentPm` |
| %Reactive | `percentReactive` |
| Total | `percentTotal` (หรือ PM+Reactive แบบ Excel) |
| Average / WO | `woCount` |

### UI ที่มีแล้วในแอป (ไม่ใช่ Board)

| ส่วน | Path | Component |
|------|------|-----------|
| ตาราง + กราฟ Eng Utilization | `/summary-weekly` | `SummaryWeeklyPage`, `EngUtilizationChart`, `EngUtilizationTeamGrid` |
| การ์ดรายคน + รูป | `/summary-weekly` | `EngUtilizationPersonCard` |
| ช่างที่ยังไม่มีรูป | `/summary-weekly` | `EngUtilizationMissingPhotos` |

→ Phase 2 ควร ** reuse logic/components** เหล่านี้บน `/board` แทนเขียนใหม่ทั้งก้อน

---

## สถานะ `/board` วันนี้ (Phase 1)

| แสดงอยู่แล้ว | ยังไม่มี |
|--------------|---------|
| นาฬิกา · ชื่อแอป · ประกาศ | Feed รับงาน / ปิดงาน |
| KPI 4 การ์ด (dashboard summary) | การ์ดรายคนพร้อมรูป |
| กราฟ utilization 12 คน (chart2) | ตาราง PM / Reactive / RCA แบบ Excel |
| ตาราง Week-to-Week KPI | ~~รูป before/after~~ (ไม่ทำบน kiosk) |
| Kiosk token · เต็มจอ · รีเฟรช 60s | สไลด์สลับโซน (KPI → ทีม → feed) |

---

## Checklist Phase 2 (ติ๊กเมื่อส่งมอบ)

### B0 — อนุมัติ scope กับลูกค้า

- [x] **ช่วงเวลา feed / รายงานบน Board — เลือกได้บนจอ** (อนุมัติ 2026-05-22)
  - ตัวเลือก: **วันนี้** · **7 วันล่าสุด** · **สัปดาห์ปัจจุบัน** (จันทร์–อาทิตย์ตาม timezone ระบบ)
  - ใช้ร่วมกับ feed รับงาน/ปิดงาน (B2) และช่วง Eng Utilization (B1) — ค่าเดียวกันทั้งจอ
  - Implement: ตัวเลือกบน `/board` (ปุ่มหรือ segmented control) · ส่ง `period=today|7d|week` ไป API · จำค่าใน `sessionStorage` ระหว่างรีเฟรช
- [x] **รูปบน kiosk — เฉพาะรูปประจำตัว** (`tbworkcenter` / `imgmember` WebP) — ไม่แสดงรูปปิดงาน Before/After บนจอสาธารณะ (อนุมัติ 2026-05-22)
  - Feed การ์ด + กริดทีม: avatar จาก `GET /api/v1/board/personnel/:idwkctr/avatar` (B3)
  - ไม่ดึง `tbconfirmimg` / thumbnail ปิดงานบน `/board`
- [x] **จำนวนรายการ feed = 12** รายการล่าสุด (รวมรับงาน + ปิดงาน เรียงเวลาเดียวกัน) (อนุมัติ 2026-05-22)
  - API default `limit=12` (สูงสุด 12) · UI แสดงไม่เกิน 12 การ์ด
- [x] **ซ่อน WO ที่ยังไม่ผ่าน QC** บนจอสาธารณะ `/board` (อนุมัติ 2026-05-22)
  - แสดงเฉพาะปิดงานที่ `tbiw37n.confirm_qc_status = 'approved'` (หรือคอลัมน์ไม่มี / legacy ไม่มี QC — ตามนโยบาย `isConfirmQcApproved`)
  - รายการ «รับงาน» ไม่กรอง QC · ถ้า WO ยัง pending QC ไม่ขึ้นใน feed ฝั่ง «ปิดงาน»
  - ใช้ `isConfirmQcApproved()` จาก `confirm-qc-status.ts` — เทียบ [CONFIRM-QC-FLOW.md](CONFIRM-QC-FLOW.md)

**สถานะ B0:** อนุมัติครบ — พร้อมเริ่ม B1/B2/B3

### B1 — กราฟ & ตัวเลขรายคน (เหมือน Excel)

| รายการ | Backend | Frontend `/board` | Kiosk token |
|--------|---------|------------------|-------------|
| [x] ดึง `summary-weekly` ตาม `period` ที่เลือก (B0) | มีแล้ว | `BoardPeriodSelector` + `useBoardPeriod` | มีแล้ว (`reports.read` ผ่าน kiosk) |
| [x] กราฟ stacked PM / Reactive / RCA รายคน | มีแล้ว (`EngUtilizationChart`) | `BoardEngUtilizationStackedChart` · kioskDark | [x] |
| [x] กริดการ์ดรายคน + % bar + รูป | มีแล้ว (`rows.hasImage`) | `BoardEngUtilizationTeamGrid` · `EngUtilizationTeamGrid` kiosk | [x] |
| [x] ตัวเลข HR hour / WO บนการ์ด (อ่านจาก 3 m) | มีแล้ว (`hrHour`, `woCount`) | `eng-util-person-card__stats` · typography kiosk | [x] |

### B2 — Feed «รับงาน / ปิดงาน»

**ช่วงเวลา (จาก B0):** query `period=today` | `7d` | `week` — คำนวณ `from`/`to` ฝั่ง backend ตาม `app.timezone` (IANA)

| รายการ | Backend | Frontend | หมายเหตุ |
|--------|---------|----------|----------|
| [x] API `GET /api/v1/board/activity?period=…&limit=12` | มีแล้ว | `BoardActivityFeed` · รีเฟรช 60s | รวม 2 แหล่ง · max 12 |
| [x] ตัวเลือกช่วงเวลาบน Board (วันนี้ / 7 วัน / สัปดาห์นี้) | — | `BoardPeriodSelector` | [x] scope B0 |
| [x] รับงาน / มอบหมายล่าสุด | `tbplangingwork` + เวลา pwcomment/cday/bscstart | การ์ด: ช่าง · WO · เวลา | |
| [x] ปิดงานล่าสุด | `tbcofirm` + `tbiw37n` | การ์ด: ช่าง · WO · เวลาปิด | [x] เฉพาะ `confirm_qc_status = approved` |
| [x] รวมเรียงเวลา · **limit 12** · รีเฟรช 60s | `mergeBoardActivityItems` | `activityQ` 60s | [x] |
| [x] RBAC: kiosk อ่านอย่างเดียว | `createRequireKioskOrPermission` (`dashboard.read`) | | [x] |
| [x] ไม่รั่วข้อมูลลับ (comment, รูปเต็ม) | กรอง field ใน schema | ไม่ส่ง pwcomment/confirmation | [x] |

**ตัวอย่างการ์ด feed**

```text
[รูปช่าง]  Narit (PAC010)  ปิดงาน WO 12345678  ·  14:32 น.
[รูปช่าง]  Chesada         รับงาน WO 12345690  ·  13:05 น.
```

### B3 — รูปช่าง & รูปอัปเดตบน kiosk

| รายการ | สถานะ | งาน |
|--------|--------|-----|
| [x] รูปประจำตัว `tbworkcenter` / WebP | `getPersonnelImage` → WebP | แอป: `GET /personnel/:id/image` (session) · kiosk: ใช้ board avatar ด้านล่าง |
| [x] `GET /api/v1/board/personnel/:idwkctr/avatar` | มีแล้ว | `boardPersonnelAvatarUrl` · feed + การ์ดทีม · `?kiosk_token=` หรือ session cookie |
| [x] ~~thumbnail รูปปิดงาน~~ | **ไม่ทำ** (B0 — เฉพาะรูปประจำตัว) | — |
| [x] Cache-Control สั้น · ไม่ log PII ใน URL | `private, max-age=120` | path ใช้ `idwkctr` เท่านั้น (ไม่มีชื่อใน URL) |

### B4 — UI/UX Kiosk (การ์ดสวย + สไลด์)

| รายการ | Checklist |
|--------|-----------|
| [x] โซน A: KPI 4 การ์ด | `BoardKpiZone` · sparkline · อ่านจาก ~3 m | [x] Phase 1 + B4 |
| [x] โซน B: กริดทีม + กราฟ utilization | chart + `BoardEngUtilizationTeamGrid` | [x] B1 |
| [x] โซน C: Feed รับงาน/ปิดงาน | `BoardActivityFeed` · โซน C tag · max 12 · 60s | [x] B2 |
| [x] โซน D (ทางเลือก): สไลด์อัตโนมัติ A→B→C ทุก 30–60 วินาที | `BoardCarouselShell` · 45s · `?carousel=1` | [x] |
| [x] ธีมมืด kiosk · glass card · ตัวอักษรใหญ่ | `engineering-board.css` | [x] |
| [x] ธีมสว่าง (liquid glass) · สลับมืด/สว่าง | `engineering-board-theme.css` · `?theme=light` · `BoardThemeToggle` | [x] |
| [x] 1080p / 4K ไม่แตก (`UI-POLISH` U3) | `engineering-board-display.css` · vmin · B/C คู่กันจอกว้าง | [x] |

### B5 — ทดสอบ & ส่งมอบ

- [ ] ทดสอบ `/board?token=…` ไม่ login — ครบ B1–B3
- [ ] ทดสอบ session + `dashboard.read` — ข้อมูลเท่ากัน
- [ ] UAT ลูกค้าเทียบ Excel สัปดาห์เดียวกัน (ตัวเลข % ใกล้เคียง ± tolerance)
- [ ] อัปเดต [`ENGINEERING-BOARD.md`](ENGINEERING-BOARD.md) และ [`UI-POLISH-PHASES.md`](UI-POLISH-PHASES.md)

---

## แผน implement แนะนำ (ลำดับ)

```text
1) B1 — นำ Eng Utilization ขึ้น Board (reuse summary-weekly + components)
2) B3 — avatar API สำหรับ kiosk (บล็อกการ์ดรูป)
3) B2 — board activity feed API + การ์ด timeline
4) B4 — สไลด์ / layout สุดท้าย + UAT กับ Excel
```

**ประมาณความพยายาม (คร่าวๆ):**

| Phase | งานหลัก | ขนาด |
|-------|---------|------|
| B1 | Frontend board + styling | S–M |
| B3 | Backend avatar route + tests | S |
| B2 | SQL feed + schema + UI cards | M |
| B4 | Carousel + polish | S |

---

## ไฟล์ที่คาดว่าจะแตะ (เมื่อเริ่มทำ)

| ชั้น | Path |
|------|------|
| Spec | `docs/customer-requirements/ENGINEERING-BOARD-V2-REQUIREMENTS.md` (ไฟล์นี้) |
| Backend | `routes/board-activity.ts`, `services/board-activity.ts`, `schemas/board-activity.ts` |
| Backend | ขยาย `board-kiosk.ts` หรือ `personnel` สำหรับ avatar |
| Frontend | `features/board/EngineeringBoardPage.tsx`, `engineering-board.css` |
| Frontend | `features/board/BoardTeamSection.tsx`, `BoardActivityFeed.tsx` (ใหม่) |
| Reuse | `features/reports/EngUtilization*.tsx`, `lib/eng-utilization-chart.ts` |

---

## ความเสี่ยง / ข้อตกลง

| หัวข้อ | แนวทาง |
|--------|--------|
| Kiosk สาธารณะ | ไม่แสดงรหัสลับ · เฉพาะรูปประจำตัว · feed 12 รายการ · ปิดงานเฉพาะ QC approved |
| ตัวเลข ≠ Excel ทุกจุด | ใช้สูตรเดียวกับ `/summary-weekly` — อ้างอิง `eng-utilization-chart.ts` |
| รูปช้า | lazy load + placeholder ชื่อย่อ |
| Token รั่ว | HTTPS · rotate token ใน Admin |

---

## ลิงก์เอกสารที่เกี่ยวข้อง

- [MEETING-MINUTES.md](MEETING-MINUTES.md) §2 Engineering Board  
- [CONFIRM-IMAGE-LIMITS.md](CONFIRM-IMAGE-LIMITS.md) — รูปปิดงาน  
- [CONFIRM-QC-FLOW.md](CONFIRM-QC-FLOW.md) — งานที่ยังไม่อนุมัติไม่ขึ้น dashboard  
- [`PM-Pepsi-App/frontend/src/features/reports/SummaryWeeklyPage.tsx`](../../PM-Pepsi-App/frontend/src/features/reports/SummaryWeeklyPage.tsx) — UI อ้างอิง Excel แล้ว
