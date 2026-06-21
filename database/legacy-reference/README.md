# Legacy DDL จาก MySQL (`sap_lay`)

## ทำไมต้องมีโฟลเดอร์นี้

- ไฟล์ [`sap/db_lays.sql`](../sap/db_lays.sql) เป็นชุด dump ชื่อ **`db_lays`** (ปี 2020) **อาจไม่ตรง** กับฐาน **`sap_lay`** ที่รันจริงบน [`MySQL/data/sap_lay/`](../../MySQL/data/sap_lay)
- การมี **`SHOW CREATE TABLE` / `SHOW CREATE VIEW`** จาก instance จริง ช่วยล็อก migration ไป PostgreSQL ได้ถูกต้อง

## ขั้นตอน (รูปธรรม)

1. เปิด shell ที่มี `mysql` client ชี้ไป instance เดียวกับ [`sap/include/connection.php`](../sap/include/connection.php) (host / user / dbname `sap_lay`)
2. รันคำสั่งตัวอย่าง:

```sql
SHOW CREATE TABLE tbworkcenter\G
SHOW CREATE TABLE tbworkcenter_userlog\G
SHOW CREATE TABLE tbactivitytype\G
SHOW CREATE VIEW view_order\G
```

3. คัดลอกผลลัพธ์เก็บเป็นไฟล์ในโฟลเดอร์นี้ เช่น `tbworkcenter.mysql.sql` (หรือใช้สคริปต์ [`../scripts/export-sap-lay-schema.ps1`](../scripts/export-sap-lay-schema.ps1) เพื่อได้ไฟล์รวม `sap_lay-core-objects.mysql.sql`)

## รายการ object ที่ควรมี DDL ก่อน (ลำดับแรก)

- `tbworkcenter`, `tbworkcenter_userlog` — login / logout
- `tbactivitytype` — master ตัวอย่างใน parity checklist
- `tbiw37n` — IW37N
- `view_order`, `view_lineschdul` — calendar / backlog

ไฟล์ที่ generate จากเครื่องคุณ **อาจมีข้อมูลอ่อนไหว** — อย่า commit ถ้ามี policy ห้าม; ใช้เฉพาะ `--no-data` ถ้าต้องการแค่โครงสร้าง
