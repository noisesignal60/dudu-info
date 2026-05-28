import { cn, formatCurrency } from "@/lib/utils";
import type { ReactNode } from "react";

type Variant = "default" | "highlight";

export function StatCard({
  label,
  value,
  unit,
  icon,
  variant = "default",
  isMoney = true,
}: {
  label: string;
  value: number;
  unit?: string;
  icon?: ReactNode;
  variant?: Variant;
  isMoney?: boolean;
}) {
  const display = isMoney ? formatCurrency(value) : `${value} ${unit ?? ""}`.trim();

  return (
    <div
      className={cn(
        "rounded-2xl p-5 shadow-sm border",
        variant === "highlight"
          ? "bg-brand text-white border-brand"
          : "bg-white border-slate-200",
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "text-base font-medium",
            variant === "highlight" ? "text-white/90" : "text-slate-600",
          )}
        >
          {label}
        </span>
        {icon && (
          <span
            className={cn(
              variant === "highlight" ? "text-white/80" : "text-brand",
            )}
          >
            {icon}
          </span>
        )}
      </div>
      <div
        className={cn(
          "mt-3 font-black tracking-tight",
          variant === "highlight" ? "text-4xl" : "text-3xl",
        )}
      >
        {display}
      </div>
    </div>
  );
}
