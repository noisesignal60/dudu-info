"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/reports", label: "收支總表" },
  { href: "/reports/new", label: "新增日報表" },
  { href: "/reports/daily", label: "日報表" },
  { href: "/reports/monthly", label: "月報表" },
  { href: "/reports/quarterly", label: "季報表" },
  { href: "/reports/yearly", label: "年報表" },
];

function isActive(pathname: string, href: string) {
  return href === "/reports"
    ? pathname === "/reports"
    : pathname === href || pathname.startsWith(href + "/");
}

/** 桌機水平分頁列（手機隱藏） */
export function ReportsTabNav() {
  const pathname = usePathname();
  return (
    <nav className="hidden md:flex gap-1 overflow-x-auto overflow-y-hidden -mx-1 px-1 border-b border-hairline">
      {TABS.map((t) => {
        const active = isActive(pathname, t.href);
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

/**
 * 手機漢堡選單（桌機隱藏）。遮罩與面板皆用 absolute top-full（相對 sticky header），
 * 避免 fixed + sticky 的 z-index 堆疊陷阱，也不需硬編 header 高度。
 */
export function ReportsMobileNav({ adminName }: { adminName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="grid size-10 place-items-center rounded-lg text-ink hover:bg-ink/5 transition-colors"
        aria-label="選單"
        aria-expanded={open}
      >
        {open ? <X className="size-6" /> : <Menu className="size-6" />}
      </button>

      {open && (
        <>
          <div
            className="absolute top-full left-0 right-0 h-screen z-40 bg-ink/40 backdrop-blur-[1px]"
            onClick={() => setOpen(false)}
          />
          <nav className="absolute top-full left-0 right-0 z-50 bg-surface border-b border-hairline shadow-premium-sm px-3 py-3 space-y-1">
            <div className="px-3 pb-2 mb-1 border-b border-hairline leading-none">
              <p className="text-sm font-semibold text-ink">{adminName}</p>
            </div>
            {TABS.map((t) => {
              const active = isActive(pathname, t.href);
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center px-3 py-2.5 rounded-lg font-medium transition-colors",
                    active
                      ? "bg-accent-blue/10 text-accent-blue font-semibold"
                      : "text-slate-600 hover:bg-ink/5",
                  )}
                >
                  {t.label}
                </Link>
              );
            })}
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="flex items-center px-3 py-2.5 mt-1 rounded-lg font-medium text-slate-500 hover:bg-ink/5 transition-colors border-t border-hairline"
            >
              回到後台
            </Link>
          </nav>
        </>
      )}
    </div>
  );
}
