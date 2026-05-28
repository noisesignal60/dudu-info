import { Suspense } from "react";
import {
  getActiveCommission,
  listCommissionHistory,
} from "@/data/admin/commission";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { CommissionForm } from "./commission-form";

export const metadata = { title: "分潤比例 ｜ 後台" };

export default function CommissionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">分潤比例</h1>
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
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <header className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">變更歷史</h2>
        <span className="text-xs text-slate-500">最近 {history.length} 筆</span>
      </header>

      {history.length === 0 ? (
        <div className="py-12 text-center text-slate-500">尚無變更紀錄</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr className="text-left">
                <Th>變更時間</Th>
                <Th align="right">A 比例</Th>
                <Th align="right">B 比例</Th>
                <Th align="right">C 比例</Th>
                <Th align="right">D 比例</Th>
                <Th align="right">E 比例</Th>
                <Th align="right">新會員獎勵</Th>
                <Th>狀態</Th>
                <Th>變更人員</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.map((h) => (
                <tr key={h.id} className="hover:bg-slate-50">
                  <Td className="text-xs text-slate-500 whitespace-nowrap">
                    {formatDateTime(h.createdAt)}
                  </Td>
                  <Td align="right" className="tabular-nums">
                    {h.rateA}%
                  </Td>
                  <Td align="right" className="tabular-nums">
                    {h.rateB}%
                  </Td>
                  <Td align="right" className="tabular-nums">
                    {h.rateC}%
                  </Td>
                  <Td align="right" className="tabular-nums">
                    {h.rateD}%
                  </Td>
                  <Td align="right" className="tabular-nums">
                    {h.rateE}%
                  </Td>
                  <Td align="right" className="tabular-nums">
                    {formatCurrency(h.newBonus)}
                  </Td>
                  <Td>
                    {h.isActive ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                        生效中
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">已被取代</span>
                    )}
                  </Td>
                  <Td className="text-slate-600">{h.changerName ?? "—"}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
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

function FormSkeleton() {
  return (
    <div className="grid lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 h-96 bg-slate-200 rounded-2xl animate-pulse" />
      <div className="h-72 bg-slate-200 rounded-2xl animate-pulse" />
    </div>
  );
}

function HistorySkeleton() {
  return (
    <div className="h-48 bg-slate-200 rounded-2xl animate-pulse" />
  );
}
