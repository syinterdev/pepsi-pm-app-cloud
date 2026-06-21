# UAT — Template IW37N ZB02All (ลูกค้า)

อัปเดต: **2026-06-03** · อ้างอิง P0 #2 ใน [`MEETING-SUMMARY-REQUIREMENTS.md`](MEETING-SUMMARY-REQUIREMENTS.md)

---

## ไฟล์ที่ลูกค้าให้

> **รายงาน UAT ฉบับลูกค้า (ข้อ 5):** [`UAT-ITEM5-EXCEL-CUSTOMER-FILES.md`](UAT-ITEM5-EXCEL-CUSTOMER-FILES.md)

| ไฟล์ | ที่อยู่ | ชนิดจริง | แถว parse |
|------|---------|----------|-----------|
| `Templete IW37N on PM App - ZB02All.xlsx` | `docs from customer/` | **IW37N** (ZB02 · แผน 27.05.2026) | **522** |
| `Templete IW37N on PM App - ZB02All 1.xlsx` | `docs from customer/` | **IW37N ชุดเดียวกัน** (ไม่ใช่ Confirm IN) | **522** |

**สรุป:** ทั้งสองไฟล์เป็น **IW37N เท่านั้น** — ใช้ไฟล์ใดไฟล์หนึ่งที่แท็บ **นำเข้า IW37N** (`/integration` หรือ `/iw37n`)  
Confirm IN ต้องเป็น **ไฟล์ SAP แยก** (ALV Confirm / IW47) ที่มี **Order ตรงกับ WO หลัง import** (เช่น `4001570392`)

---

## รัน automation (dev)

```powershell
cd PM-Pepsi-App\backend
npm run uat:phase2-zb02all -- --reset
```

| Check | ผล (2026-06-03) |
|-------|------------------|
| `iw37n-zb02all` | PASS — inserted **522** |
| `calendar-after-zb02all` | PASS — **212** events · เดือน **2026-5** |
| `confirm-in-paired` | FAIL — ไม่มีไฟล์ Confirm ใน repo ที่ match Order `400157xxxx` |

---

## Confirm IN — สิ่งที่ยังต้องได้จากลูกค้า

1. Export **Confirm IN** จาก SAP **ชุดเดียวกับ** ZB02All (Order `4001570392` … `4001570931`)
2. อัปที่ `/integration` → แท็บ **นำเข้า Confirm (IN)** — **ไม่ใช่** แท็บ IW37N
3. เกณฑ์ผ่าน: `tbcofirm` insert/update **> 0** · ไม่ skipped ทั้งก้อนเพราะ “ไม่พบ WO”

ไฟล์ที่ลองแล้ว **ไม่ match** ZB02All:

| ไฟล์ | confirm rows | match Order ZB02All |
|------|--------------|---------------------|
| `AcZB02,ZB05-Done.xlsx` | 749 | 0 |
| `IW47 Daily 12May2026.xlsx` | 94 | 0 (Order 400156xxxx) |
| `Export_Confirm (26May).xlsx` | 0 parse ok | 0 |

---

## UAT มือ (Planner)

1. Login สิทธิ์ `iw37n.import`
2. `/integration` → IW37N → เลือก `Templete IW37N on PM App - ZB02All.xlsx`
3. Preview → inserted+updated > 0 → Commit
4. `/calendar` → เลือก **พ.ค. 2026** → ต้องเห็น WO ZB02
5. (เมื่อมีไฟล์ Confirm) แท็บ Confirm IN → preview → commit → ตรวจ `tbcofirm`
