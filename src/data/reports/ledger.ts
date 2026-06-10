import "server-only";

import { cacheTag } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type LedgerEntry = {
  id: string;
  entryDate: string;
  departmentId: string;
  departmentName: string | null;
  carOrPerson: string | null;
  item: string;
  income: number;
  expense: number;
  note1: string | null;
  note2: string | null;
  sortOrder: number;
  createdAt: string;
};

export type LedgerSortKey =
  | "date.asc"
  | "date.desc"
  | "department.asc"
  | "department.desc"
  | "car.asc"
  | "car.desc"
  | "income.asc"
  | "income.desc"
  | "expense.asc"
  | "expense.desc"
  | "sort.asc";

export type LedgerListParams = {
  departmentId?: string;
  year?: number;
  month?: number; // 1-12
  quarter?: number; // 1-4
  day?: string; // 單日 ISO YYYY-MM-DD（指定時優先於 year/month/quarter）
  sort?: LedgerSortKey;
  page?: number;
  pageSize?: number;
};

export type LedgerListResult = {
  rows: LedgerEntry[];
  total: number;
  totalIncome: number;
  totalExpense: number;
  page: number;
  pageSize: number;
};

const SORT_MAP: Record<LedgerSortKey, { col: string; asc: boolean }> = {
  "date.asc": { col: "entry_date", asc: true },
  "date.desc": { col: "entry_date", asc: false },
  "department.asc": { col: "department_id", asc: true },
  "department.desc": { col: "department_id", asc: false },
  "car.asc": { col: "car_or_person", asc: true },
  "car.desc": { col: "car_or_person", asc: false },
  "income.asc": { col: "income", asc: true },
  "income.desc": { col: "income", asc: false },
  "expense.asc": { col: "expense", asc: true },
  "expense.desc": { col: "expense", asc: false },
  "sort.asc": { col: "sort_order", asc: true },
};

export async function listLedger(
  params: LedgerListParams = {},
): Promise<LedgerListResult> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(500, Math.max(10, params.pageSize ?? 100));
  return queryLedger(
    params.departmentId ?? "",
    params.year ?? 0,
    params.month ?? 0,
    params.quarter ?? 0,
    params.day ?? "",
    params.sort ?? "date.desc",
    page,
    pageSize,
  );
}

async function queryLedger(
  departmentId: string,
  year: number,
  month: number,
  quarter: number,
  day: string,
  sort: LedgerSortKey,
  page: number,
  pageSize: number,
): Promise<LedgerListResult> {
  "use cache";
  cacheTag("reports-ledger");
  cacheTag(`reports-ledger-${departmentId}-${year}-${month}-${quarter}-${day}-${sort}-${page}-${pageSize}`);

  const db = supabaseAdmin();
  const offset = (page - 1) * pageSize;
  const s = SORT_MAP[sort];

  let query = db
    .from("ledger_entries")
    .select(
      `id, entry_date, department_id, car_or_person, item, income, expense,
       note1, note2, sort_order, created_at,
       department:department_id ( name )`,
      { count: "exact" },
    )
    .is("deleted_at", null)
    .order(s.col, { ascending: s.asc })
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (departmentId) query = query.eq("department_id", departmentId);

  const { from, to } = dateRange(year, month, quarter, day);
  if (from) query = query.gte("entry_date", from);
  if (to) query = query.lt("entry_date", to);

  const { data, count } = await query;

  const rows: LedgerEntry[] = (data ?? []).map((r) => {
    const deptRaw = r.department as
      | { name: string | null }
      | { name: string | null }[]
      | null;
    const dept = Array.isArray(deptRaw) ? deptRaw[0] : deptRaw;
    return {
      id: r.id as string,
      entryDate: r.entry_date as string,
      departmentId: r.department_id as string,
      departmentName: dept?.name ?? null,
      carOrPerson: (r.car_or_person as string | null) ?? null,
      item: r.item as string,
      income: Number(r.income ?? 0),
      expense: Number(r.expense ?? 0),
      note1: (r.note1 as string | null) ?? null,
      note2: (r.note2 as string | null) ?? null,
      sortOrder: Number(r.sort_order ?? 0),
      createdAt: r.created_at as string,
    };
  });

  // 計算總和（取所有符合條件的，不只本頁）
  const { sumIncome, sumExpense } = await aggregateSums(
    departmentId,
    year,
    month,
    quarter,
    day,
  );

  return {
    rows,
    total: count ?? rows.length,
    totalIncome: sumIncome,
    totalExpense: sumExpense,
    page,
    pageSize,
  };
}

