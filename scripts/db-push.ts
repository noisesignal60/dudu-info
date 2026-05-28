/**
 * 直接連 Supabase Postgres 推送 migrations。
 *
 * 用法：
 *   npm run db:push                  ← 推所有 migration（按檔名排序）
 *   npm run db:push -- --file=NAME   ← 只推 supabase/migrations/<NAME>
 *
 * 需要的環境變數（.env.local）：
 *   DATABASE_URL=postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres
 *
 * 從 Supabase Dashboard → Project Settings → Database → Connection string (URI, Session mode) 取得。
 */
import "@next/env";
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Client } from "pg";

const MIGRATIONS_DIR = join(process.cwd(), "supabase", "migrations");

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error(
      "✗ 缺少環境變數 DATABASE_URL\n" +
        "  到 Supabase Dashboard → Project Settings → Database → Connection string\n" +
        "  選 URI + Session mode，貼到 .env.local：\n" +
        '    DATABASE_URL="postgresql://postgres.<ref>:<password>@...pooler.supabase.com:5432/postgres"',
    );
    process.exit(1);
  }

  const onlyFlag = process.argv.find((a) => a.startsWith("--file="));
  const onlyFile = onlyFlag ? onlyFlag.slice("--file=".length) : null;

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const target = onlyFile ? files.filter((f) => f === onlyFile) : files;
  if (target.length === 0) {
    console.error(
      onlyFile
        ? `✗ 找不到 migration：${onlyFile}`
        : "✗ supabase/migrations/ 內沒有 .sql 檔",
    );
    process.exit(1);
  }

  console.log(`▶ 即將推送 ${target.length} 個 migration:`);
  for (const f of target) console.log(`   • ${f}`);
  console.log();

  const client = new Client({ connectionString: url });
  await client.connect();

  try {
    for (const f of target) {
      const sql = readFileSync(join(MIGRATIONS_DIR, f), "utf-8");
      process.stdout.write(`▶ ${f} ... `);
      try {
        await client.query(sql);
        console.log("✓");
      } catch (err) {
        console.log("✗");
        throw err;
      }
    }
    console.log("\n✓ 全部推送完成");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("\n✗ 推送失敗:", err instanceof Error ? err.message : err);
  process.exit(1);
});
