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
    <nav className="flex gap-1 overflow-x-auto -mx-1 px-1">
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
              "px-4 py-2 rounded-t-xl font-medium whitespace-nowrap text-sm",
              active
                ? "bg-slate-100 text-slate-900 border-b-2 border-brand"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
