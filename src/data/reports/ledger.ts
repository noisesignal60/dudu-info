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
  sort: LedgerSortKey,
  page: number,
  pageSize: number,
): Promise<LedgerListResult> {
  "use cache";
  cacheTag("reports-ledger");
  cacheTag(`reports-ledger-${departmentId}-${year}-${month}-${quarter}-${sort}-${page}-${pageSize}`);

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

  const { from, to } = dateRange(year, month, quarter);
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
): Promise<{ sumIncome: number; sumExpense: number }> {
  const db = supabaseAdmin();
  let q = db
    .from("ledger_entries")
    .select("income, expense")
    .is("deleted_at", null);
  if (departmentId) q = q.eq("department_id", departmentId);

  const { from, to } = dateRange(year, month, quarter);
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
): { from: string | null; to: string | null } {
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
