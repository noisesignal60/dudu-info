# Supabase 保活（Keep-Alive）

## 為什麼需要

Supabase 免費方案的專案在約 **7 天無任何資料庫活動** 後會被自動暫停（pause），
之後成員端與後台都無法存取，必須手動到 Supabase Dashboard 喚醒。

本專案用 **Vercel Cron** 每天呼叫一個受保護的路由 `/api/keep-alive`，
該路由對最輕量的 `admins` 表做一次 `SELECT`，讓 Supabase 視為有活動而不暫停。

> ⚠️ Supabase 內建的 `pg_cron` 無法解決此問題 —— 它跑在資料庫內部，
> 專案暫停後就不會執行，內部活動也不計入「避免暫停」。必須由外部排程觸發。

## 組成

| 檔案 | 作用 |
|------|------|
| `src/app/api/keep-alive/route.ts` | GET 路由，驗證 `CRON_SECRET` 後查詢 `admins` 表 |
| `vercel.json` | `crons` 設定，每天 06:00 UTC 觸發一次 |
| `.env.example` → `CRON_SECRET` | 來源驗證金鑰 |

排程運作流程：

```
Vercel Cron（每天 06:00 UTC）
  └─ GET /api/keep-alive  （Vercel 自動帶上 Authorization: Bearer ${CRON_SECRET}）
       └─ supabaseAdmin().from("admins").select("id").limit(1)  ← 真實 DB 查詢，計入活動
```

## 部署後必做設定

1. 產生一段隨機金鑰：

   ```bash
   openssl rand -base64 32
   ```

2. 到 **Vercel 專案 → Settings → Environment Variables**，新增：

   - Name：`CRON_SECRET`
   - Value：上一步產生的字串
   - 套用環境：至少勾選 **Production**

3. **重新部署**一次，讓環境變數與 `vercel.json` 的 cron 設定生效。

   > Vercel Cron 觸發本路由時，會自動帶上 `Authorization: Bearer ${CRON_SECRET}`，
   > 路由據此驗證來源；缺少或不符的請求會被拒絕（401）。

## 驗證

- **本機測試**（先在 `.env` 設好 `CRON_SECRET`，執行 `npm run dev`）：

  ```bash
  # 成功 → 200 { "ok": true, "ts": ... }
  curl -H "Authorization: Bearer <你的 CRON_SECRET>" http://localhost:3000/api/keep-alive

  # 未帶 token → 401
  curl http://localhost:3000/api/keep-alive
  ```

- **Vercel 上**：Dashboard → 專案 → **Crons** 可看到排程，點 **Run** 可手動觸發一次，
  並在 **Logs** 確認回應 200。

- **最終確認**：Supabase Dashboard 的 Logs 中可見對應時間的查詢，專案維持 **Active**。

## 調整排程頻率

預設每天觸發（遠在 7 天視窗內，也符合 Vercel Hobby 方案「cron 每天最多一次」限制）。
若要改頻率，編輯 `vercel.json` 的 `schedule`（標準 cron 語法，UTC 時區）。
