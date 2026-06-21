# Deploy Backend บน Railway

## สิ่งที่เตรียมแล้ว

- `PM-Pepsi-App/backend/Dockerfile`
- `PM-Pepsi-App/backend/railway.toml`
- Database: Supabase (migration + seed แล้ว)

## สาเหตุ Build failed บน Railway

Repo เป็น monorepo — Dockerfile อยู่ที่ `PM-Pepsi-App/backend/` ไม่ใช่ root

**แก้แล้ว:** เพิ่ม `Dockerfile` + `railway.toml` ที่ root repo ชี้ไป backend

**หรือ** ตั้ง Railway → Settings → Source → **Root Directory** = `PM-Pepsi-App/backend`

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
