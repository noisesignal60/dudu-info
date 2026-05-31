-- ============================================================
-- 嘟嘟資訊網｜整合 Schema 概覽（人類可讀）
--
-- ⚠️ 此檔僅供審閱與快速理解，請勿手動執行。
--     真實 schema 由 supabase/migrations/ 管理，
--     部署流程詳見 docs/database-setup.md。
-- ============================================================

-- 為避免 schema 與 auth.users 衝突，所有業務表放 public schema。

----------------------------------------------------------------
-- 1. members：會員主檔（對應 LINE 使用者）
----------------------------------------------------------------
create table if not exists public.members (
  id              uuid primary key default gen_random_uuid(),
  line_user_id    text unique not null,            -- LINE userId（authoritative）
  line_display    text,                            -- LINE 顯示名稱
  line_avatar_url text,
  name            text,                            -- 系統內姓名（可改）
  phone           text,                            -- 行動電話（可改）
  birthday        date,
  bank_holder     text,                            -- 銀行戶名（可改）
  bank_account    text,                            -- 銀行帳號（可改）
  bank_code       text,
  passbook_url    text,                            -- 銀行存摺圖片（不可再覆蓋）
  referral_code   text unique,                     -- 自己的推薦碼
  upline_id       uuid references public.members(id), -- 上級（介紹人）
  profile_completed boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists members_upline_idx on public.members(upline_id);
create index if not exists members_referral_code_idx on public.members(referral_code);

----------------------------------------------------------------
-- 2. balances：金額快照（避免每次 sum() 重算）
----------------------------------------------------------------
create table if not exists public.balances (
  member_id        uuid primary key references public.members(id) on delete cascade,
  total_earned     numeric(14,2) not null default 0,  -- 總金額（累計收益）
  pending          numeric(14,2) not null default 0,  -- 待領取金額
  withdrawn        numeric(14,2) not null default 0,  -- 已領取金額
  locked           numeric(14,2) not null default 0,  -- 審核中金額（鎖定）
  updated_at       timestamptz not null default now()
);

----------------------------------------------------------------
-- 3. transactions：交易紀錄
----------------------------------------------------------------
create type if not exists transaction_kind as enum (
  'commission',  -- 分潤
  'reward',      -- 新帳號獎勵
  'withdrawal',  -- 提領
  'adjust'       -- 手動調整
);

create table if not exists public.transactions (
  id            uuid primary key default gen_random_uuid(),
  member_id     uuid not null references public.members(id) on delete cascade,
  kind          transaction_kind not null,
  amount        numeric(14,2) not null,            -- 收入為正、支出為負
  title         text not null,                     -- 交易名目
  description   text,
  ref_id        uuid,                              -- 關聯（如 withdrawal_id）
  created_at    timestamptz not null default now(),
  created_by    uuid                               -- 操作者（admin 才有值）
);

create index if not exists tx_member_idx on public.transactions(member_id, created_at desc);

----------------------------------------------------------------
-- 4. withdrawals：提領申請
----------------------------------------------------------------
create type if not exists withdrawal_status as enum (
  'pending',   -- 待審核
  'approved',  -- 已通過
  'rejected'   -- 已拒絕
);

create table if not exists public.withdrawals (
  id              uuid primary key default gen_random_uuid(),
  member_id       uuid not null references public.members(id) on delete cascade,
  amount          numeric(14,2) not null check (amount >= 100),
  bank_code       text,
  bank_account    text,
  note            text,
  status          withdrawal_status not null default 'pending',
  admin_note      text,
  processed_at    timestamptz,
  processed_by    uuid,
  created_at      timestamptz not null default now()
);

create index if not exists wd_status_idx on public.withdrawals(status, created_at desc);
create index if not exists wd_member_idx on public.withdrawals(member_id, created_at desc);

----------------------------------------------------------------
-- 5. commission_settings：分潤比例（五級 + 新會員獎勵）
----------------------------------------------------------------
create table if not exists public.commission_settings (
  id            uuid primary key default gen_random_uuid(),
  rate_a        numeric(5,2) not null,
  rate_b        numeric(5,2) not null,
  rate_c        numeric(5,2) not null,
  rate_d        numeric(5,2) not null,
  rate_e        numeric(5,2) not null,
  new_bonus     numeric(14,2) not null default 0,
  is_active     boolean not null default true,
  changed_by    uuid,
  created_at    timestamptz not null default now()
);

----------------------------------------------------------------
-- 6. admins：管理員（給 /admin 與 /reports 用，本階段先建表）
----------------------------------------------------------------
create table if not exists public.admins (
  id            uuid primary key default gen_random_uuid(),
  username      text unique not null,
  display_name  text not null,
  password_hash text not null,                     -- argon2id
  last_login_at timestamptz,
  created_at    timestamptz not null default now()
);

----------------------------------------------------------------
-- 觸發器：updated_at
----------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end;
$$;

drop trigger if exists members_touch on public.members;
create trigger members_touch before update on public.members
  for each row execute function public.touch_updated_at();

drop trigger if exists balances_touch on public.balances;
create trigger balances_touch before update on public.balances
  for each row execute function public.touch_updated_at();

----------------------------------------------------------------
-- RLS（Row-Level Security）
-- 由於本案採 Auth.js (不是 Supabase Auth)，前端會員端不直接連 Supabase；
-- 所有資料庫操作走 Server Component / Server Action 使用 service_role key。
-- 仍保留 RLS 作為深度防禦（defense-in-depth）。
----------------------------------------------------------------
alter table public.members enable row level security;
alter table public.balances enable row level security;
alter table public.transactions enable row level security;
alter table public.withdrawals enable row level security;
alter table public.commission_settings enable row level security;
alter table public.admins enable row level security;

-- 預設拒絕所有 anon / authenticated 讀寫（透過後端 service_role 操作）
-- service_role 會繞過 RLS。

-- 若日後改用 Supabase Auth + JWT 帶入 line_user_id，可加入：
-- create policy "member can read self" on public.members
--   for select using (line_user_id = auth.jwt() ->> 'line_user_id');

----------------------------------------------------------------
-- Storage Bucket：銀行存摺圖片
-- 請在 Supabase Dashboard → Storage 建立 bucket 'passbooks' (private)
-- 並設定 policies 限制只有 service_role 可讀寫。
----------------------------------------------------------------

-- ============================================================
-- Phase 2 追加（2026-05）：帳簿系統 + 管理員停用
-- ============================================================

-- 7. admins 加上停用旗標
alter table public.admins
  add column if not exists is_active boolean not null default true;

----------------------------------------------------------------
-- 8. departments：帳簿部門
----------------------------------------------------------------
create table if not exists public.departments (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create unique index if not exists departments_name_uidx on public.departments(name);

drop trigger if exists departments_touch on public.departments;
create trigger departments_touch before update on public.departments
  for each row execute function public.touch_updated_at();

----------------------------------------------------------------
-- 9. ledger_entries：帳簿明細（收支記錄）
--    軟刪除（deleted_at）以保留稽核軌跡
----------------------------------------------------------------
create table if not exists public.ledger_entries (
  id             uuid primary key default gen_random_uuid(),
  entry_date     date not null,
  department_id  uuid not null references public.departments(id) on delete restrict,
  car_or_person  text,
  item           text not null,
  income         numeric(14,2) not null default 0,
  expense        numeric(14,2) not null default 0,
  note1          text,
  note2          text,
  sort_order     integer not null default 0,
  deleted_at     timestamptz,
  created_by     uuid,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists ledger_date_idx
  on public.ledger_entries(entry_date desc) where deleted_at is null;
create index if not exists ledger_dept_date_idx
  on public.ledger_entries(department_id, entry_date desc) where deleted_at is null;

drop trigger if exists ledger_touch on public.ledger_entries;
create trigger ledger_touch before update on public.ledger_entries
  for each row execute function public.touch_updated_at();

alter table public.departments enable row level security;
alter table public.ledger_entries enable row level security;
