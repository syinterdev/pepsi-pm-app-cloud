# ติดตั้งฐานข้อมูล PM Pepsi — on-site / offline (ไดรฟ์ D:)

อ้างอิง [`skills.md`](../skills.md) §1.3–1.4, [`database/README.md`](../database/README.md), [`parity-pending/00-cross-cutting.md`](parity-pending/00-cross-cutting.md)

---

## 1) โครงสร้างโฟลเดอร์บนเซิร์ฟเวอร์ลูกค้า

```
D:\PM-Pepsi-App\                    ← PROJECT_ROOT
  database\
    migrations\                     ← 001–008
    seeds\                          ← 009, 010
    scripts\                        ← run-all-migrations.ps1, verify
    postgres\                       ← ข้อมูล PG (Docker volume)
  PM-Pepsi-App\
    backend\
    frontend\
```

---

## 2) PostgreSQL

| รายการ | ค่าแนะนำ |
|--------|----------|
| ภายใน Docker | `db:5432` |
| บน host (เครื่องลูกค้า) | `localhost:55432` |
| Database | `pepsi_pm` |
| Schema แอป | **`app`** (ไม่ใช่แค่ `public`) |

สร้าง role/database ครั้งเดียว (ตัวอย่าง):

```sql
CREATE USER pepsipm WITH PASSWORD '***';
CREATE DATABASE pepsi_pm OWNER pepsipm;
```

---

## 3) รัน migration + seed (ครั้งแรก)

### วิธี A — DBeaver

1. เปิด connection ไป `pepsi_pm`
2. รันตามลำดับ:
   - `database/migrations/001_init_auth_tables.sql`
   - … จนถึง `008_auth_tbmenu_member.sql`
3. รัน `database/seeds/009_dev_auth_seed.sql`
4. รัน `database/seeds/010_dev_demo_data.sql`
5. รัน `database/scripts/verify_app_schema.sql` — ทุก `ok` = true

### วิธี B — psql (ถ้ามี client)

```powershell
cd D:\PM-Pepsi-App
$env:DATABASE_URL = "postgresql://pepsipm:***@127.0.0.1:55432/pepsi_pm"
pwsh -File database/scripts/run-all-migrations.ps1 -DatabaseUrl $env:DATABASE_URL
pwsh -File database/scripts/run-all-seeds.ps1 -DatabaseUrl $env:DATABASE_URL
psql $env:DATABASE_URL -f database/scripts/verify_app_schema.sql
```

### นำเข้าจาก MySQL เดิม (ถ้ามี XAMPP / sap_lay)

```powershell
pwsh -File database/scripts/import-auth-from-mysql.ps1
# รัน database/seeds/generated/import_tbmenu_pg.sql
# รัน database/seeds/generated/import_tbworkcenter_pg.sql
```

จากนั้นยังรัน `010` เพื่อ WO/line demo (หรือ import WO จากสคริปต์อนาคต)

---

## 4) ตั้งค่า Backend / Frontend

**Backend** `PM-Pepsi-App/backend/.env`:

```env
DATABASE_URL=postgresql://pepsipm:***@127.0.0.1:55432/pepsi_pm
SESSION_SECRET=***-min-16-chars-***
CORS_ORIGIN=http://localhost:5173
PORT=4000
```

**Frontend** `PM-Pepsi-App/frontend/.env`:

```env
VITE_ENABLE_MSW=false
VITE_API_URL=
```

Vite proxy ชี้ `/api` → backend (ดู `vite.config.ts`)

ทดสอบ:

- `GET http://localhost:4000/api/v1/health` → `"db":"ok"`
- Login `WC001` / `wc001` → `/line-calendar` มีข้อมูล

---

## 5) Backup (แนวทาง)

- Backup โฟลเดอร์ `database/postgres` ตามรอบที่ลูกค้าตกลง
- หรือ `pg_dump -Fc pepsi_pm > D:\backup\pepsi_pm_YYYYMMDD.dump`

---

## 6) Checklist cross-cutting

เมื่อครบขั้นตอนด้านบน ให้อัปเดต [`parity-pending/00-cross-cutting.md`](parity-pending/00-cross-cutting.md) §ฐานข้อมูล
