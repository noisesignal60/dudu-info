-- ============================================================
-- 嘟嘟資訊網｜管理員登入防暴力破解：失敗計數 + 遞增鎖定
-- ============================================================
-- 在既有 admins 列上記錄連續失敗次數與鎖定到期時間，
-- 登入 action（src/actions/admin-auth.ts）據此節流。
-- 本檔可重複執行（idempotent）。

alter table public.admins
  add column if not exists failed_attempts int not null default 0;

alter table public.admins
  add column if not exists locked_until timestamptz;
