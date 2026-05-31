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
          <div className="rounded-card border border-hairline overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>變更時間</TableHead>
                  <TableHead className="text-right">A 比例</TableHead>
                  <TableHead className="text-right">B 比例</TableHead>
                  <TableHead className="text-right">C 比例</TableHead>
                  <TableHead className="text-right">D 比例</TableHead>
                  <TableHead className="text-right">E 比例</TableHead>
                  <TableHead className="text-right">新會員獎勵</TableHead>
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
