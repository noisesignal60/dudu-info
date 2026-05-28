/**
 * 建立預設管理員。執行方式：
 *   npx tsx scripts/seed-admin.ts <username> <password> [<displayName>]
 *
 * 範例：
 *   npx tsx scripts/seed-admin.ts admin Pa55word "系統管理員"
 *
 * 需設定的環境變數：
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY
 */
// 自動載入 .env.local（與 Next.js dev 行為一致）
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { createClient } from "@supabase/supabase-js";
import argon2 from "argon2";

const [, , username, password, displayName] = process.argv;

if (!username || !password) {
  console.error("Usage: npx tsx scripts/seed-admin.ts <username> <password> [<displayName>]");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("缺少環境變數 NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SECRET_KEY");
  process.exit(1);
}

const db = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const hash = await argon2.hash(password, { type: argon2.argon2id });

  const { data: existing } = await db
    .from("admins")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (existing) {
    const { error } = await db
      .from("admins")
      .update({
        password_hash: hash,
        display_name: displayName ?? username,
      })
      .eq("id", existing.id);
    if (error) throw error;
    console.log(`✓ 已更新管理員「${username}」的密碼`);
  } else {
    const { error } = await db.from("admins").insert({
      username,
      password_hash: hash,
      display_name: displayName ?? username,
    });
    if (error) throw error;
    console.log(`✓ 已建立管理員「${username}」`);
  }
}

main().catch((err) => {
  console.error("✗ 建立管理員失敗：", err);
  process.exit(1);
});
