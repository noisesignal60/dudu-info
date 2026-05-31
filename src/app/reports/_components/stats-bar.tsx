import { formatCurrency, cn } from "@/lib/utils";
import { Card } from "@/ui/card";

export function LedgerStatsBar({
  income,
  expense,
}: {
  income: number;
  expense: number;
}) {
  const net = income - expense;
  return (
    <div className="grid grid-cols-3 gap-3">
      <StatCard label="總收入" value={income} tone="positive" />
      <StatCard label="總支出" value={expense} tone="negative" />
      <StatCard
        label="淨額"
        value={net}
        tone={net >= 0 ? "positive" : "negative"}
        emphasize
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
  emphasize,
}: {
  label: string;
  value: number;
  tone: "positive" | "negative";
  emphasize?: boolean;
}) {
  const color = tone === "positive" ? "text-positive" : "text-money";
  const bg =
    tone === "positive"
      ? "bg-green-50 border-green-200"
      : "bg-red-50 border-red-200";
  return (
    <Card className={cn("p-4", emphasize && bg)}>
      <p className="eyebrow text-slate-500">{label}</p>
      <p className={cn("fig font-black mt-1.5 text-xl leading-none", color)}>
        {value >= 0 ? "" : "-"}
        {formatCurrency(Math.abs(value))}
      </p>
    </Card>
  );
}
