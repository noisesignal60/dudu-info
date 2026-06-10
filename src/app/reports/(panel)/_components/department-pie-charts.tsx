"use client";

import { Cell, Pie, PieChart } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/ui/chart";
import { EmptyState } from "@/ui/empty-state";
import { formatCurrency } from "@/lib/utils";
import type { DepartmentBreakdown, DeptSlice } from "@/data/reports/ledger";

// 部門分類色（超過 5 個部門循環取用）
const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const config = { value: { label: "金額" } } satisfies ChartConfig;

export function DepartmentPieCharts({ data }: { data: DepartmentBreakdown }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <PieBlock title="收入" emptyText="此期間無收入" slices={data.income} />
      <PieBlock title="支出" emptyText="此期間無支出" slices={data.expense} />
    </div>
  );
}

function PieBlock({
  title,
  emptyText,
  slices,
}: {
  title: string;
  emptyText: string;
  slices: DeptSlice[];
}) {
  const total = slices.reduce((s, d) => s + d.value, 0);

  return (
    <div>
      <p className="mb-2 text-center text-sm font-semibold text-slate-700">
        {title}
        {total > 0 && (
          <span className="ml-1 text-slate-500">（{formatCurrency(total)}）</span>
        )}
      </p>

      {slices.length === 0 ? (
        <EmptyState title={emptyText} />
      ) : (
        <>
          <ChartContainer
            config={config}
            className="mx-auto aspect-square h-[200px]"
          >
            <PieChart>
              <ChartTooltip
                isAnimationActive={false}
                wrapperStyle={{ transition: "none" }}
                content={<ChartTooltipContent nameKey="name" />}
              />
              <Pie
                data={slices}
                dataKey="value"
                nameKey="name"
                innerRadius={48}
                strokeWidth={2}
                isAnimationActive={false}
              >
                {slices.map((s, i) => (
                  <Cell key={s.departmentId} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>

          <ul className="mt-3 space-y-1.5">
            {slices.map((s, i) => (
              <li
                key={s.departmentId}
                className="flex items-center gap-2 text-sm"
              >
                <span
                  className="size-2.5 shrink-0 rounded-[2px]"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                <span className="flex-1 truncate text-slate-700">{s.name}</span>
                <span className="fig tabular-nums text-slate-900">
                  {formatCurrency(s.value)}
                </span>
                <span className="w-12 text-right tabular-nums text-slate-500">
                  {((s.value / total) * 100).toFixed(0)}%
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
