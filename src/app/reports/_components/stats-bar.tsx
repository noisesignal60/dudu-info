import { formatCurrency } from "@/lib/utils";

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
      <Card label="總收入" value={income} tone="positive" />
      <Card label="總支出" value={expense} tone="negative" />
      <Card
        label="淨額"
        value={net}
        tone={net >= 0 ? "positive" : "negative"}
        emphasize
      />
    </div>
  );
}

function Card({
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
    <div
      className={`rounded-2xl border p-4 ${
        emphasize ? bg : "bg-white border-slate-200"
      }`}
    >
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p
        className={`mt-1 text-2xl md:text-3xl font-black tabular-nums ${color}`}
      >
        {value >= 0 ? "" : "-"}
        {formatCurrency(Math.abs(value))}
      </p>
    </div>
  );
}
