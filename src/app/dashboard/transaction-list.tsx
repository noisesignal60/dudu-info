import type { TransactionDTO } from "@/data/transactions";
import { formatCurrency, formatDateTime } from "@/lib/utils";

const KIND_LABEL: Record<TransactionDTO["kind"], string> = {
  commission: "分潤",
  reward: "獎勵",
  withdrawal: "提領",
  adjust: "調整",
};

export function TransactionList({ items }: { items: TransactionDTO[] }) {
  if (items.length === 0) {
    return (
      <div className="py-8 text-center text-slate-500">
        <p className="font-medium">目前沒有交易紀錄</p>
        <p className="text-sm mt-1">當您有交易時，紀錄將顯示在這裡</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-slate-100">
      {items.map((t) => {
        const positive = t.amount >= 0;
        return (
          <li
            key={t.id}
            className="py-3 flex items-start justify-between gap-3"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                  {KIND_LABEL[t.kind]}
                </span>
                <p className="font-semibold text-slate-900 truncate">
                  {t.title}
                </p>
              </div>
              {t.description && (
                <p className="text-sm text-slate-500 mt-0.5 truncate">
                  {t.description}
                </p>
              )}
              <p className="text-xs text-slate-400 mt-1">
                {formatDateTime(t.createdAt)}
              </p>
            </div>
            <div
              className={`shrink-0 text-lg font-bold ${
                positive ? "text-positive" : "text-money"
              }`}
            >
              {positive ? "+" : ""}
              {formatCurrency(t.amount)}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
