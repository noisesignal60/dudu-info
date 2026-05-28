-- ============================================================
-- 嘟嘟資訊網｜核心 schema：會員 / 餘額 / 交易 / 提領 / 分潤設定 / 管理員
-- ============================================================
-- 為避免與 auth.users 衝突，所有業務表放 public schema。
-- 本檔可重複執行（idempotent）。

----------------------------------------------------------------
-- 0. updated_at trigger function（其他 migration 也會用）
----------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

----------------------------------------------------------------
-- 1. enums（PostgreSQL 沒有 CREATE TYPE IF NOT EXISTS，用 DO 區塊包）
----------------------------------------------------------------
do $$
begin
  create type public.transaction_kind as enum (
    'commission',  -- 分潤
    'reward',      -- 新帳號獎勵
    'withdrawal',  -- 提領
    'adjust'       -- 手動調整
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.withdrawal_status as enum (
    'pending',   -- 待審核
    'approved',  -- 已通過
    'rejected'   -- 已拒絕
  );
exception when duplicate_object then null;
end $$;

----------------------------------------------------------------
-- 2. members：會員主檔（對應 LINE 使用者）
----------------------------------------------------------------
create table if not exists public.members (
  id                uuid primary key default gen_random_uuid(),
  line_user_id      text unique not null,
  line_display      text,
  line_avatar_url   text,
  email             text,
  name              text,
  phone             text,
  birthday          date,
  bank_holder       text,
  bank_account      text,
  bank_code         text,
  passbook_url      text,                                -- Storage path（不可覆蓋）
  referral_code     text unique,
  upline_id         uuid references public.members(id),
  profile_completed boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists members_upline_idx        on public.members(upline_id);
create index if not exists members_referral_code_idx on public.members(referral_code);

drop trigger if exists members_touch on public.members;
create trigger members_touch before update on public.members
  for each row execute function public.touch_updated_at();

----------------------------------------------------------------
-- 3. balances：金額快照
----------------------------------------------------------------
create table if not exists public.balances (
  member_id    uuid primary key references public.members(id) on delete cascade,
  total_earned numeric(14,2) not null default 0,
  pending      numeric(14,2) not null default 0,
  withdrawn    numeric(14,2) not null default 0,
  locked       numeric(14,2) not null default 0,
  updated_at   timestamptz not null default now()
);

drop trigger if exists balances_touch on public.balances;
create trigger balances_touch before update on public.balances
  for each row execute function public.touch_updated_at();

----------------------------------------------------------------
-- 4. transactions：交易紀錄
----------------------------------------------------------------
create table if not exists public.transactions (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null references public.members(id) on delete cascade,
  kind        public.transaction_kind not null,
  amount      numeric(14,2) not null,
  title       text not null,
  description text,
  ref_id      uuid,
  created_at  timestamptz not null default now(),
  created_by  uuid
);

create index if not exists tx_member_idx on public.transactions(member_id, created_at desc);

----------------------------------------------------------------
-- 5. withdrawals：提領申請
----------------------------------------------------------------
create table if not exists public.withdrawals (
  id           uuid primary key default gen_random_uuid(),
  member_id    uuid not null references public.members(id) on delete cascade,
  amount       numeric(14,2) not null check (amount >= 100),
  bank_code    text,
  bank_account text,
  note         text,
  status       public.withdrawal_status not null default 'pending',
  admin_note   text,
  processed_at timestamptz,
  processed_by uuid,
  created_at   timestamptz not null default now()
);

create index if not exists wd_status_idx on public.withdrawals(status, created_at desc);
create index if not exists wd_member_idx on public.withdrawals(member_id, created_at desc);

----------------------------------------------------------------
-- 6. commission_settings：分潤比例
----------------------------------------------------------------
create table if not exists public.commission_settings (
  id         uuid primary key default gen_random_uuid(),
  rate_a     numeric(5,2) not null,
  rate_b     numeric(5,2) not null,
  rate_c     numeric(5,2) not null,
  rate_d     numeric(5,2) not null,
  rate_e     numeric(5,2) not null,
  new_bonus  numeric(14,2) not null default 0,
  is_active  boolean not null default true,
  changed_by uuid,
  created_at timestamptz not null default now()
);

----------------------------------------------------------------
-- 7. admins：後台管理員
----------------------------------------------------------------
create table if not exists public.admins (
  id            uuid primary key default gen_random_uuid(),
  username      text unique not null,
  display_name  text not null,
  password_hash text not null,        -- argon2id
  last_login_at timestamptz,
  created_at    timestamptz not null default now()
);

----------------------------------------------------------------
-- 8. RLS：所有業務表預設拒絕 anon/authenticated；service_role 繞過
----------------------------------------------------------------
alter table public.members             enable row level security;
alter table public.balances            enable row level security;
alter table public.transactions        enable row level security;
alter table public.withdrawals         enable row level security;
alter table public.commission_settings enable row level security;
alter table public.admins              enable row level security;

-- 不建立 policy 即代表「除 service_role 外完全拒絕」。
-- 應用程式所有 DB 操作都走 service_role（見 src/lib/supabase/admin.ts）。
