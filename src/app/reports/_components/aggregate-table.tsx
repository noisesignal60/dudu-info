import type { LedgerAggregateRow } from "@/data/reports/ledger";
import { formatCurrency, cn } from "@/lib/utils";
import { EmptyState } from "@/ui/empty-state";
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
} from "@/ui/table";

export function AggregateTable({ rows }: { rows: LedgerAggregateRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="bg-surface border border-hairline rounded-card">
        <EmptyState title="無資料" />
      </div>
    );
  }

  return (
    <div className="rounded-card border border-hairline overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>期間</TableHead>
            <TableHead className="text-right">收入</TableHead>
            <TableHead className="text-right">支出</TableHead>
            <TableHead className="text-right">淨額</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.key}>
              <TableCell className="font-medium text-slate-900">
                {r.label}
              </TableCell>
              <TableCell className="text-right font-bold text-positive tabular-nums">
                {formatCurrency(r.income)}
              </TableCell>
              <TableCell className="text-right font-bold text-money tabular-nums">
                {formatCurrency(r.expense)}
              </TableCell>
              <TableCell
                className={cn(
                  "text-right font-black tabular-nums",
                  r.net >= 0 ? "text-positive" : "text-money",
                )}
              >
                {r.net >= 0 ? "" : "-"}
                {formatCurrency(Math.abs(r.net))}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell className="font-bold text-slate-900">合計</TableCell>
            <TableCell className="text-right font-bold text-positive tabular-nums">
              {formatCurrency(rows.reduce((s, r) => s + r.income, 0))}
            </TableCell>
            <TableCell className="text-right font-bold text-money tabular-nums">
              {formatCurrency(rows.reduce((s, r) => s + r.expense, 0))}
            </TableCell>
            <TableCell className="text-right font-bold tabular-nums">
              {formatCurrency(rows.reduce((s, r) => s + r.net, 0))}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
