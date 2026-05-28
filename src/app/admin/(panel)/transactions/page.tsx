import { Suspense } from "react";
import Link from "next/link";
import {
  listAdminTransactions,
  type TxKind,
} from "@/data/admin/transactions";
import { formatCurrency, formatDateTime, cn } from "@/lib/utils";
import { TxToolbar, EditTxButton } from "./tx-modals";

export const metadata = { title: "交易管理 ｜ 後台" };

type SearchParams = Promise<{
  kind?: string;
  member?: string;
  from?: string;
  to?: string;
  page?: string;
}>;

const KIND_LABELS: Record<TxKind, { label: string; cls: string }> = {
  commission: { label: "分潤", cls: "bg-blue-100 text-blue-700" },
  reward: { label: "獎勵", cls: "bg-purple-100 text-purple-700" },
  withdrawal: { label: "提領", cls: "bg-amber-100 text-amber-700" },
  adjust: { label: "調整", cls: "bg-slate-200 text-slate-700" },
};

export default function AdminTransactionsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">交易管理</h1>
          <p className="text-slate-500 mt-1 text-sm">
            分潤、提領、新帳號獎勵與手動調整紀錄
          </p>
        </div>
        <Suspense fallback={null}>
          <ToolbarWithFilters searchParams={searchParams} />
        </Suspense>
      </div>

      <Suspense fallback={<div className="h-14 bg-slate-200 rounded-2xl animate-pulse" />}>
        <FilterBar searchParams={searchParams} />
      </Suspense>

      <Suspense fallback={<TableSkeleton />}>
        <Listing searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function ToolbarWithFilters({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  return (
    <TxToolbar
      filters={{
        kind: sp.kind,
        memberId: sp.member,
        from: sp.from,
        to: sp.to,
      }}
    />
  );
}

async function FilterBar({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const kinds = (["all", "commission", "reward", "withdrawal", "adjust"] as const).map(
    (k) => ({
      k,
      label: k === "all" ? "全部" : KIND_LABELS[k as TxKind].label,
    }),
  );
  const activeKind = sp.kind ?? "all";

  return (
    <form className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap items-end gap-3">
      <input type="hidden" name="member" value={sp.member ?? ""} />
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">
          類型
        </label>
        <div className="inline-flex gap-1">
          {kinds.map(({ k, label }) => (
            <Link
              key={k}
              href={buildHref({ ...sp, kind: k, page: undefined })}
              className={cn(
                "px-3 py-2 rounded-xl text-sm font-medium",
                activeKind === k
                  ? "bg-brand text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200",
              )}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">
          起始
        </label>
        <input
          type="date"
          name="from"
          defaultValue={sp.from ?? ""}
          className="input-base !min-h-10 !text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">
          結束
        </label>
        <input
          type="date"
          name="to"
          defaultValue={sp.to ?? ""}
          className="input-base !min-h-10 !text-sm"
        />
      </div>
      <button type="submit" className="btn-primary !min-h-10 !text-sm">
        套用
      </button>
      {(sp.from || sp.to || sp.member) && (
        <Link
          href={`/admin/transactions${sp.kind && sp.kind !== "all" ? `?kind=${sp.kind}` : ""}`}
          className="btn-secondary !min-h-10 !text-sm"
        >
          清除
        </Link>
      )}
      {sp.member && (
        <div className="text-xs text-slate-500 ml-auto">
          已篩選會員：<code className="font-mono">{sp.member.slice(0, 8)}…</code>
        </div>
      )}
    </form>
  );
}

function buildHref(sp: Record<string, string | undefined>): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (v) params.set(k, v);
  }
  const s = params.toString();
  return `/admin/transactions${s ? `?${s}` : ""}`;
}

async function Listing({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const kindRaw = sp.kind;
  const kind =
    kindRaw && kindRaw !== "all"
      ? (kindRaw as TxKind)
      : ("all" as const);
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const { rows, total, pageSize } = await listAdminTransactions({
    kind,
    memberId: sp.member,
    from: sp.from,
    to: sp.to,
    page,
  });

  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 py-16 text-center text-slate-500">
        沒有符合條件的交易
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 text-sm text-slate-600 flex justify-between">
        <span>
          共 <span className="font-bold text-slate-900">{total}</span> 筆 ・
          本頁 {rows.length}/{pageSize}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr className="text-left">
              <Th>時間</Th>
              <Th>類型</Th>
              <Th>主要對象</Th>
              <Th>交易名目</Th>
              <Th align="right">金額</Th>
              <Th>描述</Th>
              <Th align="right">操作</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((t) => {
              const k = KIND_LABELS[t.kind];
              return (
                <tr key={t.id} className="hover:bg-slate-50">
                  <Td className="text-xs text-slate-500 whitespace-nowrap">
                    {formatDateTime(t.createdAt)}
                  </Td>
                  <Td>
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold",
                        k.cls,
                      )}
                    >
                      {k.label}
                    </span>
                  </Td>
                  <Td>
                    <Link
                      href={`/admin/members/${t.memberId}`}
                      className="font-medium text-slate-900 hover:text-brand-dark"
                    >
                      {t.memberName ?? t.memberLineDisplay ?? "—"}
                    </Link>
                  </Td>
                  <Td>{t.title}</Td>
                  <Td
                    align="right"
                    className={cn(
                      "font-bold tabular-nums",
                      t.amount >= 0 ? "text-positive" : "text-money",
                    )}
                  >
                    {t.amount >= 0 ? "+" : ""}
                    {formatCurrency(t.amount)}
                  </Td>
                  <Td className="max-w-[240px] truncate text-slate-600">
                    {t.description ?? "—"}
                  </Td>
                  <Td align="right">
                    <EditTxButton tx={t} />
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

function TableSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />
      ))}
    </div>
  );
}
