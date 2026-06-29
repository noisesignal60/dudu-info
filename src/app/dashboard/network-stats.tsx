import Link from "next/link";
import { ChevronRight } from "lucide-react";

/**
 * Dashboard 人數對帳列：推薦人數／網絡人數各為連結，
 * 點擊跳轉到對應頁面查看下線名單。
 */
export function NetworkStats({
  referralCount,
  networkCount,
}: {
  referralCount: number;
  networkCount: number;
}) {
  return (
    <div className="rounded-card border border-hairline bg-surface flex flex-col divide-y sm:flex-row sm:divide-y-0 sm:divide-x divide-hairline">
      <StatCellLink
        href="/dashboard/referrals"
        label="我的推薦人數"
        count={referralCount}
      />
      <StatCellLink
        href="/dashboard/network"
        label="我的網絡人數"
        count={networkCount}
      />
    </div>
  );
}

function StatCellLink({
  href,
  label,
  count,
}: {
  href: string;
  label: string;
  count: number;
}) {
  return (
    <Link
      href={href}
      className="flex-1 px-4 py-3 flex items-center justify-between gap-2 transition-colors hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/25"
    >
      <span className="eyebrow text-slate-500">{label}</span>
      <span className="fig text-lg text-ink inline-flex items-center">
        {count}
        <span className="ml-1 text-sm font-medium text-slate-400">人</span>
        <ChevronRight className="ml-1 size-4 text-slate-300" />
      </span>
    </Link>
  );
}
