"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/ui/chart";
import { EmptyState } from "@/ui/empty-state";
import type { LedgerAggregateRow } from "@/data/reports/ledger";

// 三條線沿用全站語意色：收入綠、支出紅、淨額品牌色
const config = {
  income: { label: "收入", color: "var(--color-positive)" },
  expense: { label: "支出", color: "var(--color-money)" },
  net: { label: "淨額", color: "var(--color-brand)" },
} satisfies ChartConfig;

// Y 軸刻度精簡（萬／億），照顧大金額與年長使用者閱讀
function compactAmount(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 100_000_000) return `${(v / 100_000_000).toFixed(1)}億`;
  if (abs >= 10_000) return `${Math.round(v / 10_000)}萬`;
  return `${v}`;
}

export function TrendLineChart({ rows }: { rows: LedgerAggregateRow[] }) {
  if (rows.length === 0) {
    return <EmptyState title="此期間沒有資料可繪製" />;
  }

  return (
    <ChartContainer config={config} className="aspect-auto h-[280px] w-full">
      <LineChart data={rows} margin={{ left: 4, right: 12, top: 8, bottom: 4 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={24}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={48}
          tickFormatter={(v) => compactAmount(Number(v))}
        />
        <ChartTooltip
          isAnimationActive={false}
          position={{ y: 8 }}
          wrapperStyle={{ transition: "none" }}
          content={<ChartTooltipContent />}
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Line
          dataKey="income"
          type="monotone"
          stroke="var(--color-income)"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
        <Line
          dataKey="expense"
          type="monotone"
          stroke="var(--color-expense)"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
        <Line
          dataKey="net"
          type="monotone"
          stroke="var(--color-net)"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ChartContainer>
  );
}
