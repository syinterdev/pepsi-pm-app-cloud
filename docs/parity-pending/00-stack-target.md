# เป้าหมาย Stack เต็มรูปแบบ (skills.md) — สถานะปัจจุบัน

**อ้างอิง:** [`skills.md`](../../skills.md) §1 (สถาปัตยกรรม), §2 (Technology Stack), §3 (Security), §4 (Deploy offline)

---

## สรุป (อ่านก่อน)

> **ตอนนี้ยังไม่มีลำดับพัฒนา (1–13) หรือโมดูลใดที่ทำครบ “stack แบบเต็มรูปแบบ” ตาม skills.md**
>
> งานที่ปิดใน [`COMPLETION-MATRIX.md`](COMPLETION-MATRIX.md) ส่วนใหญ่เป็น **แกน** — React + Express + PostgreSQL + API/Zod + หน้าใช้งานได้กับ DB จริง  
> ยังไม่ครบ UX/UI ตามสัญญา stack, offline/IndexedDB, DnD ปฏิทิน, charts KPI, Docker ส่งมอบ, CI เต็มชุด, security hardening ฯลฯ

| ระดับความสำเร็จ | ความหมาย |
|-----------------|----------|
| **แกน** | Migration/seed, API หลัก, หน้า React อ่าน/เขียนข้อมูลได้ — **ไม่ถือว่า stack เต็ม** |
| **Parity PHP** | พฤติกรรมเทียบ `sap/pages/` + `modalPages/` — แยกจาก stack |
| **Stack เต็มรูปแบบ** | ครบตามตาราง §2 ด้านล่าง + §3/§4 ที่เกี่ยวกับโมดูลนั้น — **ยังไม่มีโมดูลใดถึงระดับนี้** |

---

## สถาปัตยกรรมที่ยังไม่ครบ (§1)

| รายการ | เป้า (skills.md) | สถานะ |
|--------|------------------|--------|
| Frontend production | React (Vite) build → nginx/static ใน compose | มี dev Vite; **ยังไม่** deploy ผ่าน `web` service |
| Backend production | Express ใน container `api`, RBAC ทุก route | มี backend dev; **ยังไม่** hardening/compose ส่งมอบ |
| Database | PostgreSQL บน D: bind mount | มี migration ใน `app`; **ผู้ใช้** รัน DBeaver/55432 — **ยังไม่** compose + auto backup |
| ส่งมอบ offline | `docker save` / manifest / checksum | **ยังไม่ทำ** — [`13-deploy-offline.md`](13-deploy-offline.md) |
| MSW ปิด production | `VITE_ENABLE_MSW=false` + proxy `/api` | มีคู่มือ; ใช้ได้เมื่อรัน API จริง |

---

## Technology Stack (§2) — รายการเทียบ repo

สัญลักษณ์: ✅ ใช้งานจริงในหลายหน้า · 🟡 ติดตั้ง/ใช้บางจุด · ⬜ ยังไม่ wired ตามสัญญา stack · 🔒 ฝั่ง backend/security

