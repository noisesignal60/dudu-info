import { Suspense } from "react";
import Link from "next/link";
import {
  listAdminWithdrawals,
  countWithdrawalsByStatus,
  type WithdrawalStatus,
} from "@/data/admin/withdrawals";
import { getPassbookSignedUrl } from "@/data/admin/members";
import { formatCurrency, formatDateTime, cn } from "@/lib/utils";
import { ReviewButton } from "./review-button";
import { Badge } from "@/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/ui/table";
import { EmptyState } from "@/ui/empty-state";
import { Skeleton } from "@/ui/skeleton";

export const metadata = { title: "提領申請 ｜ 後台" };

type Status = WithdrawalStatus | "all";

type SearchParams = Promise<{ status?: string; page?: string }>;

const TABS: { key: Status; label: string }[] = [
  { key: "pending", label: "待審核" },
  { key: "approved", label: "已通過" },
  { key: "rejected", label: "已拒絕" },
  { key: "all", label: "全部" },
];

export default function AdminWithdrawalsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-black text-ink">提領申請</h1>
        <p className="text-slate-500 mt-1 text-sm">
          審核會員的提領申請；通過後系統會自動更新餘額並寫入交易紀錄
        </p>
      </div>

      <Suspense fallback={<TabsSkeleton />}>
        <Tabs searchParams={searchParams} />
      </Suspense>

      <Suspense fallback={<TableSkeleton />}>
        <Listing searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Tabs({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const active: Status = (TABS.some((t) => t.key === sp.status)
    ? sp.status
    : "pending") as Status;
  const counts = await countWithdrawalsByStatus();

  return (
    <nav className="bg-surface rounded-card border border-hairline shadow-premium-sm p-2 inline-flex gap-1">
      {TABS.map((t) => {
        const n = counts[t.key];
        const isActive = t.key === active;
        return (
          <Link
            key={t.key}
            href={`/admin/withdrawals?status=${t.key}`}
            className={cn(
              "px-4 py-2 rounded-sm font-medium text-sm inline-flex items-center gap-2",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-slate-600 hover:bg-secondary",
            )}
          >
            {t.label}
            <span
              className={cn(
                "min-w-6 h-6 px-1.5 grid place-items-center text-xs font-bold rounded-full",
                isActive
                  ? "bg-white/25 text-white"
                  : t.key === "pending" && n > 0
                    ? "bg-destructive text-white"
                    : "bg-slate-200 text-slate-700",
              )}
            >
              {n}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

async function Listing({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const status = (TABS.some((t) => t.key === sp.status)
    ? sp.status
    : "pending") as Status;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const { rows, total, pageSize } = await listAdminWithdrawals({ status, page });

  if (rows.length === 0) {
    return (
      <div className="rounded-card border border-hairline overflow-hidden">
        <EmptyState title="沒有符合條件的提領申請" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-sm text-slate-600">
        共 <span className="font-bold text-ink">{total}</span> 筆 ・
        本頁 {rows.length}/{pageSize}
      </div>
      <div className="rounded-card border border-hairline overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>申請時間</TableHead>
              <TableHead>用戶</TableHead>
              <TableHead className="text-right">提領金額</TableHead>
              <TableHead>銀行</TableHead>
              <TableHead>帳號</TableHead>
              <TableHead>備註</TableHead>
              <TableHead>狀態</TableHead>
              <TableHead>處理時間</TableHead>
              <TableHead className="text-center">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(async (w) => {
              const signedUrl = w.memberPassbookUrl
                ? await getPassbookSignedUrl(w.memberPassbookUrl)
                : null;
              return (
                <TableRow key={w.id}>
                  <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                    {formatDateTime(w.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/members/${w.memberId}`}
                      className="font-medium text-ink hover:text-brand-dark"
                    >
                      {w.memberName ?? w.memberLineDisplay ?? "—"}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right font-bold text-money tabular-nums">
                    {formatCurrency(w.amount)}
                  </TableCell>
                  <TableCell>{w.bankCode ?? "—"}</TableCell>
                  <TableCell>{w.bankAccount ?? "—"}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-slate-600">
                    {w.note ?? "—"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={w.status} />
                  </TableCell>
                  <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                    {w.processedAt ? formatDateTime(w.processedAt) : "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    <ReviewButton withdrawal={w} passbookUrl={signedUrl} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: WithdrawalStatus }) {
  const map = {
    pending: "待審核",
    approved: "已通過",
    rejected: "已拒絕",
  } as const;
  return (
    <Badge variant={status} size="sm">
      {map[status]}
    </Badge>
  );
}

function TabsSkeleton() {
  return <Skeleton className="h-12 w-96 rounded-card" />;
}

function TableSkeleton() {
  return (
    <div className="bg-surface rounded-card border border-hairline shadow-premium-sm p-8 space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-10 rounded" />
      ))}
    </div>
  );
}
