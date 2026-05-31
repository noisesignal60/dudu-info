import { Suspense } from "react";
import { Skeleton } from "@/ui/skeleton";
import { listDepartments } from "@/data/reports/departments";
import { listLedger, type LedgerSortKey } from "@/data/reports/ledger";
import { LedgerStatsBar } from "../_components/stats-bar";
import { ReportFilterBar } from "../_components/filter-bar";
import { LedgerTable } from "../_components/ledger-table";
import { ExportCsvButton } from "../_components/export-csv-button";

export const metadata = { title: "日報表 ｜ 帳簿系統" };

type SearchParams = Promise<{
  dept?: string;
  year?: string;
  month?: string;
  sort?: string;
}>;

export default function ReportsDailyPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-black text-slate-900">日報表</h1>
          <p className="text-slate-500 mt-1 text-sm">
            依日期排序的明細表，可篩選部門與月份
          </p>
        </div>
        <Suspense fallback={null}>
          <ToolbarBlock searchParams={searchParams} />
        </Suspense>
      </div>

      <Suspense
        fallback={<Skeleton className="h-14 rounded-card" />}
      >
        <FilterBlock searchParams={searchParams} />
      </Suspense>

      <Suspense
        fallback={<Skeleton className="h-24 rounded-card" />}
      >
        <Content searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function ToolbarBlock({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  return (
    <ExportCsvButton
      filters={{
        departmentId: sp.dept,
        year: sp.year ? Number(sp.year) : undefined,
        month: sp.month ? Number(sp.month) : undefined,
      }}
    />
  );
}

async function FilterBlock({ searchParams }: { searchParams: SearchParams }) {
  const [sp, departments] = await Promise.all([searchParams, listDepartments()]);
  return (
    <ReportFilterBar
      basePath="/reports/daily"
      searchParams={sp}
      showYear
      showMonth
      departments={departments}
    />
  );
}

async function Content({ searchParams }: { searchParams: SearchParams }) {
  const [sp, departments] = await Promise.all([searchParams, listDepartments()]);
  const sort = (sp.sort ?? "date.desc") as LedgerSortKey;

  const { rows, totalIncome, totalExpense, total } = await listLedger({
    departmentId: sp.dept,
    year: sp.year ? Number(sp.year) : undefined,
    month: sp.month ? Number(sp.month) : undefined,
    sort,
    pageSize: 500,
  });

  return (
    <div className="space-y-4">
      <LedgerStatsBar income={totalIncome} expense={totalExpense} />
      <div className="text-sm text-slate-500">
        共 <strong className="text-slate-900">{total}</strong> 筆
      </div>
      <LedgerTable
        rows={rows}
        departments={departments}
        basePath="/reports/daily"
        currentSort={sort}
      />
    </div>
  );
}
