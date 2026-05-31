import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

function Spinner({ className }: { className?: string }) {
  return (
    <Loader2
      role="status"
      aria-label="載入中"
      className={cn("size-5 animate-spin text-slate-400", className)}
    />
  );
}

export { Spinner };
