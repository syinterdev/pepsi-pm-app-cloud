# Engineering Board / Kiosk Display

อ้างอิง: [MEETING-MINUTES.md](MEETING-MINUTES.md) ครั้งที่ 1 §2 (Web Application) · [WORK-PHASES.md](../WORK-PHASES.md) Phase 8

## วัตถุประสงค์

**มอนิเตอร์กลางแผนก** — แสดง KPI และแนวโน้มแบบอ่านง่ายจากระยะไกล ไม่ต้องเปิดเมนู sidebar

## การใช้งาน

| รายการ | ค่า |
|--------|-----|
| URL | **`/board`** — ไม่บังคับ login (kiosk) |
| สิทธิ์ข้อมูล | Session + `dashboard.read` **หรือ** kiosk token (อ่านอย่างเดียว) |
| ตั้งค่า token | Admin → ตั้งค่าระบบ → **Engineering Board (Kiosk / TV)** |
| รีเฟรช | อัตโนมัติทุก **60 วินาที** |
| เต็มจอ | ปุ่มใน footer หรือ F11 / `requestFullscreen` |
| ความละเอียด | รองรับ **1280×720** · **1920×1080** · **2560×1440** · **3840×2160** — สเกลด้วย `vmin` · จอกว้างจัดโซน B/C คู่กัน |

### Kiosk TV (แนะนำ)

1. Admin → ตั้งค่าระบบ → กด **สร้าง token** → คัดลอก URL เช่น `http://host/board?token=…`
2. เปิด URL บน TV / Chrome kiosk (F11 เต็มจอ) — **ไม่ต้อง login ซ้ำ**  
   - โหมดสไลด์: `?carousel=1` หรือปุ่ม **สไลด์ A→B→C** ใน footer (สลับโซน A→B→C ทุก 45 วินาที)
   - ธีม: **มืด** (default) หรือ **สว่าง** — ปุ่มใน header หรือ `?theme=light` · จำใน `sessionStorage`
3. รีเฟรชอัตโนมัติทุก 60 วินาที
4. เมนูซ้ายบน board แสดงลิงก์เข้าแอป (ต้อง login) — เหมือนรายการใน sidebar หลัก

## สิ่งที่แสดงบนจอ

1. **หัวข้อ + นาฬิกา** — วันที่/เวลาปัจจุบัน (th-TH)
2. **ประกาศ** — รายการแรกจาก `GET /api/v1/announcements/active` (ถ้ามี)
3. **โซน A — KPI 4 การ์ด** — จาก `GET /api/v1/dashboard/summary` (เดียวกับหน้าแรก) · `BoardKpiZone`
   - ใบงานเปิด · ปิดเดือนนี้ · รอจ่ายงาน · นำเข้า IW37N ล่าสุด
4. **โซน C — ค่าวัด PM** — กระแส 3 เฟส / Vibration + กราฟย่อ (สูงสุด 8 กลุ่ม) · `BoardPmReadingsPanel` · `GET /api/v1/board/pm-readings?period=…`
5. **โซน C — กิจกรรมล่าสุด** — รับงาน/ปิดงาน (สูงสุด 12) · `BoardActivityFeed` · `GET /api/v1/board/activity?period=…`
6. **กราฟ + การ์ดทีม** — Eng Utilization ตามช่วงที่เลือก (วันนี้ / 7 วัน / สัปดาห์)
7. **ตาราง Week-to-Week** — จาก `GET /api/v1/reports/kpi` (8 สัปดาห์)

### ส่งออก Excel ค่าวัด PM

| ขอบเขต | Endpoint | สิทธิ์ |
|--------|----------|--------|
| ใบงานเดียว | `GET /api/v1/work-orders/:id/pm-readings/export.xlsx` | `confirmation.read` |
| ช่วงวันที่ | `GET /api/v1/pm-readings/export.xlsx?from=&to=&team=` | `confirmation.read` — ใช้จาก `/pm-vibration` หรือ WO modal ไม่แสดงบน `/board` |

### รูปช่างบน kiosk

| การใช้ | Endpoint |
|--------|----------|
| แอป (login) | `GET /api/v1/personnel/:idwkctr/image` |
| Board / TV | `GET /api/v1/board/personnel/:idwkctr/avatar` (+ `?kiosk_token=` เมื่อไม่มี cookie) |

แหล่งข้อมูลเดียวกัน: `tbworkcenter.imgmember_data` (WebP)

## ไฟล์ใน repo

| ส่วน | Path |
|------|------|
| หน้า kiosk | `PM-Pepsi-App/frontend/src/features/board/EngineeringBoardPage.tsx` |
| โซน A KPI | `PM-Pepsi-App/frontend/src/features/board/BoardKpiZone.tsx` |
| โซน C Feed | `PM-Pepsi-App/frontend/src/features/board/BoardActivityFeed.tsx` |
| โซน D สไลด์ | `BoardCarouselShell` · `?carousel=1` · ปุ่ม footer «สไลด์ A→B→C» |
| สไตล์ | `PM-Pepsi-App/frontend/src/features/board/engineering-board.css` |
| Route | `App.tsx` → `/board` (นอก `AppShell`) |
| ลิงก์จาก Dashboard | ปุ่ม **Engineering Board** บน `HomePage` |

## งานถัดไป (ถ้าขอเพิ่ม)

**Phase 2 (ลูกค้าขอ 2026-05-22):** checklist เต็ม → [`ENGINEERING-BOARD-V2-REQUIREMENTS.md`](ENGINEERING-BOARD-V2-REQUIREMENTS.md)  
(รับงาน/ปิดงาน · รูปช่าง · การ์ดทีม · กราฟรายคนแบบ `Eng Utilization 2026.xlsx`)

- [ ] Phase 2 — ดู checklist B0–B5 ในเอกสารด้านบน
- [ ] โหมดสลับสไลด์อัตโนมัติ (KPI → ทีม/กราฟ → Activity feed)
- [x] Token อ่านอย่างเดียวสำหรับ TV ไม่ต้อง login ซ้ำ (`082_board_kiosk_settings.sql`, `X-Board-Kiosk-Token`)
- [ ] แสดง % Completion / ทีม A·B จาก calendar filter-detail
- [ ] Telegram แจ้งเตือนคู่กับ board (Phase 8 แยก)
