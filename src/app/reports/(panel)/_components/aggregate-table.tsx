"use client";

import type { LedgerAggregateRow } from "@/data/reports/ledger";
import { formatAmount, cn } from "@/lib/utils";
import { useSheetResize } from "@/lib/use-sheet-resize";
import { Button } from "@/ui/button";
import { EmptyState } from "@/ui/empty-state";
import {
  SheetScroll,
  SheetTable,
  SheetHead,
  SheetHeadCell,
  SheetCorner,
  SheetRowNum,
  SheetCell,
  SheetColResizer,
  SheetRowResizer,
} from "@/ui/sheet";

/** 各欄預設寬度（月／季／年共用同一組欄位）。 */
const DEFAULT_WIDTHS: Record<string, number> = {
  period: 180,
  income: 140,
  expense: 140,
  net: 140,
};
const COL_ORDER = ["period", "income", "expense", "net"] as const;
const ROWNUM_W = 48;
const DEFAULT_ROW_HEIGHT = 36;

export function AggregateTable({ rows }: { rows: LedgerAggregateRow[] }) {
  const {
    widths,
    totalWidth,
    getRowHeight,
    startColResize,
    startRowResize,
    reset: resetSizes,
  } = useSheetResize({
    storageKey: "sheet-size:aggregate",
    defaultWidths: DEFAULT_WIDTHS,
    defaultRowHeight: DEFAULT_ROW_HEIGHT,
  });

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
    <div className="space-y-2">
      <div className="flex justify-end">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={resetSizes}
        >
          重設欄列大小
        </Button>
      </div>
      <SheetScroll>
        <SheetTable
          style={{ width: ROWNUM_W + totalWidth, tableLayout: "fixed" }}
        >
          <colgroup>
            <col style={{ width: ROWNUM_W }} />
            {COL_ORDER.map((id) => (
              <col key={id} style={{ width: widths[id] ?? DEFAULT_WIDTHS[id] }} />
            ))}
          </colgroup>
          <SheetHead>
            <tr>
              <SheetCorner>#</SheetCorner>
              {(
                [
                  ["period", "期間"],
                  ["income", "收入"],
                  ["expense", "支出"],
                  ["net", "淨額"],
                ] as const
              ).map(([id, label]) => (
                <SheetHeadCell key={id}>
                  {label}
                  <SheetColResizer
                    onPointerDown={(e) => startColResize(id, e)}
                  />
                </SheetHeadCell>
              ))}
            </tr>
          </SheetHead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.key} style={{ height: getRowHeight(r.key) }}>
                <SheetRowNum>
                  {i + 1}
                  <SheetRowResizer
                    onPointerDown={(e) => startRowResize(r.key, e)}
                  />
                </SheetRowNum>
                <SheetCell className="font-medium text-slate-900">
                  <span className="block truncate">{r.label}</span>
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
    </div>
  );
}
