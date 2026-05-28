/**
 * 把 supabase/migrations/*.sql 依檔名排序串接成單一 SQL 檔，
 * 方便使用者一次複製貼到 Supabase Dashboard → SQL Editor 執行。
 *
 * 用法：
 *   npm run db:bundle
 *
 * 產出：
 *   supabase/_combined.sql （已加入 .gitignore；視為 derived artefact）
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const MIGRATIONS_DIR = join(ROOT, "supabase", "migrations");
const OUT_PATH = join(ROOT, "supabase", "_combined.sql");

const files = readdirSync(MIGRATIONS_DIR)
  .filter((f) => f.endsWith(".sql"))
  .sort();

if (files.length === 0) {
  console.error("✗ 找不到任何 .sql migration");
  process.exit(1);
}

const parts: string[] = [
  "-- ============================================================",
  "-- 自動產生 — 請勿手動編輯",
  "-- 來源：supabase/migrations/*.sql（共 " + files.length + " 個檔）",
  "-- 由 npm run db:bundle 產生",
  "--",
  "-- 使用方式：",
  "--   1. 開 Supabase Dashboard → SQL Editor",
  "--   2. 把本檔內容整段貼上",
  "--   3. 點 Run（或 Ctrl/Cmd+Enter）",
  "--",
  "-- 每個 migration 都是 idempotent，可重複執行。",
  "-- ============================================================",
  "",
];

for (const f of files) {
  parts.push(`-- ──── ${f} ────────────────────────────────────────────`);
  parts.push(readFileSync(join(MIGRATIONS_DIR, f), "utf-8").trim());
  parts.push("");
}

const output = parts.join("\n") + "\n";
writeFileSync(OUT_PATH, output, "utf-8");

console.log(
  `✓ 已產生 ${OUT_PATH}\n  ${files.length} migrations, ${output.length.toLocaleString()} chars`,
);
console.log(
  "\n下一步：開啟 supabase/_combined.sql，全選複製，貼到 Supabase Dashboard SQL Editor 執行。",
);
