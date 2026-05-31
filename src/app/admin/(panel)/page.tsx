import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/admin-session";
import { getAdminStats, getRecentActivity } from "@/data/admin/stats";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/ui/card";
import { EmptyState } from "@/ui/empty-state";
import { Skeleton } from "@/ui/skeleton";

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

      <Suspense fallback={<Skeleton className="h-64 rounded-card" />}>
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
      <h1 className="font-serif text-2xl font-black text-slate-900">儀表板</h1>
      <p className="text-slate-500 mt-1">
        歡迎回來，{admin.displayName ?? admin.username}
      </p>
    </div>
  );
}

function HeaderSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-7 w-28 rounded" />
      <Skeleton className="h-4 w-40 rounded" />
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
        tone="default"
      />
      <AdminStatCard
        label="總交易金額"
        value={formatCurrency(stats.totalTransactionAmount)}
        tone="default"
      />
      <AdminStatCard
        label="總分潤金額"
        value={formatCurrency(stats.totalCommissionAmount)}
        tone="accent"
      />
      <AdminStatCard
        label="待審核項目"
        value={`${stats.pendingApprovalCount} 筆`}
        tone={stats.pendingApprovalCount > 0 ? "alert" : "default"}
      />
    </div>
  );
}

function AdminStatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "default" | "alert" | "accent";
}) {
  return (
    <Card
      className={`p-4 ${
        tone === "alert" ? "bg-red-50 border-red-200" : ""
      }`}
    >
      <span className={`eyebrow block ${tone === "alert" ? "text-red-700" : "text-slate-500"}`}>
        {label}
      </span>
      <p
        className={`fig font-black mt-1.5 text-xl leading-none ${
          tone === "alert"
            ? "text-red-700"
            : tone === "accent"
              ? "text-accent-blue"
              : "text-ink"
        }`}
      >
        {value}
      </p>
    </Card>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-20 rounded-card" />
      ))}
    </div>
  );
}

async function RecentActivity() {
  const items = await getRecentActivity(10);
  return (
    <Card>
      <CardHeader>
        <CardTitle>最近活動</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <EmptyState title="尚無活動紀錄" />
        ) : (
          <ul className="divide-y divide-hairline">
            {items.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="font-medium text-slate-900 truncate">{a.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {a.memberName ?? "—"} ・ {formatDateTime(a.createdAt)}
                  </p>
                </div>
                <span
                  className={`fig ${
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
      </CardContent>
    </Card>
  );
}
