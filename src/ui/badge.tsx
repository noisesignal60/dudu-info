import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * 全站徽章。吸收原本散落的 WithdrawalStatusBadge MAP 與交易 KIND_TAG。
 * 金額相關內容請在使用端保留 tabular-nums。
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-sm border font-semibold whitespace-nowrap [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        neutral: "bg-slate-100 text-slate-700 border-slate-200",
        brand: "bg-brand-soft text-brand-dark border-brand/30",
        positive: "bg-green-50 text-positive border-green-200",
        money: "bg-red-50 text-money border-red-200",
        // 提領 / 一般審核狀態
        pending: "bg-amber-100 text-amber-800 border-amber-200",
        approved: "bg-brand-soft text-brand-dark border-brand/30",
        rejected: "bg-red-100 text-red-700 border-red-200",
        // 交易類別
        commission: "bg-blue-50 text-blue-700 border-blue-200",
        reward: "bg-purple-50 text-purple-700 border-purple-200",
        withdrawal: "bg-amber-50 text-amber-700 border-amber-200",
        adjust: "bg-slate-100 text-slate-600 border-slate-200",
      },
      size: {
        sm: "px-2 py-0.5 text-xs [&_svg]:size-3",
        default: "px-3 py-1 text-sm [&_svg]:size-3.5",
      },
    },
    defaultVariants: { variant: "neutral", size: "default" },
  }
);

function Badge({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";
  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
