"use client";

import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/ui/button";
import type { Department } from "@/data/reports/departments";
import type { ReportScope } from "@/data/reports/ledger";

const fieldClass =
  "rounded-lg border border-input bg-surface min-h-10 px-3 text-sm text-ink " +
  "outline-none transition-[color,box-shadow] focus-visible:border-brand focus-visible:ring-4 focus-visible:ring-ring/25";

export function ReportPeriodBar({
  scope,
  year,
  month,
  quarter,
  dept,
  departments,
}: {
  scope: ReportScope;
  year: number;
  month?: number;
  quarter?: number;
  dept?: string;
  departments: Department[];
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

  const label =
    scope === "month"
      ? `${year} 年 ${month} 月`
      : scope === "quarter"
        ? `${year} 年 第 ${quarter} 季`
        : `${year} 年`;

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
        <span className="min-w-40 text-center font-serif text-lg font-bold text-slate-900">
          {label}
        </span>
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
        <select
          value={dept ?? ""}
          onChange={(e) => go({ dept: e.target.value || undefined })}
          className={fieldClass}
        >
          <option value="">全部部門</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
