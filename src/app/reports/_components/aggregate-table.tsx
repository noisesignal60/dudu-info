import type { LedgerAggregateRow } from "@/data/reports/ledger";
import { formatCurrency, cn } from "@/lib/utils";

export function AggregateTable({ rows }: { rows: LedgerAggregateRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl py-16 text-center text-slate-500">
        無資料
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr className="text-left">
              <th className="px-3 py-3 text-xs font-bold uppercase">期間</th>
              <th className="px-3 py-3 text-xs font-bold uppercase text-right">
                收入
              </th>
              <th className="px-3 py-3 text-xs font-bold uppercase text-right">
                支出
              </th>
              <th className="px-3 py-3 text-xs font-bold uppercase text-right">
                淨額
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r, i) => (
              <tr
                key={r.key}
                className={cn(
                  "hover:bg-slate-50",
                  i % 2 === 1 && "bg-slate-50/50",
                )}
              >
                <td className="px-3 py-3 font-medium text-slate-900">
                  {r.label}
                </td>
                <td className="px-3 py-3 text-right font-bold text-positive tabular-nums">
                  {formatCurrency(r.income)}
                </td>
                <td className="px-3 py-3 text-right font-bold text-money tabular-nums">
                  {formatCurrency(r.expense)}
                </td>
                <td
                  className={cn(
                    "px-3 py-3 text-right font-black tabular-nums",
                    r.net >= 0 ? "text-positive" : "text-money",
                  )}
                >
                  {r.net >= 0 ? "" : "-"}
                  {formatCurrency(Math.abs(r.net))}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-100 font-bold">
              <td className="px-3 py-3 text-slate-900">合計</td>
              <td className="px-3 py-3 text-right text-positive tabular-nums">
                {formatCurrency(rows.reduce((s, r) => s + r.income, 0))}
              </td>
              <td className="px-3 py-3 text-right text-money tabular-nums">
                {formatCurrency(rows.reduce((s, r) => s + r.expense, 0))}
              </td>
              <td className="px-3 py-3 text-right tabular-nums">
                {formatCurrency(rows.reduce((s, r) => s + r.net, 0))}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
