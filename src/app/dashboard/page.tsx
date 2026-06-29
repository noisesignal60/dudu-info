import { Suspense } from "react";
import { getDashboardStats } from "@/data/stats";
import { getActiveAnnouncements } from "@/data/announcements";
import { getCurrentMember } from "@/data/member";
import { getMyTransactions } from "@/data/transactions";
import { getMyWithdrawals } from "@/data/withdrawals";
import { StatCard } from "@/ui/stat-card";
import { SectionCard } from "@/ui/section-card";
import { CopyButton } from "@/ui/copy-button";
import { ShareLineButton } from "@/ui/share-line-button";
import { WithdrawalForm } from "./withdrawal-form";
import { ProfileBlock } from "./profile-block";
import { TransactionList } from "./transaction-list";
import { WithdrawalStatusBadge } from "./withdrawal-badge";
import { NetworkStats } from "./network-stats";
import { Skeleton } from "@/ui/skeleton";
import { EmptyState } from "@/ui/empty-state";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export const metadata = {
  title: "分潤系統 ｜ 嘟嘟資訊網",
};

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* 歡迎 — 含使用者名稱，動態，需 Suspense */}
      <Suspense fallback={<WelcomeSkeleton />}>
        <WelcomeBlock />
      </Suspense>

      <Suspense fallback={<StatsSkeleton />}>
        <StatsGrid />
      </Suspense>

      <Suspense fallback={<SkeletonBox h="h-32" />}>
        <AnnouncementBlock />
      </Suspense>

      <Suspense fallback={<SkeletonBox h="h-44" />}>
        <ReferralBlock />
      </Suspense>

      <Suspense fallback={<SkeletonBox h="h-72" />}>
        <WithdrawalBlock />
      </Suspense>

      <Suspense fallback={<SkeletonBox h="h-72" />}>
        <ProfileSection />
      </Suspense>

      <Suspense fallback={<SkeletonBox h="h-60" />}>
        <TransactionSection />
      </Suspense>

      <Suspense fallback={<SkeletonBox h="h-60" />}>
        <WithdrawalHistorySection />
      </Suspense>
    </div>
  );
}

async function WelcomeBlock() {
  const me = await getCurrentMember();
  const name = me?.name || me?.lineDisplay || "司機";
  return (
    <section className="px-1">
      <h2 className="text-2xl font-black text-ink font-serif tracking-tight">
        歡迎回來，{name}！
      </h2>
      <p className="text-slate-500 mt-1">查看您的收益與推薦狀況</p>
    </section>
  );
}

function WelcomeSkeleton() {
  return (
    <section className="px-1 space-y-2">
      <Skeleton className="h-8 w-60 rounded" />
      <Skeleton className="h-4 w-40 rounded" />
    </section>
  );
}

async function StatsGrid() {
  const stats = await getDashboardStats();
  if (!stats) return null;
  return (
    <div className="space-y-3">
      {/* Hero：待領取金額（最重要、可立即提領）— 深藍焦點 */}
      <div className="rounded-card border border-accent-blue/20 bg-accent-blue-soft p-4">
        <p className="eyebrow text-accent-blue/70">待領取金額</p>
        <p className="fig font-black text-accent-blue text-2xl leading-none mt-1">
          {formatCurrency(stats.pendingAmount)}
        </p>
      </div>

      {/* 其餘金額 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard label="總金額" value={stats.totalAmount} />
        <StatCard label="已領取金額" value={stats.withdrawnAmount} />
        <StatCard label="審核中金額" value={stats.lockedAmount} />
      </div>

      {/* 人數：次要對帳列（可點開看下線名單） */}
      <NetworkStats
        referralCount={stats.referralCount}
        networkCount={stats.networkCount}
      />
    </div>
  );
}

async function AnnouncementBlock() {
  const items = await getActiveAnnouncements();
  if (items.length === 0) return null;
  return (
    <SectionCard title="公告欄">
      <ul className="space-y-4">
        {items.map((a) => (
          <li
            key={a.id}
            className="rounded-card border border-hairline bg-canvas p-4"
          >
            <p className="font-bold text-ink">{a.title}</p>
            <p className="mt-1 text-slate-600 whitespace-pre-wrap break-words leading-relaxed">
              {a.content}
            </p>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

async function ReferralBlock() {
  const me = await getCurrentMember();
  if (!me?.referralCode) return null;
  const shareText = `我在使用嘟嘟資訊網！加入請使用我的推薦碼：${me.referralCode}`;

  return (
    <SectionCard
      title="我的推薦碼"
      subtitle="分享您的推薦碼，邀請朋友加入並獲得獎勵！"
    >
      <div className="rounded-card bg-brand-soft border border-brand/30 p-4 text-center">
        <p className="eyebrow text-slate-500">推薦碼</p>
        <p className="text-2xl font-black tracking-widest text-accent-blue mt-2 tabular-nums">
          {me.referralCode}
        </p>
      </div>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <CopyButton text={me.referralCode} label="複製推薦碼" />
        <ShareLineButton text={shareText} />
      </div>
    </SectionCard>
  );
}

async function WithdrawalBlock() {
  const stats = await getDashboardStats();
  if (!stats) return null;
  return (
    <SectionCard
      title="申請提領"
      subtitle={`可提領金額：${formatCurrency(stats.pendingAmount)}`}
    >
      <WithdrawalForm available={stats.pendingAmount} />
      <ul className="mt-4 text-sm text-slate-600 leading-7 list-disc pl-5">
        <li>提領申請將在 1–3 個工作日內處理</li>
        <li>最低提領金額為 $100</li>
        <li>款項將匯入您註冊時填寫的銀行帳戶</li>
      </ul>
    </SectionCard>
  );
}

async function ProfileSection() {
  const me = await getCurrentMember();
  if (!me) return null;
  return (
    <SectionCard title="個人資料">
      <ProfileBlock member={me} />
    </SectionCard>
  );
}

async function TransactionSection() {
  const txs = await getMyTransactions(10);
  return (
    <SectionCard title="交易紀錄" subtitle="最近 10 筆">
      <TransactionList items={txs} />
    </SectionCard>
  );
}

async function WithdrawalHistorySection() {
  const list = await getMyWithdrawals(10);
  if (list.length === 0) {
    return (
      <SectionCard title="我的提領申請">
        <EmptyState title="目前沒有提領申請" />
      </SectionCard>
    );
  }
  return (
    <SectionCard title="我的提領申請" subtitle="最近 10 筆">
      <ul className="divide-y divide-hairline">
        {list.map((w) => (
          <li key={w.id} className="py-3 flex items-center justify-between gap-3">
            <div>
              <p className="fig text-lg">{formatCurrency(w.amount)}</p>
              <p className="text-xs text-slate-500">
                {formatDateTime(w.createdAt)}
              </p>
            </div>
            <WithdrawalStatusBadge status={w.status} />
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

function SkeletonBox({ h }: { h: string }) {
  return <Skeleton className={`${h} rounded-card`} />;
}

function StatsSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-20 rounded-card" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-card" />
        ))}
      </div>
      <Skeleton className="h-12 rounded-card" />
    </div>
  );
}
