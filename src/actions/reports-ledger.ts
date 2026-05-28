"use server";

import { revalidateTag } from "next/cache";
import { z } from "zod";
import { getCurrentAdmin } from "@/lib/admin-session";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type LedgerFormState =
  | { ok: false; error?: string; fieldErrors?: Record<string, string> }
  | { ok: true; message: string };

async function requireAdminId(): Promise<string> {
  const a = await getCurrentAdmin();
  if (!a?.adminId) throw new Error("Unauthorized");
  return a.adminId;
}

function flatten(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const k = issue.path[0]?.toString() ?? "_";
    if (!out[k]) out[k] = issue.message;
  }
  return out;
}

const EntrySchema = z.object({
  entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/u, "日期格式錯誤"),
  departmentId: z.string().uuid("請選擇部門"),
  carOrPerson: z.string().trim().max(50).optional().default(""),
  item: z.string().trim().min(1, "請輸入項目").max(100),
  income: z.coerce.number().min(0, "收入請填正數").default(0),
  expense: z.coerce.number().min(0, "支出請填正數").default(0),
  note1: z.string().trim().max(200).optional().default(""),
  note2: z.string().trim().max(200).optional().default(""),
});

export async function createLedgerEntryAction(
  _prev: LedgerFormState | null,
  formData: FormData,
): Promise<LedgerFormState> {
  const adminId = await requireAdminId();
  const parsed = EntrySchema.safeParse({
    entryDate: formData.get("entryDate"),
    departmentId: formData.get("departmentId"),
    carOrPerson: formData.get("carOrPerson"),
    item: formData.get("item"),
    income: formData.get("income") || 0,
    expense: formData.get("expense") || 0,
    note1: formData.get("note1"),
    note2: formData.get("note2"),
  });
  if (!parsed.success) {
    return { ok: false, fieldErrors: flatten(parsed.error) };
  }
  const d = parsed.data;

  const db = supabaseAdmin();
  const { error } = await db.from("ledger_entries").insert({
    entry_date: d.entryDate,
    department_id: d.departmentId,
    car_or_person: d.carOrPerson || null,
    item: d.item,
    income: d.income,
    expense: d.expense,
    note1: d.note1 || null,
    note2: d.note2 || null,
    created_by: adminId,
  });
  if (error) return { ok: false, error: error.message };

  revalidateTag("reports-ledger", "max");
  return { ok: true, message: "已新增記錄" };
}

