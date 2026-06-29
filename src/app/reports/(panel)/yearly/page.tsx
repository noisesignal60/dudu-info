import { Suspense } from "react";
import { Skeleton } from "@/ui/skeleton";
import { SectionCard } from "@/ui/section-card";
import { listDepartments } from "@/data/reports/departments";
import { getPeriodReport, listLedgerYears } from "@/data/reports/ledger";
import { LedgerStatsBar } from "../_components/stats-bar";
import { AggregateTable } from "../_components/aggregate-table";
import { ReportPeriodBar } from "../_components/report-period-bar";
import { TrendLineChart } from "../_components/trend-line-chart";
import { DepartmentPieCharts } from "../_components/department-pie-charts";

export const metadata = { title: "年報表 ｜ 帳簿系統" };

type SearchParams = Promise<{ dept?: string; y?: string }>;

export default function ReportsYearlyPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-black text-slate-900">年報表</h1>
        <p className="text-slate-500 mt-1 text-sm">
          當年收入、支出、淨額（以月為點）；可直接選擇或用上一個／下一個切換年份
        </p>
      </div>

      <Suspense fallback={<Skeleton className="h-96 rounded-card" />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Content({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const now = new Date();
  const year = sp.y ? Number(sp.y) : now.getFullYear();

  const [departments, report, years] = await Promise.all([
    listDepartments(),
    getPeriodReport({ scope: "year", year, departmentId: sp.dept }),
    listLedgerYears(),
  ]);

  return (
    <div className="space-y-4">
      <ReportPeriodBar
        scope="year"
        year={year}
        dept={sp.dept}
        departments={departments}
        years={years}
      />
      <LedgerStatsBar
        income={report.totalIncome}
        expense={report.totalExpense}
      />
      <SectionCard title="收支趨勢" subtitle={report.periodLabel}>
        <TrendLineChart rows={report.series} />
      </SectionCard>
      <SectionCard title="部門分布" subtitle={report.periodLabel}>
        <DepartmentPieCharts data={report.breakdown} />
      </SectionCard>
      <AggregateTable rows={report.series} />
    </div>
  );
}
