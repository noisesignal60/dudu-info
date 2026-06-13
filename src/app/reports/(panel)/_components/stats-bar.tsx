import { formatAmount, cn } from "@/lib/utils";
import { Card } from "@/ui/card";
import { FitText } from "./fit-text";

export function LedgerStatsBar({
  income,
  expense,
}: {
  income: number;
  expense: number;
}) {
  const net = income - expense;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
      ? "bg-blue-50 border-blue-200"
      : "bg-red-50 border-red-200";
  return (
    <Card className={cn("p-4 min-w-0", emphasize && bg)}>
      <p className="eyebrow text-slate-500 text-center">{label}</p>
      <FitText
        className="mt-1.5"
        textClassName={cn("fig font-black text-xl leading-none", color)}
      >
        {formatAmount(tone === "negative" ? -Math.abs(value) : value)}
      </FitText>
    </Card>
  );
}
