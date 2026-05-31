-- 移除 members.email 欄位（信箱資訊不再使用）
-- idempotent：可重複執行
alter table public.members drop column if exists email;
