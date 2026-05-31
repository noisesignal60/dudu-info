import { Suspense } from "react";
import Link from "next/link";
import { listMembers } from "@/data/admin/members";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { MemberSearchBar } from "./member-search-bar";
import { MemberAvatarPreview } from "./member-avatar-preview";
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
          <Button variant="secondary" size="sm" type="button" disabled>
            匯出 CSV
          </Button>
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
        <div className="rounded-card border border-hairline overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>LINE 頭像</TableHead>
                <TableHead>LINE 顯示名稱</TableHead>
                <TableHead>LINE ID</TableHead>
                <TableHead>姓名</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>電話</TableHead>
                <TableHead>推薦碼</TableHead>
                <TableHead>上級</TableHead>
                <TableHead className="text-right">總收益</TableHead>
                <TableHead className="text-right">待領取</TableHead>
                <TableHead className="text-right">已領取</TableHead>
                <TableHead className="text-right">下包數</TableHead>
                <TableHead>註冊時間</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <MemberAvatarPreview
                      src={m.lineAvatarUrl}
                      alt={m.lineDisplay ?? "LINE"}
                    />
                  </TableCell>
                  <TableCell>{m.lineDisplay ?? "—"}</TableCell>
                  <TableCell>
                    <Badge
                      variant="neutral"
                      size="sm"
                      className="font-mono"
                      title={m.lineUserId}
                    >
                      {shorten(m.lineUserId)}
                    </Badge>
                  </TableCell>
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
                  <TableCell className="text-right">
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

      {totalPages > 1 && (
        <Pagination current={page} total={totalPages} q={q} />
      )}
    </div>
  );
}

function shorten(s: string): string {
  if (s.length <= 14) return s;
  return `${s.slice(0, 6)}…${s.slice(-4)}`;
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
