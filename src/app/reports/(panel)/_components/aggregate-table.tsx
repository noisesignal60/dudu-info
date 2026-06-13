import type { LedgerAggregateRow } from "@/data/reports/ledger";
import { formatAmount, cn } from "@/lib/utils";
import { EmptyState } from "@/ui/empty-state";
import {
  SheetScroll,
  SheetTable,
  SheetHead,
  SheetHeadCell,
  SheetCorner,
  SheetRowNum,
  SheetCell,
} from "@/ui/sheet";

export function AggregateTable({ rows }: { rows: LedgerAggregateRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="bg-surface border border-hairline rounded-card">
        <EmptyState title="無資料" />
      </div>
    );
  }

  const totalIncome = rows.reduce((s, r) => s + r.income, 0);
  const totalExpense = rows.reduce((s, r) => s + r.expense, 0);
  const totalNet = rows.reduce((s, r) => s + r.net, 0);

  return (
    <SheetScroll>
      <SheetTable>
        <SheetHead>
          <tr>
            <SheetCorner>#</SheetCorner>
            <SheetHeadCell>期間</SheetHeadCell>
            <SheetHeadCell>收入</SheetHeadCell>
            <SheetHeadCell>支出</SheetHeadCell>
            <SheetHeadCell>淨額</SheetHeadCell>
          </tr>
        </SheetHead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.key}>
              <SheetRowNum>{i + 1}</SheetRowNum>
              <SheetCell className="font-medium text-slate-900">
                {r.label}
              </SheetCell>
              <SheetCell className="text-right font-bold text-positive">
                {formatAmount(r.income)}
              </SheetCell>
              <SheetCell className="text-right font-bold text-money">
                {formatAmount(-r.expense)}
              </SheetCell>
              <SheetCell
                className={cn(
                  "text-right font-black",
                  r.net >= 0 ? "text-positive" : "text-money",
                )}
              >
                {r.net >= 0 ? "" : "-"}
                {formatAmount(Math.abs(r.net))}
              </SheetCell>
            </tr>
          ))}
        </tbody>
        <tfoot className="sticky bottom-0 z-10">
          <tr>
            <SheetRowNum className="bg-canvas">Σ</SheetRowNum>
            <SheetCell className="bg-canvas font-bold text-slate-900">
              合計
            </SheetCell>
            <SheetCell className="bg-canvas text-right font-bold text-positive">
              {formatAmount(totalIncome)}
            </SheetCell>
            <SheetCell className="bg-canvas text-right font-bold text-money">
              {formatAmount(-totalExpense)}
            </SheetCell>
            <SheetCell
              className={cn(
                "bg-canvas text-right font-black",
                totalNet >= 0 ? "text-positive" : "text-money",
              )}
            >
              {totalNet >= 0 ? "" : "-"}
              {formatAmount(Math.abs(totalNet))}
            </SheetCell>
          </tr>
        </tfoot>
      </SheetTable>
    </SheetScroll>
  );
}
