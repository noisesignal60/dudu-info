import { cn, formatCurrency } from "@/lib/utils";

type Variant = "default" | "highlight" | "accent";

export function StatCard({
  label,
  value,
  unit,
  variant = "default",
  isMoney = true,
}: {
  label: string;
  value: number;
  unit?: string;
  variant?: Variant;
  isMoney?: boolean;
}) {
  const display = isMoney ? formatCurrency(value) : `${value} ${unit ?? ""}`.trim();

  return (
    <div
      className={cn(
        "rounded-card p-4 border",
        // accent 不填色（克制）：僅關鍵數字轉深藍；highlight 維持石板灰填色。
        variant === "highlight"
          ? "bg-brand text-white border-brand"
          : "bg-surface border-hairline",
      )}
    >
      <span
        className={cn(
          "eyebrow block",
          variant === "highlight" ? "text-white/80" : "text-slate-500",
        )}
      >
        {label}
      </span>
      <div
        className={cn(
          "fig font-black mt-1.5 leading-none",
          variant === "highlight"
            ? "text-2xl text-white"
            : variant === "accent"
              ? "text-xl text-accent-blue"
              : "text-xl text-ink",
        )}
      >
        {display}
      </div>
    </div>
  );
}
