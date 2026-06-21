# E2E Smoke — ก่อนเสนอลูกค้า

**อัปเดต:** 2026-05-26

## สิ่งที่ครอบคลุม

| ชุด | ไฟล์ | จำนวน |
|-----|------|--------|
| API smoke | `e2e/api-smoke.spec.ts` | 4 (health, public settings, login 401, export 401) |
| RBAC export | `e2e/confirmation-export-api.spec.ts` | 1 (`scope` ALL/OWN จาก permission) |
| UI smoke | `e2e/app-smoke.spec.ts` | 7 (login, redirect, หน้าหลัก + admin roles) |
| Admin tour | `e2e/admin-tour.spec.ts` | 3 (ทัวร์ Joyride) |

รวม **15 tests** — รันเร็วด้วย `npm run test:e2e:smoke` (12 tests ไม่รวม admin tour)

## เตรียมครั้งเดียว

1. PostgreSQL + migrations (รวม `084_confirmation_export_all_permission.sql`)
2. Seed ผู้ใช้: `database/seeds/009_dev_auth_seed.sql` → `ADMIN01` / `admin`
3. คัดลอก `PM-Pepsi-App/frontend/e2e/.env.example` → `e2e/.env` (หรือตั้ง env ด้านล่าง)

## รัน

```bash
# Terminal 1 — API
cd PM-Pepsi-App/backend && npm run dev

# Terminal 2 — UI (proxy /api → :4000)
cd PM-Pepsi-App/frontend && npm run dev

# Terminal 3 — E2E
cd PM-Pepsi-App/frontend
set E2E_USE_DEV_SEED=1
set PLAYWRIGHT_SKIP_WEBSERVER=1
npm run test:e2e:smoke
```

หรือให้ Playwright เปิด server เอง (ต้องมี `backend/.env` + DB):

```bash
cd PM-Pepsi-App/frontend
set E2E_USE_DEV_SEED=1
npm run test:e2e
```

**หมายเหตุ Windows:** ใช้ `PLAYWRIGHT_BASE_URL=http://localhost:5173` (ไม่ใช่ `127.0.0.1`) — Vite มัก bind เฉพาะ `localhost`.

## บัญชีทดสอบ

| วิธี | ตัวแปร |
|-----|--------|
| Dev seed | `E2E_USE_DEV_SEED=1` → `ADMIN01` / `admin` |
| กำหนดเอง | `E2E_ADMIN_USER`, `E2E_ADMIN_PASSWORD` ใน `e2e/.env` |
