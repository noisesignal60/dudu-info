"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/reports", label: "收支總表" },
  { href: "/reports/new", label: "新增日報表" },
  { href: "/reports/daily", label: "日報表" },
  { href: "/reports/monthly", label: "月報表" },
  { href: "/reports/quarterly", label: "季報表" },
  { href: "/reports/yearly", label: "年報表" },
];

export function ReportsTabNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto -mx-1 px-1 border-b border-hairline">
      {TABS.map((t) => {
        const active =
          t.href === "/reports"
            ? pathname === "/reports"
            : pathname === t.href || pathname.startsWith(t.href + "/");
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "px-4 py-2.5 -mb-px border-b-2 border-transparent whitespace-nowrap text-sm transition-colors",
              active
                ? "border-accent-blue text-accent-blue font-semibold"
                : "text-slate-500 font-medium hover:text-ink",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
