"use client";

import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import type { Department } from "@/data/reports/departments";
import type { ReportScope } from "@/data/reports/ledger";

const ALL = "all";

export function ReportPeriodBar({
  scope,
  year,
  month,
  quarter,
  dept,
  departments,
  years = [],
}: {
  scope: ReportScope;
  year: number;
  month?: number;
  quarter?: number;
  dept?: string;
  departments: Department[];
  years?: number[];
}) {
  const router = useRouter();
  const pathname = usePathname();

  // period 與 dept 互相保留：未帶到的鍵沿用目前值
  const go = (next: {
    year?: number;
    month?: number;
    quarter?: number;
    dept?: string;
  }) => {
    const params = new URLSearchParams();
    params.set("y", String(next.year ?? year));
    if (scope === "month") params.set("m", String(next.month ?? month ?? 1));
    if (scope === "quarter") params.set("q", String(next.quarter ?? quarter ?? 1));
    const d = "dept" in next ? next.dept : dept;
    if (d) params.set("dept", d);
    router.push(`${pathname}?${params.toString()}`);
  };

  const step = (dir: -1 | 1) => {
    if (scope === "year") {
      go({ year: year + dir });
      return;
    }
    if (scope === "month") {
      let m = (month ?? 1) + dir;
      let y = year;
      if (m < 1) {
        m = 12;
        y -= 1;
      } else if (m > 12) {
        m = 1;
        y += 1;
      }
      go({ year: y, month: m });
      return;
    }
    // quarter
    let qtr = (quarter ?? 1) + dir;
    let y = year;
    if (qtr < 1) {
      qtr = 4;
      y -= 1;
    } else if (qtr > 4) {
      qtr = 1;
      y += 1;
    }
    go({ year: y, quarter: qtr });
  };

  // 年份選項：今年與目前選定年份一定在清單內，由新到舊
  const currentYear = new Date().getFullYear();
  const yearOptions = [...new Set([currentYear, year, ...years])].sort(
    (a, b) => b - a
  );

  return (
    <div className="bg-card border border-hairline rounded-card p-4 flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="icon"
          variant="secondary"
          onClick={() => step(-1)}
          aria-label="上一個期間"
        >
          <ChevronLeft />
        </Button>

        <div className="flex items-center gap-2">
          <Select
            value={String(year)}
            onValueChange={(v) => go({ year: Number(v) })}
          >
            <SelectTrigger size="sm" className="w-28" aria-label="選擇年份">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y} 年
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {scope === "month" && (
            <Select
              value={String(month ?? 1)}
              onValueChange={(v) => go({ month: Number(v) })}
            >
              <SelectTrigger size="sm" className="w-24" aria-label="選擇月份">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }).map((_, i) => (
                  <SelectItem key={i + 1} value={String(i + 1)}>
                    {i + 1} 月
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {scope === "quarter" && (
            <Select
              value={String(quarter ?? 1)}
              onValueChange={(v) => go({ quarter: Number(v) })}
            >
              <SelectTrigger size="sm" className="w-28" aria-label="選擇季別">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4].map((q) => (
                  <SelectItem key={q} value={String(q)}>
                    第 {q} 季
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <Button
          type="button"
          size="icon"
          variant="secondary"
          onClick={() => step(1)}
          aria-label="下一個期間"
        >
          <ChevronRight />
        </Button>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <label className="text-xs font-medium text-slate-500">部門</label>
        <Select
          value={dept ?? ALL}
          onValueChange={(v) => go({ dept: v === ALL ? undefined : v })}
        >
          <SelectTrigger size="sm" className="w-40" aria-label="選擇部門">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>全部部門</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
