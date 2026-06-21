# เชื่อมต่อ Supabase

| รายการ | ค่า |
|--------|-----|
| Project URL | https://rbuencvudatesysexeoq.supabase.co |
| Project ref | `rbuencvudatesysexeoq` |
| Region | `ap-southeast-2` |
| Pooler host | `aws-1-ap-southeast-2.pooler.supabase.com` |

## โปรเจกตนี้ไม่ใช้ Prisma

Supabase แสดง config แบบ Prisma (`DATABASE_URL` + `DIRECT_URL`) — แอปนี้ใช้ **Express + `pg`** ตัวเดียว อ่านแค่ **`DATABASE_URL`** ใน `PM-Pepsi-App/backend/.env`

| Supabase (Prisma) | โปรเจกต PM Pepsi |
|-------------------|------------------|
| `DIRECT_URL` (session pooler `:5432`) | ใช้เป็น **`DATABASE_URL`** — backend + migration |
| `DATABASE_URL` (transaction pooler `:6543?pgbouncer=true`) | **ไม่ใช้** — อาจพังกับ prepared statements ของ `pg` |

## Connection strings ที่ใช้

**Backend + migration (แนะนำ):**

```env
DATABASE_URL=postgresql://postgres.rbuencvudatesysexeoq:[YOUR-PASSWORD]@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres
```

**Transaction pooler (ไม่แนะนำสำหรับแอปนี้):**

```env
# DATABASE_URL=postgresql://postgres.rbuencvudatesysexeoq:[YOUR-PASSWORD]@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true
```

## ขั้นตอนติดตั้ง

1. **Reset database password** — Dashboard → Database → Settings → Reset database password
2. แทน `[YOUR-PASSWORD]` ใน `PM-Pepsi-App/backend/.env`
3. รัน migration:

```powershell
$env:PATH = "C:\Program Files\Git\bin;" + $env:PATH
cd "c:\Users\Chinchettha\Desktop\pepsi_pm_application-main - Copy"
$env:DATABASE_URL = "postgresql://postgres.rbuencvudatesysexeoq:รหัสผ่าน@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres"
pwsh -File database/scripts/run-all-migrations.ps1 -DatabaseUrl $env:DATABASE_URL
```

4. (Dev) seed บัญชีทดสอบ:

```powershell
pwsh -File database/scripts/run-all-seeds.ps1 -DatabaseUrl $env:DATABASE_URL
```

5. ทดสอบ backend:

```powershell
cd PM-Pepsi-App/backend
npm run dev
# GET http://127.0.0.1:4000/api/v1/health → "db":"ok"
```

## Cursor MCP

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?project_ref=rbuencvudatesysexeoq"
    }
  }
}
```

Cursor → Settings → MCP → login Supabase ให้ server `supabase` เป็น Connected

## หมายเหตุ

- Schema หลักของแอปคือ **`app`** (migration สร้างให้อัตโนมัติ)
- อย่า commit `.env` ที่มีรหัสผ่าน
- Backup ใช้ Supabase Dashboard (ไม่ใช่ `pg_dump` on-prem ทั้งหมด)
