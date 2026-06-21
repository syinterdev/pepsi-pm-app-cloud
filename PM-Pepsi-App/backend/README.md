# pm-api — Backend (Express + PostgreSQL)

สอดคล้อง [`PROJECT-STRUCTURE.md`](../../PROJECT-STRUCTURE.md) และสัญญา path **`/api/v1/*`** กับ [`frontend`](../frontend/)

## ความต้องการ

- Node.js 20+
- PostgreSQL (รัน migration จาก [`../../database/migrations/`](../../database/migrations/) ก่อน)

## ตั้งค่า

```powershell
cd PM-Pepsi-App/backend
copy .env.example .env
# แก้ DATABASE_URL ให้ตรงกับ instance ของคุณ (รวมพอร์ต — ถ้า 5432 ถูก PG ตัวอื่นใช้แล้ว ใส่พอร์ตที่ว่าง เช่น 5433)
```

## รัน dev

```powershell
npm install
npm run dev
```

ทดสอบ: `GET http://127.0.0.1:4000/api/v1/health` — ฟิลด์ `db` เป็น `ok` เมื่อเชื่อม PG ได้

### Auth (เทียบ `sap/pages/login.php`)

| Method | Path | หมายเหตุ |
|--------|------|----------|
| `POST` | `/api/v1/auth/login` | body `{ "username", "password" }` — `username` = `idwkctr` ใน legacy |
| `POST` | `/api/v1/auth/logout` | body `{ "userId", "username" }` — เขียน `tbworkcenter_userlog` action `out` |
| `GET` | `/api/v1/auth/me` | ตรวจ JWT (`Authorization: Bearer` หรือ cookie `pm_session`) — คืน `{ user }` |

ตั้ง `SESSION_SECRET` ใน `.env` (อย่างน้อย 16 ตัวอักษร) — login ตั้ง cookie `HttpOnly` + คืน `token` ใน JSON

ตัวอย่าง (PowerShell):

```powershell
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:4000/api/v1/auth/login `
  -ContentType application/json `
  -Body '{"username":"TEST01","password":"password123"}'
```

user ทดสอบ (สร้างใน DBeaver บน `pepsi_pm`):

```sql
-- ชื่อตารางต้องเป็น schema.table (ไม่ใช่ app_tbworkcenter)
INSERT INTO app.tbworkcenter (idwkctr, pass, wkctr, userst)
VALUES ('TEST01', 'password123', 'WC01', 'U')
ON CONFLICT (idwkctr) DO NOTHING;
```

### Master data

| Method | Path | หมายเหตุ |
|--------|------|----------|
| `GET` | `/api/v1/master-data/activitytype` | ต้อง login — อ่าน `app.tbactivitytype` (รัน migration `002`) |

แท็บ master อื่นใน UI ยัง mock/501 จนมี migration ตารางนั้นใน PG

## ผูกกับ frontend (Vite)

ใน [`frontend/vite.config.ts`](../frontend/vite.config.ts) ตั้ง **proxy** `/api` → `http://127.0.0.1:4000` แล้ว

- ไม่ตั้ง `VITE_API_URL` → เรียก `/api/v1/...` same-origin ผ่าน proxy
- ถ้าต้องการยิง backend จริงแทน MSW: ตั้ง `VITE_ENABLE_MSW=false` ใน `frontend/.env.local` (ดู `frontend/.env.example`)
