-- ============================================================
-- 種子資料：預設分潤比例
-- ============================================================
-- 插入一筆 active 的 commission_settings，避免 UI 在初始狀態顯示「尚無設定」。
-- 管理員可在 /admin/commission 隨時更新（會產生新一筆 active=true，舊的 active=false）。

insert into public.commission_settings
  (rate_a, rate_b, rate_c, rate_d, rate_e, new_bonus, is_active)
select 0, 0, 0, 0, 0, 0, true
where not exists (
  select 1 from public.commission_settings where is_active = true
);
