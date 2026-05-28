"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  ArrowLeftRight,
  Banknote,
  Network,
  Percent,
  FileBarChart2,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Item = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  external?: boolean;
};

const MENU: Item[] = [
  { label: "儀表板", href: "/admin", icon: LayoutDashboard },
  { label: "會員管理", href: "/admin/members", icon: Users },
  { label: "管理員管理", href: "/admin/admins", icon: ShieldCheck },
  { label: "交易管理", href: "/admin/transactions", icon: ArrowLeftRight },
  { label: "提領申請", href: "/admin/withdrawals", icon: Banknote },
  { label: "網絡樹狀圖", href: "/admin/network", icon: Network },
  { label: "分潤比例", href: "/admin/commission", icon: Percent },
  { label: "報表", href: "/reports", icon: FileBarChart2 },
];

export function AdminSidebar() {
  const [open, setOpen] = useState(false);
  return (
    <>
      {/* Mobile hamburger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-3 left-3 z-30 p-3 rounded-xl bg-slate-900 text-white shadow-lg"
        aria-label="開啟選單"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed md:sticky top-0 left-0 z-50 md:z-0 md:flex",
          "w-64 h-svh bg-slate-900 text-slate-100 flex-col shrink-0",
          "transition-transform md:transition-none",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className="px-5 py-5 flex items-center justify-between border-b border-slate-800">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-brand text-white grid place-items-center font-black">
              嘟
            </div>
            <div>
              <p className="text-xs text-slate-400 leading-none">嘟嘟資訊網</p>
              <p className="font-bold text-white">後台管理</p>
            </div>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="md:hidden p-2"
            aria-label="關閉選單"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3">
          <SidebarMenu onItemClick={() => setOpen(false)} />
        </nav>
      </aside>
    </>
  );
}

function SidebarMenu({ onItemClick }: { onItemClick: () => void }) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  return (
    <ul className="space-y-1 px-3">
      {MENU.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onItemClick}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-colors",
                active
                  ? "bg-brand text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white",
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span>{item.label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
