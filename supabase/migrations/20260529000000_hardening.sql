-- ============================================================
-- 安全與一致性強化（對齊 2026 Supabase 最佳實踐）
-- ============================================================
-- 內容：
--   1. touch_updated_at 函式加 search_path 防護 + security invoker
--   2. 所有業務表加 force row level security（防 table owner 繞過；
--      service_role 仍會繞過，不影響應用程式）
--   3. commission_settings 加 partial unique index：強制只能有一筆 is_active=true
--   4. 移除多餘 index：referral_code 已是 UNIQUE，會自動建 index

----------------------------------------------------------------
-- 1. trigger function 強化
----------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

----------------------------------------------------------------
-- 2. force row level security
----------------------------------------------------------------
alter table public.members             force row level security;
alter table public.balances            force row level security;
alter table public.transactions        force row level security;
alter table public.withdrawals         force row level security;
alter table public.commission_settings force row level security;
alter table public.admins              force row level security;
alter table public.departments         force row level security;
alter table public.ledger_entries      force row level security;

----------------------------------------------------------------
-- 3. commission_settings 一筆 active 強制
----------------------------------------------------------------
create unique index if not exists commission_active_only_one_idx
  on public.commission_settings (is_active)
  where is_active = true;

----------------------------------------------------------------
-- 4. 移除多餘 index（unique constraint 已自動建）
----------------------------------------------------------------
drop index if exists public.members_referral_code_idx;
