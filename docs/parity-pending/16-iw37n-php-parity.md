# IW37N — PHP parity (`M_iw37n.php`)

อ้างอิง: `sap/pages/M_iw37n.php`, `sap/pages/M_iw37n_imports.php`  
โปรเจคใหม่: `PM-Pepsi-App/backend/src/services/iw37n-parser.ts`, `iw37n.ts`, `frontend/.../Iw37nPage.tsx`

## สรุปความเท่ากัน

| พฤติกรรม | PHP | โปรเจคใหม่ | สถานะ |
|----------|-----|------------|--------|
| ข้าม 2 แถวแรกของชีต (legacy) | `$n>2` | `parseIw37nMatrix` legacy เริ่ม index 2 | ✅ |
| SAP Dynamic List Display | ไม่รองรับคอลัมน์ S (Row[1] ว่าง) | `sap_alv` + colOffset 2 สำหรับคอลัมน์ 0–14 | ✅ (ดีกว่า PHP) |
| ตรวจค่าว่าง Row 1,2,4,6,7,8,17,18 | บรรทัด 83 | `rowFailsPhpImportValidation` | ✅ |
| แปลงวันที่ dd.mm.yyyy | `explode` + `mktime` | `parseDdMmYyyy` / Excel serial | ✅ |
| สถานะ syst REL/CRTD vs อื่น | บรรทัด 113–118 | `parseSystemStatus` | ✅ |
| Upsert key | `wkorder` + `opac` | `wkorder` + `opac` | ✅ |
| INSERT/UPDATE ฟิลด์ 0–18 | บรรทัด 130–146 | `upsertIw37Row` | ✅ |
| นำเข้าทันที (ไม่มี preview) | ปุ่ม Import | ปุ่ม **นำเข้าเลย** | ✅ |
| นำเข้าไฟล์ซ้ำ | ทำ upsert ได้ | เคย skip ทั้งไฟล์ด้วย SHA — **แก้แล้ว** upsert ตาม PHP | ✅ |
| หลายชีตในไฟล์ | `for sheetCount` | อ่านทุกชีตใน workbook | ✅ |
| แก้ไข/ลบรายการ | `op=save` / `op=del` | API + หน้า IW37N | ✅ |
| จำกัดรายการ 1000 | `limit 0,1000` | pagination API | ✅ (ต่าง UX) |

## ความต่างที่ยอมรับได้

| รายการ | หมายเหตุ |
|--------|----------|
| บันทึก batch + SHA256 | เพิ่ม audit ไม่มีใน PHP |
| Preview ก่อน commit | เพิ่มจากประชุม — มีปุ่มนำเข้าเลยเทียบ PHP |
| SAP ALV คอลัมน์ 15–18 | PHP อ่าน `$Row[15..18]` จากคอลัมน์ A (บนไฟล์ ALV จะได้ Work/Un./ฯลฯ ไม่ใช่ชื่อโรงงาน) — Node ใช้ index เดียวกับ PHP เพื่อ parity |
| RBAC | PHP ใช้สิทธิ์เมนู A/U/W — API รับ `iw37n.import` หรือ `iw37n.write` |

## ทดสอบ

```bash
cd PM-Pepsi-App/backend
npm test -- --run src/services/iw37n-parser.test.ts
npx tsx scripts/inspect-iw37n-sample.ts "path/to/IW37N.xlsx"
```

ไฟล์อ้างอิงลูกค้า: `from customer/SAP data/Data/IW37N ล่าสุด.xlsx` — คาด ~1100+ แถวหลัง parse
