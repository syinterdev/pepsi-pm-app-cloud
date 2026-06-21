# Database — PostgreSQL (แอป PM)

โฟลเดอร์นี้เก็บ **migration**, **สคริปต์**, และ **อ้างอิง DDL จาก MySQL** สำหรับย้ายจาก `sap_lay` ไป PostgreSQL ตาม [`docs/PM-BACKEND-DATABASE-DESIGN.md`](../docs/PM-BACKEND-DATABASE-DESIGN.md)

## โครงสร้าง

| Path | ใช้ทำอะไร |
|------|-----------|
| [`migrations/`](migrations/) | ไฟล์ SQL รันต่อลำดับบน PostgreSQL (เริ่มที่ `001_…`) |
| [`legacy-reference/`](legacy-reference/) | DDL จาก MySQL (`mysqldump --no-data`) — อ่านคำแนะนำใน README ในโฟลเดอร์ |
| [`scripts/`](scripts/) | `run-all-migrations.ps1`, `run-all-seeds.ps1`, `verify_app_schema.sql`, import MySQL |
| [`seeds/`](seeds/) | `009` auth, `010` demo data — ดู [`seeds/README.md`](seeds/README.md) |
| [`database.env.example`](database.env.example) | ตัวอย่างตัวแปรเชื่อมต่อ (ไม่ใส่รหัสจริง) |

## ขั้นตอนรันบนเครื่องคุณ (หลังติดตั้ง PostgreSQL แล้ว)

1. สร้าง role/database สำหรับแอป (ครั้งเดียว) เช่น `pm_dev` และ user `pm_app`  
2. ตั้งค่า `DATABASE_URL` หรือค่าใน `database.env.example` แล้วโหลดเป็น env  
3. **แนะนำ:** รันครบ migration + seed + ตรวจ admin (ลำดับ 14 §0):

```powershell
# ใช้ DATABASE_URL จาก PM-Pepsi-App/backend/.env (DBeaver: 127.0.0.1:5433/pepsi_pm)
powershell -File database/scripts/run-all-migrations.ps1
powershell -File database/scripts/run-all-seeds.ps1
powershell -File database/scripts/verify-admin-environment.ps1
```

เฉพาะชุด admin (มี 001–043 แล้ว):

```powershell
powershell -File database/scripts/run-admin-migrations.ps1
psql "%DATABASE_URL%" -f database/scripts/verify_admin_data_tables.sql
```

ติดตั้ง on-site: [`docs/ON-SITE-DATABASE-SETUP.md`](../docs/ON-SITE-DATABASE-SETUP.md)  
ย้ายเครื่องใหม่ / restore backup: [`docs/SETUP-NEW-MACHINE.md`](../docs/SETUP-NEW-MACHINE.md)

4. หรือรัน migration ทีละไฟล์ (แทนที่ **host**, **พอร์ต**, **user**, **database**, **รหัส** ให้ตรงกับ instance ของคุณ):

```powershell
# พอร์ต 5432 = default ของ PostgreSQL — ถ้าบนเครื่องมีโปรเจกต์อื่นใช้ 5432 อยู่แล้ว (เช่น PG 11)
# ให้ตั้ง instance ใหม่ให้ฟังพอร์ตว่าง เช่น 5433 ใน postgresql.conf แล้วใส่พอร์ตนั้นในสตริงด้านล่าง
psql "postgresql://pm_app:YOUR_PASSWORD@127.0.0.1:5432/pm_dev" -v ON_ERROR_STOP=1 -f database/migrations/001_init_auth_tables.sql
# ตัวอย่างเมื่อ PG ฟังที่ 5433:
# psql "postgresql://postgres:YOUR_PASSWORD@127.0.0.1:5433/pm_dev" -v ON_ERROR_STOP=1 -f database/migrations/001_init_auth_tables.sql
```

4. (แนะนำ) ดึง DDL จริงจาก MySQL แล้วปรับ migration ให้ตรงชนิดข้อมูล:

```powershell
pwsh -File database/scripts/export-sap-lay-schema.ps1
```

5. รัน migration ถัดไป (master data):

```powershell
psql "postgresql://pepsipm:YOUR_PASSWORD@127.0.0.1:5433/pepsi_pm" -v ON_ERROR_STOP=1 -f database/migrations/002_tbactivitytype.sql
```

6. Auth เมนู + สมาชิก (ลำดับที่ 1):

```powershell
psql "postgresql://pepsipm:YOUR_PASSWORD@127.0.0.1:5433/pepsi_pm" -v ON_ERROR_STOP=1 -f database/migrations/008_auth_tbmenu_member.sql
```

7. (ทางเลือก) นำเข้าเมนู/ผู้ใช้จาก MySQL จริง:

```powershell
pwsh -File database/scripts/import-auth-from-mysql.ps1
# จากนั้นรัน generated SQL ใน DBeaver
```

8. Seed ผู้ใช้ทดสอบ:

```powershell
psql "postgresql://pepsipm:YOUR_PASSWORD@127.0.0.1:5433/pepsi_pm" -v ON_ERROR_STOP=1 -f database/seeds/009_dev_auth_seed.sql
```

9. เชื่อม API กับ PostgreSQL — ใน [`PM-Pepsi-App/backend/`](../PM-Pepsi-App/backend/) คัดลอก `.env.example` → `.env` แล้วตั้ง `DATABASE_URL` ให้ชี้ database เดียวกับขั้นตอนข้างบน จากนั้นรัน `npm install` และ `npm run dev` แล้วทดสอบ `GET /api/v1/health` (ควรได้ `db: "ok"` เมื่อ migration รันสำเร็จ)

## หมายเหตุ

- ข้อมูล bind mount สำหรับ Docker บนลูกค้า ยังยึด `{PROJECT_ROOT}/database/postgres` ตาม [`skills.md`](../skills.md) — โฟลเดอร์นี้เป็น **โค้ด migration + เอกสาร** ไม่จำเป็นต้องเท่ากับ data volume ทั้งหมด
- งานค้างหลังรัน migration แต่ละลำดับ — ดู [`docs/parity-pending/`](../docs/parity-pending/README.md) (ซิงค์กับ [`PHP-REACT-PARITY-CHECKLIST.md`](../docs/PHP-REACT-PARITY-CHECKLIST.md))
