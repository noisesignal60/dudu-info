----------------------------------------------------------------
-- ledger_entries：新增帶正負號的衍生欄 amount = income - expense
--
-- UI 已將「收入／支出」兩欄合併為單一帶正負號「金額」欄（正＝收入、負＝支出）。
-- DB 仍保留 income / expense 兩欄；此衍生欄僅供帳簿明細表依「金額」做伺服器端排序。
-- 冪等：可重複執行。
----------------------------------------------------------------

alter table public.ledger_entries
  add column if not exists amount numeric(14,2)
  generated always as (income - expense) stored;

create index if not exists ledger_entries_amount_idx
  on public.ledger_entries(amount)
  where deleted_at is null;