async function aggregateSums(
  departmentId: string,
  year: number,
  month: number,
  quarter: number,
  day: string,
): Promise<{ sumIncome: number; sumExpense: number }> {
  const db = supabaseAdmin();
  let q = db
    .from("ledger_entries")
    .select("income, expense")
    .is("deleted_at", null);
  if (departmentId) q = q.eq("department_id", departmentId);

  const { from, to } = dateRange(year, month, quarter, day);
  if (from) q = q.gte("entry_date", from);
  if (to) q = q.lt("entry_date", to);

  const { data } = await q;
  let sumIncome = 0;
  let sumExpense = 0;
  for (const r of data ?? []) {
    sumIncome += Number(r.income ?? 0);
    sumExpense += Number(r.expense ?? 0);
  }
  return { sumIncome, sumExpense };
}

function dateRange(
  year: number,
  month: number,
  quarter: number,
  day = "",
): { from: string | null; to: string | null } {
  // 指定單一日期時優先：只取當天（[day, 隔天)）
  if (/^\d{4}-\d{2}-\d{2}$/u.test(day)) {
    return { from: day, to: addOneDayISO(day) };
  }
  if (year && month) {
    const y = year;
    const m = month;
    const from = `${y}-${pad(m)}-01`;
    const next = m === 12 ? { y: y + 1, m: 1 } : { y, m: m + 1 };
    const to = `${next.y}-${pad(next.m)}-01`;
    return { from, to };
  }
  if (year && quarter) {
    const startMonth = (quarter - 1) * 3 + 1;
    const endMonth = startMonth + 3;
    const from = `${year}-${pad(startMonth)}-01`;
    const next = endMonth > 12 ? { y: year + 1, m: 1 } : { y: year, m: endMonth };
    const to = `${next.y}-${pad(next.m)}-01`;
    return { from, to };
  }
  if (year) {
    return { from: `${year}-01-01`, to: `${year + 1}-01-01` };
  }
  return { from: null, to: null };
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

/** ISO 日期 +1 天（以 UTC 計算，純日期不受時區影響）。 */
function addOneDayISO(iso: string): string {
  return new Date(Date.parse(`${iso}T00:00:00Z`) + 86400000)
    .toISOString()
    .slice(0, 10);
}

// ──────────────────────────────────────────────────────────────
// 聚合查詢（月報表、季報表、年報表）
// ──────────────────────────────────────────────────────────────

export type GroupBy = "month" | "quarter" | "year";

export type LedgerAggregateRow = {
  key: string; // "2026-05" / "2026-Q2" / "2026"
  label: string;
  income: number;
  expense: number;
  net: number;
};

export async function aggregateLedger(params: {
  groupBy: GroupBy;
  year?: number;
  departmentId?: string;
}): Promise<LedgerAggregateRow[]> {
  return aggregate(params.groupBy, params.year ?? 0, params.departmentId ?? "");
}

async function aggregate(
  groupBy: GroupBy,
  year: number,
  departmentId: string,
): Promise<LedgerAggregateRow[]> {
  "use cache";
  cacheTag("reports-ledger");
  cacheTag(`reports-agg-${groupBy}-${year}-${departmentId}`);

  const db = supabaseAdmin();
  let q = db
    .from("ledger_entries")
    .select("entry_date, income, expense")
    .is("deleted_at", null)
    .order("entry_date", { ascending: false })
    .limit(20000);

  if (departmentId) q = q.eq("department_id", departmentId);

  if (year && groupBy !== "year") {
    q = q.gte("entry_date", `${year}-01-01`).lt("entry_date", `${year + 1}-01-01`);
  }

  const { data } = await q;
  const buckets = new Map<string, LedgerAggregateRow>();

  for (const r of data ?? []) {
    const d = new Date(r.entry_date as string);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const qtr = Math.floor((m - 1) / 3) + 1;

    let key: string;
    let label: string;
    if (groupBy === "month") {
      key = `${y}-${pad(m)}`;
      label = `${y} 年 ${m} 月`;
    } else if (groupBy === "quarter") {
      key = `${y}-Q${qtr}`;
      label = `${y} 年 第 ${qtr} 季`;
    } else {
      key = `${y}`;
      label = `${y} 年`;
    }

    const cur = buckets.get(key) ?? { key, label, income: 0, expense: 0, net: 0 };
    cur.income += Number(r.income ?? 0);
    cur.expense += Number(r.expense ?? 0);
    cur.net = cur.income - cur.expense;
    buckets.set(key, cur);
  }

  return Array.from(buckets.values()).sort((a, b) => (a.key < b.key ? 1 : -1));
}

// ──────────────────────────────────────────────────────────────
// 篩選列年份下拉：回傳有資料的年份（由新到舊）。無資料回空陣列。
// ──────────────────────────────────────────────────────────────

export async function listLedgerYears(): Promise<number[]> {
  "use cache";
  cacheTag("reports-ledger");

  const db = supabaseAdmin();
  const [oldest, newest] = await Promise.all([
    db
      .from("ledger_entries")
      .select("entry_date")
      .is("deleted_at", null)
      .order("entry_date", { ascending: true })
      .limit(1),
    db
      .from("ledger_entries")
      .select("entry_date")
      .is("deleted_at", null)
      .order("entry_date", { ascending: false })
      .limit(1),
  ]);

  const minRow = oldest.data?.[0]?.entry_date as string | undefined;
  const maxRow = newest.data?.[0]?.entry_date as string | undefined;
  if (!minRow || !maxRow) return [];

  const minY = new Date(minRow).getFullYear();
  const maxY = new Date(maxRow).getFullYear();
  const years: number[] = [];
  for (let y = maxY; y >= minY; y--) years.push(y);
  return years;
}

// ──────────────────────────────────────────────────────────────
// 單一期間報表：整頁聚焦選定的月／季／年。
// 折線（與下方表格共用同一組 series）依 scope 自然分：月→每日；季→每半月；年→每月。
// 另回傳該期間的部門收入／支出占比與合計。
// 呼叫端務必傳入明確的 year/month/quarter（預設當期由頁面層解析），避免「當期」被烘進快取。
// ──────────────────────────────────────────────────────────────

export type ReportScope = "month" | "quarter" | "year";

export type PeriodReport = {
  scope: ReportScope;
  periodLabel: string; // "2026 年 6 月" / "2026 年 第 2 季" / "2026 年"
  series: LedgerAggregateRow[]; // 月→每日（key=YYYY-MM-DD）；季→每半月（key=YYYY-MM-H1/H2）；年→每月（key=YYYY-MM）
  breakdown: DepartmentBreakdown;
  totalIncome: number;
  totalExpense: number;
};

export async function getPeriodReport(params: {
  scope: ReportScope;
  year: number;
  month?: number;
  quarter?: number;
  departmentId?: string;
}): Promise<PeriodReport> {
  return periodReport(
    params.scope,
    params.year,
    params.month ?? 0,
    params.quarter ?? 0,
    params.departmentId ?? "",
  );
}

async function periodReport(
  scope: ReportScope,
  year: number,
  month: number,
  quarter: number,
  departmentId: string,
): Promise<PeriodReport> {
  "use cache";
  cacheTag("reports-ledger");
  cacheTag(
    `reports-period-${scope}-${year}-${month}-${quarter}-${departmentId}`,
  );

  // 期間視窗 [from, to)；reuse 既有 dateRange（月：year+month；季：year+quarter；年：僅 year）
  const { from, to } = dateRange(
    year,
    scope === "month" ? month : 0,
    scope === "quarter" ? quarter : 0,
  );

  const db = supabaseAdmin();
  let q = db
    .from("ledger_entries")
    .select(
      `entry_date, income, expense, department_id,
       department:department_id ( name )`,
    )
    .is("deleted_at", null)
    .limit(20000);
  if (from) q = q.gte("entry_date", from);
  if (to) q = q.lt("entry_date", to);
  if (departmentId) q = q.eq("department_id", departmentId);

  const { data } = await q;
  const rows: DeptRow[] = (data ?? []).map((r) => {
    const deptRaw = r.department as
      | { name: string | null }
      | { name: string | null }[]
      | null;
    const dept = Array.isArray(deptRaw) ? deptRaw[0] : deptRaw;
    return {
      entry_date: r.entry_date as string,
      income: Number(r.income ?? 0),
      expense: Number(r.expense ?? 0),
      department_id: r.department_id as string,
      name: dept?.name ?? null,
    };
  });

  const series = new Map<string, LedgerAggregateRow>();
  let totalIncome = 0;
  let totalExpense = 0;
  for (const r of rows) {
    const d = new Date(r.entry_date);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const day = d.getDate();
    totalIncome += r.income;
    totalExpense += r.expense;
    if (scope === "month") {
      bump(
        series,
        `${y}-${pad(m)}-${pad(day)}`,
        `${m}/${day}`,
        r.income,
        r.expense,
      );
    } else if (scope === "quarter") {
      // 季報表：每半個月一點（上半月 1–15、下半月 16～月底，一季最多 6 點）
      const half = day <= 15 ? 1 : 2;
      bump(
        series,
        `${y}-${pad(m)}-H${half}`, // 例 2026-05-H1 / 2026-05-H2，字典序可正確排序
        `${m} 月${half === 1 ? "上" : "下"}`,
        r.income,
        r.expense,
      );
    } else {
      bump(series, `${y}-${pad(m)}`, `${m} 月`, r.income, r.expense);
    }
  }

  const periodLabel =
    scope === "month"
      ? `${year} 年 ${month} 月`
      : scope === "quarter"
        ? `${year} 年 第 ${quarter} 季`
        : `${year} 年`;

  return {
    scope,
    periodLabel,
    series: sortAsc(series),
    breakdown: rollup(rows, periodLabel),
    totalIncome,
    totalExpense,
  };
}

function bump(
  map: Map<string, LedgerAggregateRow>,
  key: string,
  label: string,
  income: number,
  expense: number,
): void {
  const cur = map.get(key) ?? { key, label, income: 0, expense: 0, net: 0 };
  cur.income += income;
  cur.expense += expense;
  cur.net = cur.income - cur.expense;
  map.set(key, cur);
}

// 由舊到新（X 軸由左至右遞增）；key 格式皆可直接字典序排序
function sortAsc(map: Map<string, LedgerAggregateRow>): LedgerAggregateRow[] {
  return Array.from(map.values()).sort((a, b) => (a.key < b.key ? -1 : 1));
}

// ──────────────────────────────────────────────────────────────
// 日報表用：依「部門 + 年 + 月」篩選的部門收入／支出占比（圓餅圖）。
// 與 listLedger 同一組篩選；占比需全量彙總，不能只用分頁後的 rows。
// ──────────────────────────────────────────────────────────────

export async function getLedgerDeptBreakdown(params: {
  departmentId?: string;
  year?: number;
  month?: number;
  day?: string;
}): Promise<DepartmentBreakdown> {
  return ledgerDeptBreakdown(
    params.departmentId ?? "",
    params.year ?? 0,
    params.month ?? 0,
    params.day ?? "",
  );
}

async function ledgerDeptBreakdown(
  departmentId: string,
  year: number,
  month: number,
  day: string,
): Promise<DepartmentBreakdown> {
  "use cache";
  cacheTag("reports-ledger");
  cacheTag(`reports-ledgerbreak-${departmentId}-${year}-${month}-${day}`);

  const { from, to } = dateRange(year, month, 0, day);

  const db = supabaseAdmin();
  let q = db
    .from("ledger_entries")
    .select(
      `entry_date, income, expense, department_id,
       department:department_id ( name )`,
    )
    .is("deleted_at", null)
    .limit(20000);
  if (from) q = q.gte("entry_date", from);
  if (to) q = q.lt("entry_date", to);
  if (departmentId) q = q.eq("department_id", departmentId);

  const { data } = await q;
  const rows: DeptRow[] = (data ?? []).map((r) => {
    const deptRaw = r.department as
      | { name: string | null }
      | { name: string | null }[]
      | null;
    const dept = Array.isArray(deptRaw) ? deptRaw[0] : deptRaw;
    return {
      entry_date: r.entry_date as string,
      income: Number(r.income ?? 0),
      expense: Number(r.expense ?? 0),
      department_id: r.department_id as string,
      name: dept?.name ?? null,
    };
  });

  const periodLabel =
    year && month
      ? `${year} 年 ${month} 月`
      : year
        ? `${year} 年`
        : "全部期間";

  return rollup(rows, periodLabel);
}

// ──────────────────────────────────────────────────────────────
// 部門占比（圓餅圖）型別與加總工具
// ──────────────────────────────────────────────────────────────

export type DeptSlice = {
  departmentId: string;
  name: string;
  value: number;
};

export type DepartmentBreakdown = {
  income: DeptSlice[];
  expense: DeptSlice[];
  periodLabel: string;
};

type DeptRow = {
  entry_date: string;
  income: number;
  expense: number;
  department_id: string;
  name: string | null;
};

// 將一組明細依部門加總成收入／支出兩份切片（濾掉 0、由大到小）
function rollup(rows: DeptRow[], periodLabel: string): DepartmentBreakdown {
  const inc = new Map<string, DeptSlice>();
  const exp = new Map<string, DeptSlice>();

  for (const r of rows) {
    const name = r.name ?? "（未命名部門）";
    if (r.income) {
      const cur = inc.get(r.department_id) ?? {
        departmentId: r.department_id,
        name,
        value: 0,
      };
      cur.value += r.income;
      inc.set(r.department_id, cur);
    }
    if (r.expense) {
      const cur = exp.get(r.department_id) ?? {
        departmentId: r.department_id,
        name,
        value: 0,
      };
      cur.value += r.expense;
      exp.set(r.department_id, cur);
    }
  }

  const byValueDesc = (a: DeptSlice, b: DeptSlice) => b.value - a.value;
  return {
    income: Array.from(inc.values()).sort(byValueDesc),
    expense: Array.from(exp.values()).sort(byValueDesc),
    periodLabel,
  };
}
