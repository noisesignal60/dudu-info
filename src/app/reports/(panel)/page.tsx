import { Suspense } from "react";
import { Skeleton } from "@/ui/skeleton";
import { listDepartments } from "@/data/reports/departments";
import {
  listLedger,
  listLedgerYears,
  type LedgerSortKey,
} from "@/data/reports/ledger";
import { LedgerStatsBar } from "./_components/stats-bar";
import { ReportFilterBar } from "./_components/filter-bar";
import { LedgerGrid } from "./_components/ledger-grid";
import { NewLedgerEntryButton } from "./_components/ledger-modal";
import { DepartmentManagerButton } from "./_components/department-manager";
import { ExportCsvButton } from "./_components/export-csv-button";

export const metadata = { title: "收支總表 ｜ 帳簿系統" };

type SearchParams = Promise<{
  dept?: string;
  year?: string;
  sort?: string;
  page?: string;
}>;

export default function ReportsOverviewPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-black text-slate-900">收支總表</h1>
          <p className="text-slate-500 mt-1 text-sm">
            所有部門所有日期的收支總覽
          </p>
        </div>
        <Suspense fallback={null}>
          <ToolbarBlock searchParams={searchParams} />
        </Suspense>
      </div>

      <Suspense fallback={<Skeleton className="h-14 rounded-card" />}>
        <FilterBlock searchParams={searchParams} />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-24 rounded-card" />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function ToolbarBlock({ searchParams }: { searchParams: SearchParams }) {
  const [sp, departments] = await Promise.all([searchParams, listDepartments()]);
  return (
    <div className="flex flex-wrap gap-2">
      <NewLedgerEntryButton departments={departments} />
      <DepartmentManagerButton departments={departments} />
      <ExportCsvButton
        filters={{
          departmentId: sp.dept,
          year: sp.year ? Number(sp.year) : undefined,
        }}
      />
    </div>
  );
}

async function FilterBlock({ searchParams }: { searchParams: SearchParams }) {
  const [sp, departments, years] = await Promise.all([
    searchParams,
    listDepartments(),
    listLedgerYears(),
  ]);
  return (
    <ReportFilterBar
      basePath="/reports"
      searchParams={sp}
      showYear
      years={years}
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
    sort,
    page: Math.max(1, Number(sp.page ?? 1)),
    pageSize: 200,
  });

  return (
    <div className="space-y-4">
      <LedgerStatsBar income={totalIncome} expense={totalExpense} />
      <div className="text-sm text-slate-500">
        共 <strong className="text-slate-900">{total}</strong> 筆 ・ 本頁顯示{" "}
        {rows.length} 筆
      </div>
      <LedgerGrid initialRows={rows} departments={departments} />
    </div>
  );
}
