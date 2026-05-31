import { Suspense } from "react";
import Link from "next/link";
import {
  listAdminTransactions,
  type TxKind,
} from "@/data/admin/transactions";
import { formatCurrency, formatDateTime, cn } from "@/lib/utils";
import { TxToolbar, EditTxButton } from "./tx-modals";
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

export const metadata = { title: "交易管理 ｜ 後台" };

type SearchParams = Promise<{
  kind?: string;
  member?: string;
  from?: string;
  to?: string;
  page?: string;
}>;

type KindVariant = "commission" | "reward" | "withdrawal" | "adjust";

const KIND_LABELS: Record<TxKind, { label: string; variant: KindVariant }> = {
  commission: { label: "分潤", variant: "commission" },
  reward: { label: "獎勵", variant: "reward" },
  withdrawal: { label: "提領", variant: "withdrawal" },
  adjust: { label: "調整", variant: "adjust" },
};

export default function AdminTransactionsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-black text-ink">交易管理</h1>
          <p className="text-slate-500 mt-1 text-sm">
            分潤、提領、新帳號獎勵與手動調整紀錄
          </p>
        </div>
        <Suspense fallback={null}>
          <ToolbarWithFilters searchParams={searchParams} />
        </Suspense>
      </div>

      <Suspense fallback={<Skeleton className="h-14 rounded-card" />}>
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

  const dateClass =
    "rounded-xl border border-input bg-surface min-h-10 px-3 text-sm text-ink " +
    "outline-none transition-[color,box-shadow] focus-visible:border-brand focus-visible:ring-4 focus-visible:ring-ring/25";

  return (
    <form className="bg-surface rounded-card border border-hairline shadow-premium-sm p-4 flex flex-wrap items-end gap-3">
      <input type="hidden" name="member" value={sp.member ?? ""} />
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">
          類型
        </label>
        <div className="inline-flex gap-1">
          {kinds.map(({ k, label }) => (
            <Button
              key={k}
              asChild
              size="sm"
              variant={activeKind === k ? "primary" : "secondary"}
            >
              <Link href={buildHref({ ...sp, kind: k, page: undefined })}>
                {label}
              </Link>
            </Button>
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
          className={dateClass}
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
          className={dateClass}
        />
      </div>
      <Button type="submit" size="sm">
        套用
      </Button>
      {(sp.from || sp.to || sp.member) && (
        <Button asChild variant="secondary" size="sm">
          <Link
            href={`/admin/transactions${sp.kind && sp.kind !== "all" ? `?kind=${sp.kind}` : ""}`}
          >
            清除
          </Link>
        </Button>
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
      <div className="rounded-card border border-hairline overflow-hidden">
        <EmptyState title="沒有符合條件的交易" />
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
              <TableHead>時間</TableHead>
              <TableHead>類型</TableHead>
              <TableHead>主要對象</TableHead>
              <TableHead>交易名目</TableHead>
              <TableHead className="text-right">金額</TableHead>
              <TableHead>描述</TableHead>
              <TableHead className="text-center">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((t) => {
              const k = KIND_LABELS[t.kind];
              return (
                <TableRow key={t.id}>
                  <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                    {formatDateTime(t.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={k.variant} size="sm">
                      {k.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/members/${t.memberId}`}
                      className="font-medium text-ink hover:text-brand-dark"
                    >
                      {t.memberName ?? t.memberLineDisplay ?? "—"}
                    </Link>
                  </TableCell>
                  <TableCell>{t.title}</TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-bold tabular-nums",
                      t.amount >= 0 ? "text-positive" : "text-money",
                    )}
                  >
                    {t.amount >= 0 ? "+" : ""}
                    {formatCurrency(t.amount)}
                  </TableCell>
                  <TableCell className="max-w-[240px] truncate text-slate-600">
                    {t.description ?? "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    <EditTxButton tx={t} />
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

function TableSkeleton() {
  return (
    <div className="bg-surface rounded-card border border-hairline shadow-premium-sm p-8 space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-10 rounded" />
      ))}
    </div>
  );
}
