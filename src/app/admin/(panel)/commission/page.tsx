import { Suspense } from "react";
import {
  getActiveCommission,
  listCommissionHistory,
} from "@/data/admin/commission";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { CommissionForm } from "./commission-form";
import { Badge } from "@/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/ui/card";
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

export const metadata = { title: "分潤比例 ｜ 後台" };

export default function CommissionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-black text-ink">分潤比例</h1>
        <p className="text-slate-500 mt-1 text-sm">
          設定五級分潤級距與新會員獎勵金；變更會自動寫入歷史
        </p>
      </div>

      <Suspense fallback={<FormSkeleton />}>
        <FormBlock />
      </Suspense>

      <Suspense fallback={<HistorySkeleton />}>
        <HistoryBlock />
      </Suspense>
    </div>
  );
}

async function FormBlock() {
  const current = await getActiveCommission();
  return <CommissionForm current={current} />;
}

async function HistoryBlock() {
  const history = await listCommissionHistory(30);

  return (
    <Card>
      <CardHeader>
        <CardTitle>變更歷史</CardTitle>
        <CardDescription>最近 {history.length} 筆</CardDescription>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <EmptyState title="尚無變更紀錄" />
        ) : (
          <div className="hidden md:block rounded-card border border-hairline overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>變更時間</TableHead>
                  <TableHead>A 比例</TableHead>
                  <TableHead>B 比例</TableHead>
                  <TableHead>C 比例</TableHead>
                  <TableHead>D 比例</TableHead>
                  <TableHead>E 比例</TableHead>
                  <TableHead>新會員獎勵</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead>變更人員</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                      {formatDateTime(h.createdAt)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {h.rateA}%
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {h.rateB}%
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {h.rateC}%
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {h.rateD}%
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {h.rateE}%
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(h.newBonus)}
                    </TableCell>
                    <TableCell>
                      {h.isActive ? (
                        <Badge variant="positive" size="sm">
                          生效中
                        </Badge>
                      ) : (
                        <Badge variant="neutral" size="sm">
                          已被取代
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-600">{h.changerName ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* 手機：卡片 */}
        {history.length > 0 && (
          <ul className="md:hidden space-y-3">
            {history.map((h) => (
              <li
                key={h.id}
                className="rounded-card border border-hairline bg-surface shadow-premium-sm p-4 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-500">
                    {formatDateTime(h.createdAt)}
                  </span>
                  {h.isActive ? (
                    <Badge variant="positive" size="sm">
                      生效中
                    </Badge>
                  ) : (
                    <Badge variant="neutral" size="sm">
                      已被取代
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-5 gap-2 text-center">
                  {(["A", "B", "C", "D", "E"] as const).map((lv) => (
                    <div key={lv} className="rounded-lg bg-canvas py-2">
                      <p className="eyebrow text-slate-400">{lv}</p>
                      <p className="fig text-ink tabular-nums">
                        {h[`rate${lv}` as `rate${typeof lv}`]}%
                      </p>
                    </div>
                  ))}
                </div>
                <dl className="grid grid-cols-2 gap-x-3 text-sm">
                  <dt className="text-slate-500">新會員獎勵</dt>
                  <dd className="text-ink text-right tabular-nums">
                    {formatCurrency(h.newBonus)}
                  </dd>
                  <dt className="text-slate-500">變更人員</dt>
                  <dd className="text-ink text-right">{h.changerName ?? "—"}</dd>
                </dl>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function FormSkeleton() {
  return (
    <div className="grid lg:grid-cols-3 gap-5">
      <Skeleton className="lg:col-span-2 h-96 rounded-card" />
      <Skeleton className="h-72 rounded-card" />
    </div>
  );
}

function HistorySkeleton() {
  return <Skeleton className="h-48 rounded-card" />;
}
