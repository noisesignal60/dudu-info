import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * 全站提示框。吸收原本各表單散落的 bg-red-50/border-red-200、amber 提示、brand-soft 訊息。
 * 表單錯誤訊息（送出失敗）用 variant="danger"；成功回饋優先改用 Toast（sonner）。
 */
const alertVariants = cva(
  "flex gap-3 rounded-xl border p-4 text-sm [&_svg]:size-5 [&_svg]:shrink-0 [&_svg]:mt-0.5",
  {
    variants: {
      variant: {
        info: "bg-brand-soft border-brand/30 text-brand-dark",
        success: "bg-green-50 border-green-200 text-green-800",
        warning: "bg-amber-50 border-amber-200 text-amber-800",
        danger: "bg-red-50 border-red-200 text-red-700",
        neutral: "bg-slate-50 border-slate-200 text-slate-700",
      },
    },
    defaultVariants: { variant: "info" },
  }
);

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant, className }))}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p data-slot="alert-title" className={cn("font-semibold", className)} {...props} />
  );
}

function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn("text-sm/relaxed [&:not(:first-child)]:mt-1", className)}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription };
