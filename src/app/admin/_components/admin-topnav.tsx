"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/ui/button";
import { adminLogoutAction } from "@/actions/admin-auth";
import type { AdminSessionData } from "@/lib/admin-session";

type Item = {
  label: string;
  href: string;
};

const MENU: Item[] = [
  { label: "儀表板", href: "/admin" },
  { label: "會員管理", href: "/admin/members" },
  { label: "管理員管理", href: "/admin/admins" },
  { label: "交易管理", href: "/admin/transactions" },
  { label: "提領申請", href: "/admin/withdrawals" },
  { label: "網絡樹狀圖", href: "/admin/network" },
  { label: "分潤比例", href: "/admin/commission" },
  { label: "報表", href: "/reports" },
];

export function AdminTopNav({ admin }: { admin: AdminSessionData }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  return (
    <header className="sticky top-0 z-30 bg-primary text-primary-foreground shadow-premium-sm">
      <div className="max-w-[1400px] mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* 左：Logo */}
        <Link href="/admin" className="shrink-0 leading-none">
          <p className="eyebrow text-white/60">嘟嘟資訊網</p>
          <p className="font-serif font-bold mt-0.5">後台管理</p>
        </Link>

        {/* 中：桌機水平選單 */}
        <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
          {MENU.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                  active
                    ? "bg-white text-accent-blue font-semibold"
                    : "text-white/85 hover:bg-white/10 hover:text-white"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* 右：admin 資訊（xl）+ 登出（lg）／hamburger（lg 以下） */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden xl:block text-right leading-none">
            <p className="text-sm font-semibold">{admin.displayName}</p>
            <p className="text-xs text-white/70 mt-1">{admin.username}</p>
          </div>
          <form action={adminLogoutAction} className="hidden lg:block">
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10 hover:text-white"
            >
              登出
            </Button>
          </form>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="lg:hidden grid size-10 place-items-center rounded-lg text-white hover:bg-white/10 transition-colors"
            aria-label="選單"
            aria-expanded={open}
          >
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {/* 手機展開面板 */}
      {open && (
        <>
          <div
            className="lg:hidden fixed inset-x-0 bottom-0 top-16 z-40 bg-ink/40 backdrop-blur-[1px]"
            onClick={() => setOpen(false)}
          />
          <nav className="lg:hidden relative z-50 bg-primary border-t border-white/15 px-3 py-3 space-y-1">
            <div className="sm:hidden px-3 pb-2 mb-1 border-b border-white/15 leading-none">
              <p className="text-sm font-semibold">{admin.displayName}</p>
              <p className="text-xs text-white/70 mt-1">{admin.username}</p>
            </div>
            {MENU.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "block px-3 py-2.5 rounded-lg font-medium transition-colors",
                    active
                      ? "bg-white text-accent-blue font-semibold"
                      : "text-white/90 hover:bg-white/10"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
            <form action={adminLogoutAction} className="pt-2">
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="w-full justify-start text-white hover:bg-white/10 hover:text-white"
              >
                登出
              </Button>
            </form>
          </nav>
        </>
      )}
    </header>
  );
}
