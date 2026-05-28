# 資料庫設定 — 從零跑到 `npm run dev`

> 本文件適用於「全新環境」的使用者:沒有 Supabase 專案、沒有設定過 `.env.local`。
> 完成全部步驟後,你應該可以本機 `npm run dev` 並登入後台。

---

## 1. 建立 Supabase 雲端專案

1. 至 <https://supabase.com> 註冊 / 登入。
2. **New Project** → 選 Organization → 設定:
   - **Name**: `dudu-info`(隨意)
   - **Database Password**: 自訂一組強密碼,**抄下來**(`db:reset` 時會用到)
   - **Region**: 建議 `Northeast Asia (Tokyo)` 或 `Northeast Asia (Seoul)`
3. 等專案建立完畢(約 1–2 分鐘)。
4. 進入專案後,從左下角 **Project Settings → API** 抄下:
   - **Project URL** → 給 `NEXT_PUBLIC_SUPABASE_URL`
   - **Publishable key**(`sb_publishable_...`)→ 給 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - **Secret key**(`sb_secret_...`,點 reveal 才看得到)→ 給 `SUPABASE_SECRET_KEY`
5. 從 **Project Settings → General** 抄下:
   - **Reference ID**(`xxxxxxxxxxxxxxxxxxxx`,20 字)→ 接下來 `supabase link` 時要用

---

## 2. 產生合併 SQL 並貼到 SQL Editor

本案 schema 由 `supabase/migrations/` 內 4 個 `.sql` 檔組成。我們**不裝 Supabase CLI**,改用內建 helper 把它們串成單一檔,然後手貼到 Dashboard 的 SQL Editor 執行。

### 2.1 產生合併檔

於專案根目錄(`C:\Users\<你>\Desktop\dudu-info`)執行:

```powershell
npm run db:bundle
```

成功會看到:

```
✓ 已產生 ...\supabase\_combined.sql
  4 migrations, ~7,000 chars
```

### 2.2 複製內容

開啟 `supabase\_combined.sql`(用 VS Code 或記事本均可),**全選(Ctrl+A)+ 複製(Ctrl+C)**。

> 此檔已加入 `.gitignore`,是 derived artefact,不會 commit 進去。

### 2.3 貼到 Supabase SQL Editor 執行

1. 回到 Supabase Dashboard
2. 左側選單點 **SQL Editor**(`</> ` 圖示)
3. 點 **+ New query** 開一個空白 query
4. **Ctrl+V** 整段貼進去
5. 點右下角 **Run**(或 `Ctrl+Enter`)

執行成功會看到 `Success. No rows returned`。

### 2.4 驗證

成功後,到 **Table Editor** 應該能看到 8 張表:

```
members            balances             transactions       withdrawals
commission_settings admins              departments        ledger_entries
```

到 **Storage** 看到 `passbooks` bucket(private)。

回到 SQL Editor 跑:
```sql
select * from commission_settings;
```
應該至少有 1 筆 `is_active = true` 的預設設定。

> 未來若 schema 有變更:在 `supabase/migrations/` 新增 SQL 檔 → 再跑 `npm run db:bundle` → 把**新增的那個 migration 區段**單獨貼到 SQL Editor 跑(不要整個 `_combined.sql` 重跑,雖然每個 migration 都是 idempotent,但浪費時間)。

---

## 4. 填寫 `.env.local`

複製 `.env.example` 為 `.env.local`(若 `.env.local` 已存在但內容是 placeholder,直接編輯):

```powershell
Copy-Item .env.example .env.local -Force  # 慎用：會覆蓋
```

依下表填入。**生成隨機密鑰**用 PowerShell 一行:

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { [byte](Get-Random -Maximum 256) }))
```
每次跑會吐一組 32 byte 的 base64 字串。`AUTH_SECRET` 和 `ADMIN_SESSION_SECRET` 各跑一次,**用不同的字串**。

| 變數 | 值的來源 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | 步驟 1 抄的 Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 步驟 1 抄的 publishable key(`sb_publishable_...`) |
| `SUPABASE_SECRET_KEY` | 步驟 1 抄的 secret key(`sb_secret_...`) |
| `SUPABASE_BUCKET_PASSBOOK` | 固定填 `passbooks` |
| `AUTH_SECRET` | 上面 PowerShell 生成一組 |
| `AUTH_URL` | `http://localhost:3000` |
| `AUTH_TRUST_HOST` | `true` |
| `AUTH_LINE_ID` | LINE Developers Console → 你的 Channel ID(見步驟 6)|
| `AUTH_LINE_SECRET` | 同上 → Channel Secret |
| `ADMIN_SESSION_SECRET` | 上面 PowerShell 生成「另一組」 |

