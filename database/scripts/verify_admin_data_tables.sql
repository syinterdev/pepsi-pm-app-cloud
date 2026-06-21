-- ตรวจตาราง admin §3.2 (migrations 044–068)
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/scripts/verify_admin_data_tables.sql

\echo '=== Admin data tables (§3.2) ==='
WITH expected(name, migration) AS (
  VALUES
    ('tbl_role', '044'),
    ('tbl_permission', '045'),
    ('tbl_role_permission', '046'),
    ('tbl_setting', '047'),
    ('tbl_audit_log', '050'),
    ('tbl_backup_history', '062'),
    ('tbl_announcement', '064'),
    ('tbl_user_pref', '068')
)
SELECT e.migration,
       e.name AS table_name,
       EXISTS (
         SELECT 1 FROM information_schema.tables t
         WHERE t.table_schema = 'app'
           AND t.table_name = e.name
           AND t.table_type = 'BASE TABLE'
       ) AS ok
FROM expected e
ORDER BY e.migration;
