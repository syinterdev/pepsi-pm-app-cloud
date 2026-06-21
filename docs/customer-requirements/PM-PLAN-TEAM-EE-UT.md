# PM Plan Team — A / B / EE / UT

อัปเดต: **2026-06-02**

## ตัวกรองและมอบหมายทีม

| ค่า | ความหมาย |
|-----|----------|
| **A** | ทีม A (แผน PM — คงเดิม) |
| **B** | ทีม B (แผน PM — คงเดิม) |
| **EE** | Electrical Engineering (ช่าง PAC / PRO) |
| **UT** | Utility (ช่าง UTI) |

ค่าเก่า **P** และ **ยังไม่กำหนด** ถูกตัดออกจาก dropdown แล้ว

## Migration 088 — แปลง `team = P` ในฐานข้อมูล

ไฟล์: [`database/migrations/088_migrate_team_p_to_ee_ut.sql`](../../database/migrations/088_migrate_team_p_to_ee_ut.sql)

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/088_migrate_team_p_to_ee_ut.sql
```

### กฎแปลง

1. หารหัสช่างจาก (ลำดับ): `tbiw37n.wkctr` → `tbplangingwork.wkctr` → `tbmoveplan.mwkctr`
2. `UTI###` → **UT**
3. `PAC###` / `PRO###` → **EE**
4. ไม่พบรหัสช่าง → **EE** (default — ตรวจและแก้ manual หลัง UAT ได้)

### ตรวจหลังรัน

```sql
SELECT team, count(*) FROM app.tbiw37n GROUP BY team ORDER BY team;
SELECT count(*) FROM app.tbiw37n WHERE upper(trim(coalesce(team,''))) = 'P';
```

## โค้ดอ้างอิง

- ตัวเลือกตัวกรอง: `PM_PLAN_TEAM_FILTER_OPTIONS` ใน `activity-type-label.ts`
- Schema API: `pmPlanTeamFieldSchema` ใน `pm-plan-team.ts`
- UI มอบหมาย: `/work-orders`, `WorkOrderDetailDialog`
