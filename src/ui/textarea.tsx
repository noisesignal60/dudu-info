import * as React from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex w-full min-h-24 rounded-xl border border-input bg-surface px-4 py-3 text-base text-ink " +
          "placeholder:text-slate-400 outline-none transition-[color,box-shadow] " +
          "focus-visible:border-brand focus-visible:ring-4 focus-visible:ring-ring/25 " +
          "disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-money aria-invalid:ring-money/20",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
