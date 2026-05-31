-- ============================================================
-- 公告系統（announcements）
-- ============================================================

----------------------------------------------------------------
-- announcements：公告主檔（會員端首頁顯示、後台新增/刪除）
----------------------------------------------------------------
create table if not exists public.announcements (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  content    text not null,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists announcements_active_created_idx
  on public.announcements(created_at desc)
  where is_active = true;

drop trigger if exists announcements_touch on public.announcements;
create trigger announcements_touch before update on public.announcements
  for each row execute function public.touch_updated_at();

----------------------------------------------------------------
-- RLS：service_role 全權；anon/authenticated 完全拒絕（同其他業務表）
----------------------------------------------------------------
alter table public.announcements enable row level security;
alter table public.announcements force row level security;
