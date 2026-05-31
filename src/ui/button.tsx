import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * 全站唯一按鈕元件。以宣告式 size 取代過去的 `btn-* !min-h-10` 覆蓋。
 * 會員端主要操作用 size="touch"（48px 觸控目標），後台密集區用 size="sm"。
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold " +
    "transition-[color,background-color,box-shadow,transform] outline-none " +
    "focus-visible:ring-4 focus-visible:ring-ring/25 active:scale-[.98] " +
    "disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 " +
    "[&_svg]:shrink-0 [&_svg]:pointer-events-none",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground hover:bg-brand-dark",
        secondary:
          "bg-surface text-ink border border-input hover:bg-canvas",
        danger:
          "bg-destructive text-destructive-foreground hover:brightness-95",
        ghost: "text-ink hover:bg-secondary",
        link: "text-accent-blue underline-offset-4 hover:underline hover:text-accent-blue-dark",
      },
      size: {
        touch: "min-h-12 px-6 text-lg [&_svg]:size-5",
        default: "min-h-11 px-5 text-base [&_svg]:size-4",
        sm: "min-h-9 px-3 text-sm [&_svg]:size-4",
        icon: "size-11 [&_svg]:size-5",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
