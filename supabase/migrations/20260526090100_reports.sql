-- ============================================================
-- 帳簿系統（部門 + 收支明細）+ 管理員停用旗標
-- ============================================================

----------------------------------------------------------------
-- 1. admins 停用旗標
----------------------------------------------------------------
alter table public.admins
  add column if not exists is_active boolean not null default true;

----------------------------------------------------------------
-- 2. departments：帳簿部門
----------------------------------------------------------------
create table if not exists public.departments (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists departments_name_uidx on public.departments(name);

drop trigger if exists departments_touch on public.departments;
create trigger departments_touch before update on public.departments
  for each row execute function public.touch_updated_at();

----------------------------------------------------------------
-- 3. ledger_entries：收支明細（軟刪除）
----------------------------------------------------------------
create table if not exists public.ledger_entries (
  id            uuid primary key default gen_random_uuid(),
  entry_date    date not null,
  department_id uuid not null references public.departments(id) on delete restrict,
  car_or_person text,
  item          text not null,
  income        numeric(14,2) not null default 0,
  expense       numeric(14,2) not null default 0,
  note1         text,
  note2         text,
  sort_order    integer not null default 0,
  deleted_at    timestamptz,
  created_by    uuid,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists ledger_date_idx
  on public.ledger_entries(entry_date desc)
  where deleted_at is null;

create index if not exists ledger_dept_date_idx
  on public.ledger_entries(department_id, entry_date desc)
  where deleted_at is null;

drop trigger if exists ledger_touch on public.ledger_entries;
create trigger ledger_touch before update on public.ledger_entries
  for each row execute function public.touch_updated_at();

----------------------------------------------------------------
-- 4. RLS
----------------------------------------------------------------
alter table public.departments    enable row level security;
alter table public.ledger_entries enable row level security;