export async function updateLedgerEntryAction(
  id: string,
  _prev: LedgerFormState | null,
  formData: FormData,
): Promise<LedgerFormState> {
  await requireAdminId();
  const parsed = EntrySchema.safeParse({
    entryDate: formData.get("entryDate"),
    departmentId: formData.get("departmentId"),
    carOrPerson: formData.get("carOrPerson"),
    item: formData.get("item"),
    income: formData.get("income") || 0,
    expense: formData.get("expense") || 0,
    note1: formData.get("note1"),
    note2: formData.get("note2"),
  });
  if (!parsed.success) {
    return { ok: false, fieldErrors: flatten(parsed.error) };
  }
  const d = parsed.data;

  const db = supabaseAdmin();
  const { error } = await db
    .from("ledger_entries")
    .update({
      entry_date: d.entryDate,
      department_id: d.departmentId,
      car_or_person: d.carOrPerson || null,
      item: d.item,
      income: d.income,
      expense: d.expense,
      note1: d.note1 || null,
      note2: d.note2 || null,
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidateTag("reports-ledger", "max");
  return { ok: true, message: "已更新" };
}

// ──────────────────────────────────────────────────────────────
// 批量寫入（新增日報表用）
// ──────────────────────────────────────────────────────────────

export type BatchRow = {
  entryDate: string;
  departmentId: string;
  carOrPerson?: string;
  item: string;
  income?: number;
  expense?: number;
  note1?: string;
  note2?: string;
};

export async function createLedgerBatchAction(
  rows: BatchRow[],
): Promise<{ ok: true; inserted: number } | { ok: false; error: string }> {
  const adminId = await requireAdminId();
  if (!rows.length) return { ok: false, error: "沒有可送出的列" };
  if (rows.length > 500) return { ok: false, error: "單次最多 500 列" };

  // 驗證每列
  const BatchSchema = z.array(EntrySchema).max(500);
  const parsed = BatchSchema.safeParse(
    rows.map((r) => ({
      entryDate: r.entryDate,
      departmentId: r.departmentId,
      carOrPerson: r.carOrPerson ?? "",
      item: r.item,
      income: r.income ?? 0,
      expense: r.expense ?? 0,
      note1: r.note1 ?? "",
      note2: r.note2 ?? "",
    })),
  );
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const path = first?.path.join(".") ?? "?";
    return { ok: false, error: `第 ${path} 欄錯誤：${first?.message}` };
  }

  const db = supabaseAdmin();
  const payload = parsed.data.map((d) => ({
    entry_date: d.entryDate,
    department_id: d.departmentId,
    car_or_person: d.carOrPerson || null,
    item: d.item,
    income: d.income,
    expense: d.expense,
    note1: d.note1 || null,
    note2: d.note2 || null,
    created_by: adminId,
  }));

  const { error, data } = await db.from("ledger_entries").insert(payload).select("id");
  if (error) return { ok: false, error: error.message };

  revalidateTag("reports-ledger", "max");
  return { ok: true, inserted: data?.length ?? rows.length };
}

// ──────────────────────────────────────────────────────────────
// 批量軟刪除
// ──────────────────────────────────────────────────────────────

export async function softDeleteLedgerEntriesAction(
  ids: string[],
): Promise<{ ok: boolean; error?: string }> {
  await requireAdminId();
  if (!ids.length) return { ok: false, error: "未選擇任何記錄" };

  const db = supabaseAdmin();
  const { error } = await db
    .from("ledger_entries")
    .update({ deleted_at: new Date().toISOString() })
    .in("id", ids);
  if (error) return { ok: false, error: error.message };

  revalidateTag("reports-ledger", "max");
  return { ok: true };
}

// ──────────────────────────────────────────────────────────────
// CSV 匯出
// ──────────────────────────────────────────────────────────────

export async function exportLedgerCsvAction(filters: {
  departmentId?: string;
  year?: number;
  month?: number;
  quarter?: number;
}): Promise<{ ok: true; csv: string; filename: string } | { ok: false; error: string }> {
  await requireAdminId();
  const db = supabaseAdmin();

  let q = db
    .from("ledger_entries")
    .select(
      `entry_date, car_or_person, item, income, expense, note1, note2,
       department:department_id ( name )`,
    )
    .is("deleted_at", null)
    .order("entry_date", { ascending: false })
    .limit(20000);

  if (filters.departmentId) q = q.eq("department_id", filters.departmentId);

  const { from, to } = dateRange(
    filters.year ?? 0,
    filters.month ?? 0,
    filters.quarter ?? 0,
  );
  if (from) q = q.gte("entry_date", from);
  if (to) q = q.lt("entry_date", to);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };

  const head = [
    "日期",
    "部門名稱",
    "車號/人名",
    "項目",
    "收入",
    "支出",
    "備註1",
    "備註2",
  ];
  const lines = [head.join(",")];
  for (const r of data ?? []) {
    const deptRaw = r.department as
      | { name: string | null }
      | { name: string | null }[]
      | null;
    const dept = Array.isArray(deptRaw) ? deptRaw[0] : deptRaw;
    const row = [
      r.entry_date,
      dept?.name ?? "",
      r.car_or_person ?? "",
      r.item,
      r.income,
      r.expense,
      r.note1 ?? "",
      r.note2 ?? "",
    ].map(csvEscape);
    lines.push(row.join(","));
  }
  const csv = "﻿" + lines.join("\n");
  const filename = `ledger_${new Date().toISOString().slice(0, 10)}.csv`;
  return { ok: true, csv, filename };
}

function csvEscape(v: unknown): string {
  if (v == null) return "";
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function dateRange(
  year: number,
  month: number,
  quarter: number,
): { from: string | null; to: string | null } {
  if (year && month) {
    const m = month;
    const from = `${year}-${pad(m)}-01`;
    const next = m === 12 ? { y: year + 1, m: 1 } : { y: year, m: m + 1 };
    return { from, to: `${next.y}-${pad(next.m)}-01` };
  }
  if (year && quarter) {
    const startMonth = (quarter - 1) * 3 + 1;
    const endMonth = startMonth + 3;
    const from = `${year}-${pad(startMonth)}-01`;
    const next = endMonth > 12 ? { y: year + 1, m: 1 } : { y: year, m: endMonth };
    return { from, to: `${next.y}-${pad(next.m)}-01` };
  }
  if (year) return { from: `${year}-01-01`, to: `${year + 1}-01-01` };
  return { from: null, to: null };
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}