> 沒申請 LINE channel 也可以先填假值 — 後台仍可登入測試,只是會員端 LINE 登入會失敗。

---

## 5. 建立第一個 admin

```powershell
npx tsx scripts/seed-admin.ts admin "你的強密碼" "系統管理員"
```

訊息出現 `✓ 已建立管理員「admin」` 就成功。

---

## 6. (可選)申請 LINE Login Channel

只有要讓會員端 LINE 登入時才需要。

1. 至 <https://developers.line.biz/console/> 登入 LINE 開發者帳號。
2. 建一個 Provider(若沒有)→ 在 Provider 下建一個 **LINE Login** Channel。
3. 在 Channel 的 **LINE Login** 分頁:
   - **Callback URL** 填 `http://localhost:3000/api/auth/callback/line`
   - 上線後再加上 production 的 URL
4. 從 **Basic settings** 抄 `Channel ID` 與 `Channel secret`,填到 `.env.local`。

---

## 7. 啟動驗證

```powershell
npm run dev
```

開瀏覽器:

- <http://localhost:3000/admin/login> → 用步驟 5 的帳號密碼登入 → 進到後台儀表板(沒有錯誤)就成功
- <http://localhost:3000/admin/commission> → 看到 1 筆「生效中」的歷史紀錄(預設 0%)
- <http://localhost:3000/reports> → 看到收支總表空狀態(沒有錯誤)

---

## 常見問題

| 症狀 | 解法 |
| --- | --- |
| SQL Editor 跑到一半噴 `relation already exists` | 你之前已部分跑過。每個 migration 都是 idempotent,通常可忽略,但建議用乾淨的 Supabase 專案重來 |
| 後台登入後跳 `iron-session` 錯誤 | `ADMIN_SESSION_SECRET` 沒填或長度不足 32 |
| `/admin/commission` 顯示「目前沒有設定」 | `_seed_defaults` migration 沒跑成功。手動執行下面 SQL: |
| 上傳存摺失敗 / 看不到圖 | `passbooks` bucket 未建,或 `SUPABASE_BUCKET_PASSBOOK` 沒填 |
| LINE 登入後卡在 callback | Channel Callback URL 與 `AUTH_URL` 不一致 |

手動補種子:
```sql
insert into public.commission_settings
  (rate_a, rate_b, rate_c, rate_d, rate_e, new_bonus, is_active)
values (0, 0, 0, 0, 0, 0, true);
```

---

## 進階:後續 schema 變更

未來要改 schema 時:

1. 在 `supabase/migrations/` **新增**一個 `YYYYMMDDHHMMSS_<name>.sql`(時間戳遞增即可)
2. **永遠不要修改已執行過的 migration**(雖然目前沒有 CLI 追蹤,但維持習慣)
3. 跑 `npm run db:bundle` 重新產生 `_combined.sql`
4. 開 `_combined.sql`,**只**複製你新增的 migration 區段(`-- ──── <檔名> ────` 那段),貼到 SQL Editor 執行
   - 因為每個 migration 都是 idempotent,如果整段重跑也不會壞,但浪費時間
5. 若怕跑錯,先到 SQL Editor 用 `begin; ... rollback;` 包起來試一次

要重置整個雲端資料庫(**會清空所有資料**):

- 到 Supabase Dashboard → **Project Settings → General → Pause / Restore**,或
- 直接 **Delete project** 後重建一個新的,再從步驟 2 重做

> 之後若有意願,可以隨時改用 Supabase CLI(`supabase db push`)— migration 檔案結構已經是 CLI 標準格式。安裝步驟詳見 <https://supabase.com/docs/guides/cli>。
