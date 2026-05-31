import type { TransactionDTO } from "@/data/transactions";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Badge } from "@/ui/badge";
import { Card } from "@/ui/card";
import { EmptyState } from "@/ui/empty-state";

const KIND_LABEL: Record<TransactionDTO["kind"], string> = {
  commission: "分潤",
  reward: "獎勵",
  withdrawal: "提領",
  adjust: "調整",
};

export function TransactionList({ items }: { items: TransactionDTO[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="目前沒有交易紀錄"
        description="當您有交易時，紀錄將顯示在這裡"
      />
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((t) => {
        const positive = t.amount >= 0;
        return (
          <li key={t.id}>
            <Card className="px-4 py-3.5 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Badge variant={t.kind} size="sm">
                  {KIND_LABEL[t.kind]}
                </Badge>
                <p className="font-semibold text-slate-900 truncate">
                  {t.title}
                </p>
              </div>
              {t.description && (
                <p className="text-sm text-slate-500 mt-1 truncate">
                  {t.description}
                </p>
              )}
              <p className="text-xs text-slate-400 mt-1.5">
                {formatDateTime(t.createdAt)}
              </p>
            </div>
            <div
              className={`fig shrink-0 text-lg ${
                positive ? "text-positive" : "text-money"
              }`}
            >
              {positive ? "+" : ""}
              {formatCurrency(t.amount)}
            </div>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
