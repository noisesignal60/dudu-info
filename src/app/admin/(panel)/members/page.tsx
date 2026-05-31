import { Suspense } from "react";
import Link from "next/link";
import { listMembers } from "@/data/admin/members";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { MemberSearchBar } from "./member-search-bar";
import { MembersExportCsvButton } from "./export-csv-button";
import { Button } from "@/ui/button";
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

export const metadata = { title: "會員管理 ｜ 後台" };

type SearchParams = Promise<{ q?: string; page?: string }>;

export default function AdminMembersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-black text-slate-900">會員管理</h1>
          <p className="text-slate-500 mt-1 text-sm">
            管理所有計程車司機會員，包含 LINE 資訊、銀行資料與餘額
          </p>
        </div>
        <div className="flex gap-2">
          <MembersExportCsvButton />
        </div>
      </div>

      <Suspense fallback={<Skeleton className="h-12 rounded-xl" />}>
        <MemberSearchBar />
      </Suspense>

      <Suspense fallback={<TableSkeleton />}>
        <MemberTable searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function MemberTable({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const q = sp.q ?? "";
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const pageSize = 20;
  const { rows, total } = await listMembers({ q, page, pageSize });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const showing = rows.length;

  return (
    <div className="space-y-3">
      <div className="text-sm text-slate-600">
        共 <span className="font-bold text-slate-900">{total}</span> 筆會員
        ・本頁顯示 {showing}/{pageSize}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-card border border-hairline overflow-hidden">
          <EmptyState title="沒有符合條件的會員" description="試試調整搜尋條件" />
        </div>
      ) : (
        <div className="hidden md:block rounded-card border border-hairline overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">LINE 顯示名稱</TableHead>
                <TableHead className="text-center">姓名</TableHead>
                <TableHead className="text-center">Email</TableHead>
                <TableHead className="text-center">電話</TableHead>
                <TableHead className="text-center">推薦碼</TableHead>
                <TableHead className="text-center">上級</TableHead>
                <TableHead className="text-center">總收益</TableHead>
                <TableHead className="text-center">待領取</TableHead>
                <TableHead className="text-center">已領取</TableHead>
                <TableHead className="text-center">下包數</TableHead>
                <TableHead className="text-center">註冊時間</TableHead>
                <TableHead className="text-center">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{m.lineDisplay ?? "—"}</TableCell>
                  <TableCell>{m.name ?? "—"}</TableCell>
                  <TableCell className="max-w-[180px] truncate">{m.email ?? "—"}</TableCell>
                  <TableCell>{m.phone ?? "—"}</TableCell>
                  <TableCell>
                    {m.referralCode ? (
                      <Badge variant="brand" size="sm" className="font-mono">
                        {m.referralCode}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    {m.uplineName ? (
                      <span title={m.uplineReferralCode ?? ""}>
                        {m.uplineName}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {formatCurrency(m.totalEarned)}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-positive tabular-nums">
                    {formatCurrency(m.pending)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(m.withdrawn)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{m.downlineCount}</TableCell>
                  <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                    {formatDateTime(m.createdAt)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button variant="link" size="sm" asChild>
                      <Link href={`/admin/members/${m.id}`}>檢視</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* 手機：卡片 */}
      {rows.length > 0 && (
        <ul className="md:hidden space-y-3">
          {rows.map((m) => (
            <li key={m.id}>
              <Link
                href={`/admin/members/${m.id}`}
                className="block bg-surface rounded-card border border-hairline shadow-premium-sm p-4 space-y-3 active:bg-secondary"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink truncate">
                      {m.name ?? m.lineDisplay ?? "—"}
                    </p>
                    {m.name && m.lineDisplay && (
                      <p className="text-sm text-slate-500 truncate">
                        LINE：{m.lineDisplay}
                      </p>
                    )}
                  </div>
                  {m.referralCode && (
                    <Badge variant="brand" size="sm" className="font-mono shrink-0">
                      {m.referralCode}
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-canvas py-2">
                    <p className="eyebrow text-slate-400">待領取</p>
                    <p className="fig text-positive tabular-nums text-sm">
                      {formatCurrency(m.pending)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-canvas py-2">
                    <p className="eyebrow text-slate-400">總收益</p>
                    <p className="fig text-ink tabular-nums text-sm">
                      {formatCurrency(m.totalEarned)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-canvas py-2">
                    <p className="eyebrow text-slate-400">下包</p>
                    <p className="fig text-ink tabular-nums text-sm">
                      {m.downlineCount}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 truncate">
                    {m.phone ?? m.email ?? "—"}
                  </span>
                  <span className="text-accent-blue font-medium shrink-0">檢視 →</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <Pagination current={page} total={totalPages} q={q} />
      )}
    </div>
  );
}

function Pagination({
  current,
  total,
  q,
}: {
  current: number;
  total: number;
  q: string;
}) {
  function href(p: number) {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (p > 1) sp.set("page", String(p));
    const s = sp.toString();
    return s ? `?${s}` : "?";
  }

  return (
    <nav
      className="flex items-center justify-between rounded-card border border-hairline px-5 py-3"
      aria-label="分頁"
    >
      <Button
        variant="secondary"
        size="sm"
        asChild
        aria-disabled={current === 1}
        className={current === 1 ? "opacity-50 pointer-events-none" : ""}
      >
        <Link href={current > 1 ? href(current - 1) : "#"}>上一頁</Link>
      </Button>
      <span className="text-sm text-slate-600">
        第 <strong>{current}</strong> / {total} 頁
      </span>
      <Button
        variant="secondary"
        size="sm"
        asChild
        aria-disabled={current === total}
        className={current === total ? "opacity-50 pointer-events-none" : ""}
      >
        <Link href={current < total ? href(current + 1) : "#"}>下一頁</Link>
      </Button>
    </nav>
  );
}

function TableSkeleton() {
  return (
    <div className="bg-surface rounded-card border border-hairline p-8 space-y-3">
      <Skeleton className="h-6 w-48 rounded" />
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-10 rounded" />
      ))}
    </div>
  );
}
