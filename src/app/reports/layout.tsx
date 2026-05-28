import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/admin-session";
import { ChevronLeft } from "lucide-react";
import { ReportsTabNav } from "./_components/tab-nav";

export const metadata = {
  title: "帳簿系統 ｜ 嘟嘟資訊網",
};

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-svh bg-slate-100">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-900 text-white grid place-items-center font-black">
              嘟
            </div>
            <div>
              <p className="text-xs text-slate-500 leading-none">嘟嘟資訊網</p>
              <h1 className="font-bold text-slate-900">帳簿系統</h1>
            </div>
          </div>
          <Suspense fallback={null}>
            <AdminPill />
          </Suspense>
        </div>
        <div className="max-w-[1400px] mx-auto px-4 pb-2">
          <ReportsTabNav />
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 py-5">{children}</main>
    </div>
  );
}

async function AdminPill() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  return (
    <div className="flex items-center gap-3 text-sm">
      <Link
        href="/admin"
        className="inline-flex items-center text-slate-600 hover:text-slate-900"
      >
        <ChevronLeft className="w-4 h-4" />
        回到後台
      </Link>
      <span className="text-slate-500">
        {admin.displayName ?? admin.username}
      </span>
    </div>
  );
}
