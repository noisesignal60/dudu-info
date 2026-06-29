import Link from "next/link";
import { ChevronLeft } from "lucide-react";

/** 子頁返回連結（回 dashboard） */
export function BackLink({
  href = "/dashboard",
  label = "返回",
}: {
  href?: string;
  label?: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-slate-500 font-medium transition-colors hover:text-ink"
    >
      <ChevronLeft className="size-5" />
      {label}
    </Link>
  );
}
