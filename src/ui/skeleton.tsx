import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * 載入骨架。沿用既有 Suspense fallback 的高度（h-44 / h-72 …）以避免 layout shift。
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-card bg-slate-200/70", className)}
      {...props}
    />
  );
}

export { Skeleton };
