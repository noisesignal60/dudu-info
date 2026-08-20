"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
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
    from?: string;
    to?: string;
  };
  showMonth?: boolean;
  showQuarter?: boolean;
  showYear?: boolean;
  showDay?: boolean;
  /** 自訂日期區間（起日 ~ 訖日）；與「年份」互斥，設了其中一邊會清掉另一邊 */
  showDateRange?: boolean;
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
  showDateRange,
  years = [],
  departments,
}: Props) {
  const router = useRouter();

  const year = searchParams.year ?? "";
  const month = searchParams.month ?? "";
  const quarter = searchParams.quarter ?? "";
  const day = searchParams.day ?? "";
  const from = searchParams.from ?? "";
  const to = searchParams.to ?? "";
  const dept = searchParams.dept ?? "";

  // 目前選定年份若不在清單內（手動帶入的網址），補進選項以正確顯示
  const yearNum = year ? Number(year) : null;
  const yearOptions =
    yearNum && !years.includes(yearNum) ? [yearNum, ...years] : years;

  const hasFilter = !!(dept || year || month || quarter || day || from || to);

  // 以目前 searchParams 為基礎更新數個鍵後立即導頁；空值或 sentinel 視為移除
  const setMany = (entries: [key: string, value: string][]) => {
    const params = new URLSearchParams(searchParams as Record<string, string>);
    for (const [key, value] of entries) {
      if (!value || value === ALL) params.delete(key);
      else params.set(key, value);
    }
    // 改任一篩選都回到第 1 頁，避免停在超出範圍的頁碼
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
  };

  const set = (key: string, value: string) => setMany([[key, value]]);

  // 年份與自訂區間互斥：只留使用者最後動的那一個，避免「2025 年 ＋ 2026 區間」查出空白卻看不出原因
  const setYear = (value: string) =>
    setMany([
      ["year", value],
      ["from", ""],
      ["to", ""],
    ]);

  const setRange = (key: "from" | "to", value: string) =>
    setMany([
      [key, value],
      ["year", ""],
    ]);

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
            onValueChange={setYear}
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

      {showDateRange && (
        // 窄螢幕：整組佔滿一行、兩欄各半；sm 以上回到固定寬度並排
        <div className="w-full sm:w-auto flex items-end gap-2">
          <div className="min-w-0 flex-1 sm:flex-none">
            <label
              htmlFor="ledger-range-from"
              className="block text-xs font-medium text-slate-500 mb-1"
            >
              起日
            </label>
            <Input
              id="ledger-range-from"
              type="date"
              inputSize="sm"
              value={from}
              // 選不出反向區間，就不需要另外顯示錯誤訊息
              max={to || undefined}
              onChange={(e) => setRange("from", e.target.value)}
              className={cn(fieldClass, "sm:w-44")}
            />
          </div>
          <span className="text-slate-400 pb-2 select-none">~</span>
          <div className="min-w-0 flex-1 sm:flex-none">
            <label
              htmlFor="ledger-range-to"
              className="block text-xs font-medium text-slate-500 mb-1"
            >
              訖日
            </label>
            <Input
              id="ledger-range-to"
              type="date"
              inputSize="sm"
              value={to}
              min={from || undefined}
              onChange={(e) => setRange("to", e.target.value)}
              className={cn(fieldClass, "sm:w-44")}
            />
          </div>
        </div>
      )}

      {showDay && (
        <div>
          <label
            htmlFor="ledger-day"
            className="block text-xs font-medium text-slate-500 mb-1"
          >
            日期
          </label>
          <Input
            id="ledger-day"
            type="date"
            inputSize="sm"
            value={day}
            onChange={(e) => set("day", e.target.value)}
            className={cn(fieldClass, "w-44")}
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
