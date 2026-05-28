import { Suspense } from "react";
import { listDepartments } from "@/data/reports/departments";
import { aggregateLedger } from "@/data/reports/ledger";
import { LedgerStatsBar } from "../_components/stats-bar";
import { ReportFilterBar } from "../_components/filter-bar";
import { AggregateTable } from "../_components/aggregate-table";

export const metadata = { title: "月報表 ｜ 帳簿系統" };

type SearchParams = Promise<{ dept?: string; year?: string }>;

export default function ReportsMonthlyPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-slate-900">月報表</h1>
        <p className="text-slate-500 mt-1 text-sm">
          以月為單位匯總收入、支出、淨額
        </p>
      </div>

      <Suspense
        fallback={<div className="h-14 bg-slate-200 rounded-2xl animate-pulse" />}
      >
        <FilterBlock searchParams={searchParams} />
      </Suspense>

      <Suspense
        fallback={<div className="h-24 bg-slate-200 rounded-2xl animate-pulse" />}
      >
        <Content searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function FilterBlock({ searchParams }: { searchParams: SearchParams }) {
  const [sp, departments] = await Promise.all([searchParams, listDepartments()]);
  return (
    <ReportFilterBar
      basePath="/reports/monthly"
      searchParams={sp}
      showYear
      departments={departments}
    />
  );
}

async function Content({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const rows = await aggregateLedger({
    groupBy: "month",
    year: sp.year ? Number(sp.year) : undefined,
    departmentId: sp.dept,
  });

  const totalIncome = rows.reduce((s, r) => s + r.income, 0);
  const totalExpense = rows.reduce((s, r) => s + r.expense, 0);

  return (
    <div className="space-y-4">
      <LedgerStatsBar income={totalIncome} expense={totalExpense} />
      <AggregateTable rows={rows} />
    </div>
  );
}
