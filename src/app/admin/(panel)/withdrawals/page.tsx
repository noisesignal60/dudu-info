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
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-slate-900">提領申請</h1>
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
    <nav className="bg-white rounded-2xl border border-slate-200 p-2 inline-flex gap-1">
      {TABS.map((t) => {
        const n = counts[t.key];
        const isActive = t.key === active;
        return (
          <Link
            key={t.key}
            href={`/admin/withdrawals?status=${t.key}`}
            className={cn(
              "px-4 py-2 rounded-xl font-medium text-sm inline-flex items-center gap-2",
              isActive
                ? "bg-brand text-white"
                : "text-slate-700 hover:bg-slate-100",
            )}
          >
            {t.label}
            <span
              className={cn(
                "min-w-6 h-6 px-1.5 grid place-items-center text-xs font-bold rounded-full",
                isActive
                  ? "bg-white/25 text-white"
                  : t.key === "pending" && n > 0
                    ? "bg-red-500 text-white"
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
      <div className="bg-white rounded-2xl border border-slate-200 py-16 text-center text-slate-500">
        <p>沒有符合條件的提領申請</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 text-sm text-slate-600">
        共 <span className="font-bold text-slate-900">{total}</span> 筆 ・
        本頁 {rows.length}/{pageSize}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr className="text-left">
              <Th>申請時間</Th>
              <Th>用戶</Th>
              <Th align="right">提領金額</Th>
              <Th>銀行</Th>
              <Th>帳號</Th>
              <Th>備註</Th>
              <Th>狀態</Th>
              <Th>處理時間</Th>
              <Th align="right">操作</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(async (w) => {
              const signedUrl = w.memberPassbookUrl
                ? await getPassbookSignedUrl(w.memberPassbookUrl)
                : null;
              return (
                <tr key={w.id} className="hover:bg-slate-50">
                  <Td className="text-xs text-slate-500 whitespace-nowrap">
                    {formatDateTime(w.createdAt)}
                  </Td>
                  <Td>
                    <Link
                      href={`/admin/members/${w.memberId}`}
                      className="font-medium text-slate-900 hover:text-brand-dark"
                    >
                      {w.memberName ?? w.memberLineDisplay ?? "—"}
                    </Link>
                  </Td>
                  <Td align="right" className="font-bold text-money tabular-nums">
                    {formatCurrency(w.amount)}
                  </Td>
                  <Td>{w.bankCode ?? "—"}</Td>
                  <Td>{w.bankAccount ?? "—"}</Td>
                  <Td className="max-w-[200px] truncate text-slate-600">
                    {w.note ?? "—"}
                  </Td>
                  <Td>
                    <StatusBadge status={w.status} />
                  </Td>
                  <Td className="text-xs text-slate-500 whitespace-nowrap">
                    {w.processedAt ? formatDateTime(w.processedAt) : "—"}
                  </Td>
                  <Td align="right">
                    <ReviewButton withdrawal={w} passbookUrl={signedUrl} />
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: WithdrawalStatus }) {
  const map = {
    pending: { label: "待審核", cls: "bg-amber-100 text-amber-700" },
    approved: { label: "已通過", cls: "bg-green-100 text-green-700" },
    rejected: { label: "已拒絕", cls: "bg-red-100 text-red-700" },
  } as const;
  const c = map[status];
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold",
        c.cls,
      )}
    >
      {c.label}
    </span>
  );
}

function Th({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`px-3 py-3 text-xs font-bold uppercase whitespace-nowrap ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
  align = "left",
}: {
  children: React.ReactNode;
  className?: string;
  align?: "left" | "right";
}) {
  return (
    <td
      className={`px-3 py-3 ${align === "right" ? "text-right" : "text-left"} ${className}`}
    >
      {children}
    </td>
  );
}

function TabsSkeleton() {
  return <div className="h-12 w-96 bg-slate-200 rounded-2xl animate-pulse" />;
}

function TableSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />
      ))}
    </div>
  );
}
