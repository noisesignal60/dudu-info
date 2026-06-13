import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/admin-session";
import { Button } from "@/ui/button";
import { ReportsTabNav, ReportsMobileNav } from "./_components/tab-nav";

export const metadata = {
  title: "帳簿系統 ｜ 嘟嘟資訊網",
};

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="reports-theme min-h-svh bg-background">
      <header className="bg-surface sticky top-0 z-30 relative">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div>
            <p className="eyebrow leading-none">嘟嘟資訊網</p>
            <h1 className="font-serif font-bold text-ink leading-tight mt-0.5">帳簿系統</h1>
          </div>
          <Suspense fallback={null}>
            <HeaderActions />
          </Suspense>
        </div>
        <div className="max-w-[1400px] mx-auto px-4 pb-2 hidden md:block">
          <ReportsTabNav />
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 py-5">{children}</main>
    </div>
  );
}

async function HeaderActions() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/reports/login");

  const name = admin.displayName ?? admin.username ?? "管理員";

  return (
    <>
      {/* 桌機：回到後台 + 管理員名稱 */}
      <div className="hidden md:flex items-center gap-3 text-sm">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin">回到後台</Link>
        </Button>
        <span className="text-slate-500">{name}</span>
      </div>
      {/* 手機：漢堡選單 */}
      <ReportsMobileNav adminName={name} />
    </>
  );
}
