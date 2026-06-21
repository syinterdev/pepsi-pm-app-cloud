# Deploy Backend บน Railway

**Repo ที่ใช้:** https://github.com/syinterdev/pepsi-pm-app-cloud (branch `main`)  
**ไม่ใช้:** `syinterdev/pepsi-pm-app`

## สิ่งที่เตรียมแล้ว

- `PM-Pepsi-App/backend/Dockerfile`
- `PM-Pepsi-App/backend/railway.toml`
- Database: Supabase (migration + seed แล้ว)

## สาเหตุ Build failed บน Railway

Repo เป็น monorepo — Dockerfile อยู่ที่ `PM-Pepsi-App/backend/` ไม่ใช่ root

**แก้แล้ว:** ใช้ `Dockerfile` ที่ **root repo** (build context = root) — อย่าใช้ `PM-Pepsi-App/backend/Dockerfile` จาก root เพราะจะหา `package.json` ไม่เจอ

**ทางเลือก:** ตั้ง Root Directory = `PM-Pepsi-App/backend` แล้วใช้ Dockerfile ในโฟลเดอร์นั้น

## Healthcheck failed (service unavailable)

Build ผ่านแต่ deploy fail ที่ `/api/v1/health` — สาเหตุที่พบบ่อย:

1. **ไม่ได้ตั้ง Variables บน Railway** (แอป crash ตอน start)
2. **`sharp` บน Alpine** — แก้แล้ว: ใช้ `node:20-slim` ใน Dockerfile

### Variables ที่ต้องมี (Railway → Variables)

| ตัวแปร | จำเป็น | ตัวอย่าง |
|--------|--------|----------|
| `DATABASE_URL` | ใช่ | `postgresql://postgres.rbuencvudatesysexeoq:***@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres` |
| `SESSION_SECRET` | ใช่ | สุ่ม ≥ 32 ตัวอักษร |
| `NODE_ENV` | แนะนำ | `production` |
| `CORS_ORIGIN` | แนะนำ | `https://your-app.vercel.app` |
| `APP_PUBLIC_URL` | แนะนำ | URL Railway ของ service |
| `BACKUP_SCHEDULER` | แนะนำ | `0` |
| `INTEGRATION_WATCH_SCHEDULER` | แนะนำ | `0` |

ดู **Deploy Logs → Runtime Logs** ถ้าเห็น `Invalid environment variables` = ขาด `DATABASE_URL` หรือ `SESSION_SECRET`

## Environment variables (Railway Dashboard → Variables)

| ตัวแปร | ค่า |
|--------|-----|
| `DATABASE_URL` | Session pooler Supabase `:5432` |
| `SESSION_SECRET` | สุ่มอย่างน้อย 32 ตัวอักษร |
| `CORS_ORIGIN` | URL frontend Vercel เช่น `https://your-app.vercel.app` |
| `APP_PUBLIC_URL` | URL Railway เช่น `https://pm-api-production.up.railway.app` |
| `NODE_ENV` | `production` |
| `BACKUP_SCHEDULER` | `0` (Railway ไม่มี pg_dump) |
| `INTEGRATION_WATCH_SCHEDULER` | `0` (ถ้าไม่มีโฟลเดอร์ SAP บน cloud) |

## Deploy ด้วย CLI

```powershell
$env:PATH = "C:\Program Files\Git\bin;" + $env:PATH
cd PM-Pepsi-App/backend
npx @railway/cli login
npx @railway/cli init
npx @railway/cli up
npx @railway/cli domain
```

## ทดสอบ

```text
GET https://<your-railway-domain>/api/v1/health
→ { "ok": true, "db": "ok" }
```

## บัญชีทดสอบ (หลัง seed)

| User | Password |
|------|----------|
| ADMIN01 | admin |
| WC001 | wc001 |
| demo | demo |
