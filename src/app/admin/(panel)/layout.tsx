import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/admin-session";
import { AdminSidebar } from "../_components/admin-sidebar";
import { AdminTopbar } from "../_components/admin-topbar";

export const metadata = {
  title: "後台管理 ｜ 嘟嘟資訊網",
};

export default function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-svh bg-slate-100">
      <div className="flex">
        <Suspense fallback={<SidebarSkeleton />}>
          <AdminSidebar />
        </Suspense>
        <div className="flex-1 min-w-0">
          <Suspense
            fallback={<div className="h-16 bg-white border-b border-slate-200" />}
          >
            <Topbar />
          </Suspense>
          <main className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

async function Topbar() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return <AdminTopbar admin={admin} />;
}

function SidebarSkeleton() {
  return <div className="hidden md:block w-64 h-svh bg-slate-900 shrink-0" />;
}
