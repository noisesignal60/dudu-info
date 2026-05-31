import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/admin-session";
import { countWithdrawalsByStatus } from "@/data/admin/withdrawals";
import { AdminTopNav } from "../_components/admin-topnav";

export const metadata = {
  title: "後台管理 ｜ 嘟嘟資訊網",
};

export default function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-svh bg-background overflow-x-clip">
      <Suspense fallback={<div className="h-16 bg-primary" />}>
        <NavBlock />
      </Suspense>
      <main className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
        {children}
      </main>
    </div>
  );
}

async function NavBlock() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  const counts = await countWithdrawalsByStatus();
  return <AdminTopNav admin={admin} pendingWithdrawals={counts.pending} />;
}
