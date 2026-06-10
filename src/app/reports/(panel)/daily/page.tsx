import { Suspense } from "react";
import { Skeleton } from "@/ui/skeleton";
import { SectionCard } from "@/ui/section-card";
import { listDepartments } from "@/data/reports/departments";
import {
  getLedgerDeptBreakdown,
  listLedger,
  type LedgerSortKey,
} from "@/data/reports/ledger";
import { LedgerStatsBar } from "../_components/stats-bar";
import { ReportFilterBar } from "../_components/filter-bar";
import { LedgerGrid } from "../_components/ledger-grid";
import { DepartmentPieCharts } from "../_components/department-pie-charts";
import { ExportCsvButton } from "../_components/export-csv-button";

export const metadata = { title: "日報表 ｜ 帳簿系統" };

type SearchParams = Promise<{
  dept?: string;
  day?: string;
  sort?: string;
}>;

/** 今天 ISO（日報表預設顯示當天）。 */
function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** ISO `2026-05-23` → `2026/5/23`（顯示用）。 */
function slash(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/u);
  return m ? `${m[1]}/${Number(m[2])}/${Number(m[3])}` : iso;
}

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
            只顯示選定當日的明細，可挑選日期與部門
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
        fallback={<Skeleton className="h-80 rounded-card" />}
      >
        <Content searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function ToolbarBlock({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const day = sp.day || todayISO();
  const d = new Date(`${day}T00:00:00Z`);
  return (
    <ExportCsvButton
      filters={{
        departmentId: sp.dept,
        year: d.getUTCFullYear(),
        month: d.getUTCMonth() + 1,
      }}
    />
  );
}

async function FilterBlock({ searchParams }: { searchParams: SearchParams }) {
  const [sp, departments] = await Promise.all([searchParams, listDepartments()]);
  return (
    <ReportFilterBar
      basePath="/reports/daily"
      searchParams={{ ...sp, day: sp.day || todayISO() }}
      showDay
      departments={departments}
    />
  );
}

async function Content({ searchParams }: { searchParams: SearchParams }) {
  const [sp, departments] = await Promise.all([searchParams, listDepartments()]);
  const sort = (sp.sort ?? "date.desc") as LedgerSortKey;
  const day = sp.day || todayISO();

  const [{ rows, totalIncome, totalExpense, total }, breakdown] =
    await Promise.all([
      listLedger({ departmentId: sp.dept, day, sort, pageSize: 500 }),
      getLedgerDeptBreakdown({ departmentId: sp.dept, day }),
    ]);

  return (
    <div className="space-y-4">
      <LedgerStatsBar income={totalIncome} expense={totalExpense} />
      <SectionCard title="部門分布" subtitle={slash(day)}>
        <DepartmentPieCharts data={breakdown} />
      </SectionCard>
      <div className="text-sm text-slate-500">
        {slash(day)} 共 <strong className="text-slate-900">{total}</strong> 筆
      </div>
      <LedgerGrid
        initialRows={rows}
        departments={departments}
        expectedDate={day}
      />
    </div>
  );
}
