import { Suspense } from "react";
import Link from "next/link";
import { listMembers } from "@/data/admin/members";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Download, Eye } from "lucide-react";
import { MemberSearchBar } from "./member-search-bar";
import { MemberAvatarPreview } from "./member-avatar-preview";

export const metadata = { title: "會員管理 ｜ 後台" };

type SearchParams = Promise<{ q?: string; page?: string }>;

export default function AdminMembersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">會員管理</h1>
          <p className="text-slate-500 mt-1 text-sm">
            管理所有計程車司機會員，包含 LINE 資訊、銀行資料與餘額
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" type="button" disabled>
            <Download className="w-4 h-4" />
            匯出 CSV
          </button>
        </div>
      </div>

      <Suspense fallback={<div className="h-12 bg-slate-200 rounded-xl animate-pulse" />}>
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
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 text-sm text-slate-600">
        共 <span className="font-bold text-slate-900">{total}</span> 筆會員
        ・本頁顯示 {showing}/{pageSize}
      </div>

      {rows.length === 0 ? (
        <div className="py-16 text-center text-slate-500">
          <p className="font-medium">沒有符合條件的會員</p>
          <p className="text-sm mt-1">試試調整搜尋條件</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr className="text-left">
                <Th>LINE 頭像</Th>
                <Th>LINE 顯示名稱</Th>
                <Th>LINE ID</Th>
                <Th>姓名</Th>
                <Th>Email</Th>
                <Th>電話</Th>
                <Th>推薦碼</Th>
                <Th>上級</Th>
                <Th align="right">總收益</Th>
                <Th align="right">待領取</Th>
                <Th align="right">已領取</Th>
                <Th align="right">下包數</Th>
                <Th>註冊時間</Th>
                <Th align="right">操作</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <Td>
                    <MemberAvatarPreview
                      src={m.lineAvatarUrl}
                      alt={m.lineDisplay ?? "LINE"}
                    />
                  </Td>
                  <Td>{m.lineDisplay ?? "—"}</Td>
                  <Td>
                    <code
                      className="text-xs bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-700"
                      title={m.lineUserId}
                    >
                      {shorten(m.lineUserId)}
                    </code>
                  </Td>
                  <Td>{m.name ?? "—"}</Td>
                  <Td className="max-w-[180px] truncate">{m.email ?? "—"}</Td>
                  <Td>{m.phone ?? "—"}</Td>
                  <Td>
                    {m.referralCode ? (
                      <code className="text-xs bg-brand-soft text-brand-dark px-1.5 py-0.5 rounded font-mono font-bold">
                        {m.referralCode}
                      </code>
                    ) : (
                      "—"
                    )}
                  </Td>
                  <Td>
                    {m.uplineName ? (
                      <span title={m.uplineReferralCode ?? ""}>
                        {m.uplineName}
                      </span>
                    ) : (
                      "—"
                    )}
                  </Td>
                  <Td align="right" className="font-semibold tabular-nums">
                    {formatCurrency(m.totalEarned)}
                  </Td>
                  <Td align="right" className="font-semibold text-positive tabular-nums">
                    {formatCurrency(m.pending)}
                  </Td>
                  <Td align="right" className="tabular-nums">
                    {formatCurrency(m.withdrawn)}
                  </Td>
                  <Td align="right" className="tabular-nums">{m.downlineCount}</Td>
                  <Td className="text-xs text-slate-500 whitespace-nowrap">
                    {formatDateTime(m.createdAt)}
                  </Td>
                  <Td align="right">
                    <Link
                      href={`/admin/members/${m.id}`}
                      className="inline-flex items-center gap-1 text-brand-dark hover:text-brand font-semibold"
                    >
                      <Eye className="w-4 h-4" />
                      檢視
                    </Link>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <Pagination current={page} total={totalPages} q={q} />
      )}
    </div>
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
      className={`px-3 py-2.5 ${align === "right" ? "text-right" : "text-left"} ${className}`}
    >
      {children}
    </td>
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
      className="flex items-center justify-between border-t border-slate-100 px-5 py-3"
      aria-label="分頁"
    >
      <Link
        href={current > 1 ? href(current - 1) : "#"}
        aria-disabled={current === 1}
        className={`btn-secondary !min-h-10 !px-4 !text-sm ${
          current === 1 ? "opacity-50 pointer-events-none" : ""
        }`}
      >
        上一頁
      </Link>
      <span className="text-sm text-slate-600">
        第 <strong>{current}</strong> / {total} 頁
      </span>
      <Link
        href={current < total ? href(current + 1) : "#"}
        aria-disabled={current === total}
        className={`btn-secondary !min-h-10 !px-4 !text-sm ${
          current === total ? "opacity-50 pointer-events-none" : ""
        }`}
      >
        下一頁
      </Link>
    </nav>
  );
}

function TableSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
      <div className="h-6 w-48 bg-slate-200 rounded animate-pulse" />
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />
      ))}
    </div>
  );
}
