"use client";

import Link from "next/link";
import { Button } from "@/ui/button";
import { cn } from "@/lib/utils";
import type { Department } from "@/data/reports/departments";

type Props = {
  basePath: string; // /reports, /reports/daily ...
  searchParams: {
    dept?: string;
    year?: string;
    month?: string;
    quarter?: string;
    day?: string;
  };
  showMonth?: boolean;
  showQuarter?: boolean;
  showYear?: boolean;
  showDay?: boolean;
  years?: number[]; // 年份下拉選項（由新到舊）；搭配 showYear
  departments: Department[];
};

export function ReportFilterBar({
  basePath,
  searchParams,
  showMonth,
  showQuarter,
  showYear,
  showDay,
  years = [],
  departments,
}: Props) {
  const year = searchParams.year ?? "";
  const month = searchParams.month ?? "";
  const quarter = searchParams.quarter ?? "";
  const day = searchParams.day ?? "";
  const dept = searchParams.dept ?? "";

  // 目前選定年份若不在清單內（手動帶入的網址），補進選項以正確顯示
  const yearNum = year ? Number(year) : null;
  const yearOptions =
    yearNum && !years.includes(yearNum) ? [yearNum, ...years] : years;

  const hasFilter = !!(dept || year || month || quarter || day);

  const fieldClass =
    "rounded-lg border border-input bg-surface min-h-10 px-3 text-sm text-ink " +
    "outline-none transition-[color,box-shadow] focus-visible:border-brand focus-visible:ring-4 focus-visible:ring-ring/25";

  return (
    <form
      method="get"
      action={basePath}
      className="bg-card border border-hairline rounded-card p-4 flex flex-wrap items-end gap-3"
    >
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">
          部門
        </label>
        <select name="dept" defaultValue={dept} className={fieldClass}>
          <option value="">全部部門</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      {showYear && (
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            年份
          </label>
          <select
            name="year"
            defaultValue={year}
            className={cn(fieldClass, "w-28")}
          >
            <option value="">全部</option>
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      )}

      {showDay && (
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            日期
          </label>
          <input
            type="date"
            name="day"
            defaultValue={day}
            className={cn(fieldClass, "w-44")}
          />
        </div>
      )}

      {showMonth && (
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            月份
          </label>
          <select
            name="month"
            defaultValue={month}
            className={cn(fieldClass, "w-24")}
          >
            <option value="">全部</option>
            {Array.from({ length: 12 }).map((_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1} 月
              </option>
            ))}
          </select>
        </div>
      )}

      {showQuarter && (
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            季別
          </label>
          <select
            name="quarter"
            defaultValue={quarter}
            className={cn(fieldClass, "w-24")}
          >
            <option value="">全部</option>
            <option value="1">Q1</option>
            <option value="2">Q2</option>
            <option value="3">Q3</option>
            <option value="4">Q4</option>
          </select>
        </div>
      )}

      <Button type="submit" size="sm">
        套用
      </Button>
      {hasFilter && (
        <Button variant="secondary" size="sm" asChild>
          <Link href={basePath}>清除篩選</Link>
        </Button>
      )}
    </form>
  );
}
