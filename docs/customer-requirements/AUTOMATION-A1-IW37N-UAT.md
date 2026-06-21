# UAT A1 — นำเข้า IW37N ที่ `/integration` (แท็บ IW37N)

อัปเดต: 2026-05-22 · อ้างอิง [`AUTOMATION-PHASES.md`](AUTOMATION-PHASES.md) Phase A1

---

## เกณฑ์ผ่าน

| รายการ | ผ่านเมื่อ |
|--------|----------|
| Preview | `isDuplicate = false` · `inserted + updated > 0` |
| Commit | Toast แสดง inserted/updated > 0 · batch สถานะ OK หรือ PARTIAL (มี error บางแถวได้) |
| ไม่ผ่าน | แบนเนอร์ม่วง “ไฟล์ซ้ำ” · ทุกแถว skipped · `inserted=0` และ `updated=0` |

---

## ทำไมถึง skipped ทั้งก้อน?

ระบบเก็บ **SHA256** ของไฟล์ใน `tbiw37n_import_batch`  
อัปโหลด **ไฟล์เดิม (เนื้อหาเดิม)** อีกครั้ง → batch ใหม่แต่ **ทุกแถว skipped** (ไม่แตะ `tbiw37n`)

**วิธีแก้ก่อน UAT UI:**

```powershell
cd C:\Users\Chinchettha\Desktop\sap_241163\PM-Pepsi-App\backend
npm run uat:reset-iw37n
```

หรือ reset ทั้งชุด (รวม Confirm):

```powershell
npm run uat:phase2 -- --reset
```

---

## ขั้นตอน UAT บนเว็บ (ทีละขั้น)

### 0) เตรียม

- [ ] Backend `http://127.0.0.1:4000/api/v1/health` ตอบ OK
- [ ] Frontend `http://localhost:5173`
- [ ] Login ด้วย user ที่มีสิทธิ์ **`iw37n.import`** (หรือ `integration.admin`)
- [ ] (แนะนำ) รัน `npm run uat:reset-iw37n` ถ้าเคยอัป `IW37N ล่าสุด.xlsx` แล้ว

### 1) เปิดหน้า

- [ ] ไป **`/integration`**
- [ ] แท็บ **นำเข้า IW37N** (ไม่ใช่ Confirm IN)

### 2) เลือกไฟล์

ไฟล์ตัวอย่าง (repo):

```
from customer/SAP data/Data/IW37N ล่าสุด.xlsx
```

- [ ] กด **เลือกไฟล์** → เลือกไฟล์ด้านบน (หรือ `.xls` ชื่อเดียวกัน)
- [ ] กด **ตรวจสอบก่อน commit** (Preview)

### 3) ตรวจผล Preview

ในกล่องสีเหลือง **สรุปก่อน commit**:

- [ ] **ไม่มี** แบนเนอร์ม่วง “ไฟล์ซ้ำ”
- [ ] ตัวเลข **เพิ่ม (insert)** หรือ **อัปเดต (update)** รวม **> 0**
- [ ] ปุ่ม **ยืนยันนำเข้า (commit)** กดได้ (ไม่ disabled)

ถ้าเห็นม่วงซ้ำ → กลับไปรัน `uat:reset-iw37n` หรือใช้ไฟล์ที่ไม่เคยอัป

### 4) Commit

- [ ] กด **ยืนยันนำเข้า (commit)**
- [ ] Toast เขียว: `นำเข้าสำเร็จ — เพิ่ม X · อัปเดต Y · ข้าม Z`
- [ ] ตาราง batch ล่าสุด: สถานะ **OK** (หรือ PARTIAL ถ้ามี error น้อย)

### 5) บันทึกผล

| ฟิลด์ | ค่าที่บันทึก |
|-------|-------------|
| Batch # | |
| inserted | |
| updated | |
| skipped | |
| SHA (12 ตัวแรก) | |
| ผู้ทดสอบ / วันที่ | |

---

## ทดสอบ API (เทียบเท่า UI)

```powershell
cd PM-Pepsi-App\backend
npm run uat:reset-iw37n
npm run uat:phase2
```

คาดหวังบรรทัด:

```text
[PASS] integration-iw37n-batch-log: batch #… inserted=1163 updated=0 skipped=0 dup=false
```

(ตัวเลข inserted อาจต่างเล็กน้อยถ้าไฟล์ต่างจากตัวอย่าง)

---

## หมายเหตุ `functionalloc` / 7151

**ตรวจแล้ว (2026-05-22):** ดู [`FACTORY-FUNCTIONALLOC-7151.md`](FACTORY-FUNCTIONALLOC-7151.md)

| ไฟล์ | มี `7151` ใน functionalloc |
|------|---------------------------|
| `IW37N ล่าสุด.xlsx` | **0%** — ALV มีแค่ FunctLocDescrip (คำอธิบาย) |
| `IW37N May-Jun.xls` | **100%** — มีคอลัมน์ Functional loc. |

สำหรับ UAT **ปฏิทิน/WO** ให้ import:

```
from customer/SAP data/Jul/IW37N May-Jun.xls
```

แล้ว `npm run probe:functionalloc` · เลือกปี **2020** เดือน **พ.ค.–มิ.ย.** บนปฏิทิน

---

## Checklist ใน AUTOMATION-PHASES

เมื่อผ่านครบขั้น 1–4 ด้านบน ให้ติ๊ก:

- [x] UAT `/integration` แท็บ IW37N — `inserted`/`updated` > 0
- [x] API `uat:phase2` / `uat:reset-iw37n` (ถ้ารันแล้วผ่าน)
