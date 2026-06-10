import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Supabase 保活（keep-alive）路由。
 *
 * 為什麼需要：Supabase 免費方案在約 7 天「無資料庫活動」後會自動暫停專案。
 * 由 Vercel Cron 每天呼叫一次本路由，對最輕量的 admins 表做一次真實 SELECT，
 * 讓 Supabase 視為有活動而不暫停。（見 vercel.json 的 crons 設定）
 *
 * 注意：
 * - 本路由會讀取 request 的 Authorization header 並執行 DB 查詢，
 *   在 cacheComponents 模式下因而是「請求時執行」的動態路由，不會被預渲染/快取。
 * - 來源驗證靠 CRON_SECRET：Vercel Cron 觸發時會自動帶上
 *   `Authorization: Bearer ${CRON_SECRET}`（前提是已在 Vercel 設定該環境變數）。
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;

  // 未設定 CRON_SECRET 視為設定錯誤，直接拒絕，避免路由在無保護下被公開呼叫。
  if (!secret) {
    return Response.json(
      { ok: false, error: "CRON_SECRET 未設定" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }

  // 驗證來源：只接受帶正確 Bearer token 的請求。
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return Response.json(
      { ok: false, error: "未授權" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  // 對最輕量的 admins 表做一次讀取即可計入 Supabase 活動。
  const { error } = await supabaseAdmin()
    .from("admins")
    .select("id")
    .limit(1);

  if (error) {
    console.error("[keep-alive] Supabase 查詢失敗:", error.message);
    return Response.json(
      { ok: false, error: error.message },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }

  return Response.json(
    { ok: true, ts: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
