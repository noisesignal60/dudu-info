import Link from "next/link";
import type { Department } from "@/data/reports/departments";

type Props = {
  basePath: string; // /reports, /reports/daily ...
  searchParams: {
    dept?: string;
    year?: string;
    month?: string;
    quarter?: string;
  };
  showMonth?: boolean;
  showQuarter?: boolean;
  showYear?: boolean;
  departments: Department[];
};

export function ReportFilterBar({
  basePath,
  searchParams,
  showMonth,
  showQuarter,
  showYear,
  departments,
}: Props) {
  const year = searchParams.year ?? "";
  const month = searchParams.month ?? "";
  const quarter = searchParams.quarter ?? "";
  const dept = searchParams.dept ?? "";

  const hasFilter = !!(dept || year || month || quarter);

  return (
    <form
      method="get"
      action={basePath}
      className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-end gap-3"
    >
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">
          部門
        </label>
        <select
          name="dept"
          defaultValue={dept}
          className="input-base !min-h-10 !text-sm"
        >
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
          <input
            type="number"
            name="year"
            defaultValue={year}
            min={2000}
            max={2100}
            placeholder="2026"
            className="input-base !min-h-10 !text-sm !w-28"
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
            className="input-base !min-h-10 !text-sm !w-24"
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
            className="input-base !min-h-10 !text-sm !w-24"
          >
            <option value="">全部</option>
            <option value="1">Q1</option>
            <option value="2">Q2</option>
            <option value="3">Q3</option>
            <option value="4">Q4</option>
          </select>
        </div>
      )}

      <button type="submit" className="btn-primary !min-h-10 !text-sm">
        套用
      </button>
      {hasFilter && (
        <Link href={basePath} className="btn-secondary !min-h-10 !text-sm">
          清除篩選
        </Link>
      )}
    </form>
  );
}