| หมวด | Component | เป้า | สถานะ | หมายเหตุ |
|------|-----------|------|--------|----------|
| Core | React + Vite + TypeScript | ✅ | โครง `PM-Pepsi-App/frontend` |
| UI | Shadcn/ui + Tailwind + Lucide | 🟡 | มี `components/ui/*`; ยังไม่ครบทุกหน้า/ทุกฟอร์ม |
| Animation | Framer Motion | 🟡 | หน้า error/home; ไม่ครบทั้งแอป |
| Animation | Anime.js | ⬜ | อยู่ใน `package.json`; ยังไม่ใช้ตามแผน micro-interaction |
| Interaction | DnD / gestures (ปฏิทิน) | ⬜ | มี `@dnd-kit`, `@use-gesture`; **ยังไม่** ผูก MovePlant / ลาก event |
| UX | Skeleton screens | 🟡 | บางหน้า (calendar, backlog, …) |
| UX | Optimistic UI | ⬜ | ยังไม่เป็นมาตรฐานทุก mutation |
| Forms | React Hook Form + Zod | 🟡 | backlog filter, login; ไม่ครบทุกฟอร์ม PHP |
| Feedback | Sonner | 🟡 | มี Toaster; ยังไม่ครบทุก action |
| Onboarding | React Joyride | ⬜ | ติดตั้งแล้ว; ยังไม่มี tour |
| Data | TanStack Query | ✅ | หน้าหลักเรียก API ผ่าน Query |
| Charts | Highcharts / Chart.js | ⬜ | มี `chart.js` + `react-chartjs-2`; dashboard/KPI **ยังไม่** ตาม skills |
| Offline | IndexedDB cache | ⬜ | ยังไม่ implement |
| Calendar | FullCalendar | 🟡 | `MonthFullCalendar` — **ยังไม่** DnD/ย้ายแผน; CSS legacy จาก PHP |
| Date | Shadcn-style date picker | 🟡 | `DatePicker` — ใช้บางจุด (เช่น backlog manhour) |
| Backend | Node Express + Zod | 🟡 | มี routes หลัก; RBAC/audit **ยังไม่** ครบทุก endpoint |
| DB | PostgreSQL `app` | ✅ | migrations `001`–`008` + seeds |
| Quality | ESLint | 🟡 | frontend; backend แยก |
| Quality | Vitest + CI pipeline | ⬜ | ยังไม่ lock ตาม §2 |
| Infra | Docker Compose offline | ⬜ | [`13-deploy-offline.md`](13-deploy-offline.md) |

---

## Security & Deploy (§3–§4) — ยังไม่ครบ stack

| รายการ | สถานะ |
|--------|--------|
| RBAC ทุก API + ไม่ไว้ใจ UI อย่างเดียว | 🟡 มี auth/JWT; ยังไม่ audit ครบทุก route |
| Helmet, rate limit, upload hardening | 🔒 ยังไม่ครบตาม §3 |
| Audit trail (login, import, confirm WO) | ⬜ |
| Docker non-root, manifest SHA256 ส่งมอบ | ⬜ |
| Auto backup D: ตามบรีฟ | ⬜ |

---

## ความสัมพันธ์กับเอกสารลำดับ 1–13

- ติ๊ก `[x]` ใน `01-auth.md` … `08-dashboard-planning.md` = **แกน / parity บางส่วน** — **ไม่ใช่** stack เต็ม
- ปฏิทิน: FullCalendar ใน [`00-cross-cutting.md`](00-cross-cutting.md) = UI แกน — ยังขาด DnD, modal PHP เต็ม, POST filter แบบ `M_filter_iw37.php`
- เมื่อโมดูลใดถึง **stack เต็ม** ให้ระบุในหัวไฟล์นั้นและอัปเดตคอลัมน์ **Stack เต็ม** ใน [`COMPLETION-MATRIX.md`](COMPLETION-MATRIX.md)

### งานคงค้างเพื่อให้ลำดับ 8 (Dashboard/Planning) ผ่าน stack เต็ม

- FullCalendar DnD ใน `/planning` (ย้ายแผน / drop เปลี่ยน `wkctr`) เทียบ `M_planwork_*`
- Charts KPI ใน `/` (Dashboard) ตาม §2 (`Highcharts/Chart.js`) — ตอนนี้เป็นการ์ดตัวเลข
- IndexedDB cache สำหรับ list/queue เพื่อเปิดออฟไลน์
- Docker compose ส่งมอบ + `web` service สำหรับ frontend production
- Audit trail การจ่ายงาน (`POST /planning/assign`) + RBAC test ครบทุก endpoint

---

## บันทึกการอัปเดต

| วันที่ | สรุป |
|--------|------|
| 2026-05-19 | ลำดับ 8 ปิด **แกน** แล้ว — เพิ่มรายการ stack เต็มที่ยังขาด (DnD Planning, charts KPI Dashboard, IndexedDB, Docker compose, audit/RBAC test) |
| 2026-05-16 | สร้างไฟล์ — ยืนยันว่ายังไม่มีโมดูลใดผ่านเกณฑ์ stack เต็มรูปแบบ |
