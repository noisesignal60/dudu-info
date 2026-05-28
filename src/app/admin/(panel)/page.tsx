import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/admin-session";
import { getAdminStats, getRecentActivity } from "@/data/admin/stats";
import { Users, Wallet, TrendingUp, AlertCircle } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export const metadata = {
  title: "儀表板 ｜ 後台",
};

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<HeaderSkeleton />}>
        <WelcomeBlock />
      </Suspense>

      <Suspense fallback={<StatsSkeleton />}>
        <StatsGrid />
      </Suspense>

      <Suspense fallback={<div className="h-64 bg-slate-200 rounded-2xl animate-pulse" />}>
        <RecentActivity />
      </Suspense>
    </div>
  );
}

async function WelcomeBlock() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return (
    <div>
      <h1 className="text-2xl font-black text-slate-900">儀表板</h1>
      <p className="text-slate-500 mt-1">
        歡迎回來，{admin.displayName ?? admin.username}
      </p>
    </div>
  );
}

function HeaderSkeleton() {
  return (
    <div className="space-y-2">
      <div className="h-7 w-28 bg-slate-200 rounded animate-pulse" />
      <div className="h-4 w-40 bg-slate-200 rounded animate-pulse" />
    </div>
  );
}

async function StatsGrid() {
  const stats = await getAdminStats();
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <AdminStatCard
        label="總會員數"
        value={`${stats.totalMembers.toLocaleString("zh-TW")} 人`}
        icon={<Users className="w-6 h-6" />}
        tone="default"
      />
      <AdminStatCard
        label="總交易金額"
        value={formatCurrency(stats.totalTransactionAmount)}
        icon={<Wallet className="w-6 h-6" />}
        tone="default"
      />
      <AdminStatCard
        label="總分潤金額"
        value={formatCurrency(stats.totalCommissionAmount)}
        icon={<TrendingUp className="w-6 h-6" />}
        tone="default"
      />
      <AdminStatCard
        label="待審核項目"
        value={`${stats.pendingApprovalCount} 筆`}
        icon={<AlertCircle className="w-6 h-6" />}
        tone={stats.pendingApprovalCount > 0 ? "alert" : "default"}
      />
    </div>
  );
}

function AdminStatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: "default" | "alert";
}) {
  return (
    <div
      className={`rounded-2xl p-5 border shadow-sm ${
        tone === "alert"
          ? "bg-red-50 border-red-200"
          : "bg-white border-slate-200"
      }`}
    >
      <div className="flex items-center justify-between">
        <span
          className={`text-sm font-medium ${
            tone === "alert" ? "text-red-700" : "text-slate-600"
          }`}
        >
          {label}
        </span>
        <span
          className={tone === "alert" ? "text-red-600" : "text-brand"}
          aria-hidden
        >
          {icon}
        </span>
      </div>
      <p
        className={`mt-3 text-3xl font-black ${
          tone === "alert" ? "text-red-700" : "text-slate-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-28 bg-slate-200 rounded-2xl animate-pulse" />
      ))}
    </div>
  );
}

async function RecentActivity() {
  const items = await getRecentActivity(10);
  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <header className="px-5 py-4 border-b border-slate-100">
        <h2 className="text-lg font-bold text-slate-900">最近活動</h2>
      </header>
      {items.length === 0 ? (
        <div className="py-12 text-center text-slate-500">尚無活動紀錄</div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between gap-3 px-5 py-3"
            >
              <div className="min-w-0">
                <p className="font-medium text-slate-900 truncate">{a.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {a.memberName ?? "—"} ・ {formatDateTime(a.createdAt)}
                </p>
              </div>
              <span
                className={`font-bold ${
                  a.amount >= 0 ? "text-positive" : "text-money"
                }`}
              >
                {a.amount >= 0 ? "+" : ""}
                {formatCurrency(a.amount)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
