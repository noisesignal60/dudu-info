"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import { cn } from "@/lib/utils";
import type { Department } from "@/data/reports/departments";

const ALL = "all";

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
  const router = useRouter();

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

  // 以目前 searchParams 為基礎更新單一鍵後立即導頁；空值或 sentinel 視為移除
  const set = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams as Record<string, string>);
    if (!value || value === ALL) params.delete(key);
    else params.set(key, value);
    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
  };

  const fieldClass = "w-full";

  return (
    <div className="bg-card border border-hairline rounded-card p-4 flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">
          部門
        </label>
        <Select
          value={dept || ALL}
          onValueChange={(v) => set("dept", v)}
        >
          <SelectTrigger size="sm" className={cn(fieldClass, "w-40")}>
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

      {showYear && (
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            年份
          </label>
          <Select
            value={year || ALL}
            onValueChange={(v) => set("year", v)}
          >
            <SelectTrigger size="sm" className={cn(fieldClass, "w-28")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>全部</SelectItem>
              {yearOptions.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {showDay && (
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            日期
          </label>
          <input
            type="date"
            value={day}
            onChange={(e) => set("day", e.target.value)}
            className={cn(
              "rounded-xl border border-input bg-surface min-h-10 px-4 text-sm text-ink",
              "outline-none transition-[color,box-shadow] focus-visible:border-brand focus-visible:ring-4 focus-visible:ring-ring/25",
              "w-44"
            )}
          />
        </div>
      )}

      {showMonth && (
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            月份
          </label>
          <Select
            value={month || ALL}
            onValueChange={(v) => set("month", v)}
          >
            <SelectTrigger size="sm" className={cn(fieldClass, "w-24")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>全部</SelectItem>
              {Array.from({ length: 12 }).map((_, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>
                  {i + 1} 月
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {showQuarter && (
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            季別
          </label>
          <Select
            value={quarter || ALL}
            onValueChange={(v) => set("quarter", v)}
          >
            <SelectTrigger size="sm" className={cn(fieldClass, "w-24")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>全部</SelectItem>
              <SelectItem value="1">Q1</SelectItem>
              <SelectItem value="2">Q2</SelectItem>
              <SelectItem value="3">Q3</SelectItem>
              <SelectItem value="4">Q4</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {hasFilter && (
        <Button variant="secondary" size="sm" asChild>
          <Link href={basePath}>清除篩選</Link>
        </Button>
      )}
    </div>
  );
}
