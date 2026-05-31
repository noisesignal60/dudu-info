import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const inputVariants = cva(
  "flex w-full rounded-xl border border-input bg-surface text-ink placeholder:text-slate-400 " +
    "outline-none transition-[color,box-shadow] " +
    "focus-visible:border-accent-blue focus-visible:ring-4 focus-visible:ring-ring/25 " +
    "disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-money aria-invalid:ring-money/20 " +
    "file:border-0 file:bg-transparent file:font-medium file:text-ink",
  {
    variants: {
      inputSize: {
        touch: "min-h-12 px-4 text-base",
        default: "min-h-11 px-4 text-base",
        sm: "min-h-10 px-3 text-sm",
      },
    },
    defaultVariants: { inputSize: "default" },
  }
);

function Input({
  className,
  type,
  inputSize,
  ...props
}: React.ComponentProps<"input"> & VariantProps<typeof inputVariants>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(inputVariants({ inputSize, className }))}
      {...props}
    />
  );
}

export { Input, inputVariants };
