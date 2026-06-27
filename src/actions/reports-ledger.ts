"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { getCurrentAdmin } from "@/lib/admin-session";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { splitAmount } from "@/lib/ledger-amount";

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
  // 單一帶正負號金額：正＝收入、負＝支出，儲存時再拆回 income / expense
  amount: z.coerce.number().default(0),
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
    amount: formData.get("amount") || 0,
    note1: formData.get("note1"),
    note2: formData.get("note2"),
  });
  if (!parsed.success) {
    return { ok: false, fieldErrors: flatten(parsed.error) };
  }
  const d = parsed.data;
  const { income, expense } = splitAmount(d.amount);

  const db = supabaseAdmin();
  const { error } = await db.from("ledger_entries").insert({
    entry_date: d.entryDate,
    department_id: d.departmentId,
    car_or_person: d.carOrPerson || null,
    item: d.item,
    income,
    expense,
    note1: d.note1 || null,
    note2: d.note2 || null,
    created_by: adminId,
  });
  if (error) return { ok: false, error: error.message };

  updateTag("reports-ledger");
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
    amount: formData.get("amount") || 0,
    note1: formData.get("note1"),
    note2: formData.get("note2"),
  });
  if (!parsed.success) {
    return { ok: false, fieldErrors: flatten(parsed.error) };
  }
  const d = parsed.data;
  const { income, expense } = splitAmount(d.amount);

  const db = supabaseAdmin();
  const { error } = await db
    .from("ledger_entries")
    .update({
      entry_date: d.entryDate,
      department_id: d.departmentId,
      car_or_person: d.carOrPerson || null,
      item: d.item,
      income,
      expense,
      note1: d.note1 || null,
      note2: d.note2 || null,
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  updateTag("reports-ledger");
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
  amount?: number; // 帶正負號：正＝收入、負＝支出
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
      amount: r.amount ?? 0,
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
  const payload = parsed.data.map((d) => {
    const { income, expense } = splitAmount(d.amount);
    return {
      entry_date: d.entryDate,
      department_id: d.departmentId,
      car_or_person: d.carOrPerson || null,
      item: d.item,
      income,
      expense,
      note1: d.note1 || null,
      note2: d.note2 || null,
      created_by: adminId,
    };
  });

  const { error, data } = await db.from("ledger_entries").insert(payload).select("id");
  if (error) return { ok: false, error: error.message };

  updateTag("reports-ledger");
  return { ok: true, inserted: data?.length ?? rows.length };
}

// ──────────────────────────────────────────────────────────────
// 可編輯網格：一次儲存新增 / 修改 / 刪除
// ──────────────────────────────────────────────────────────────

export type GridUpsertRow = { id?: string } & BatchRow;

export async function saveLedgerGridAction(input: {
  upserts: GridUpsertRow[];
  deletes: string[];
}): Promise<
  | { ok: true; inserted: number; updated: number; deleted: number }
  | { ok: false; error: string }
> {
  const adminId = await requireAdminId();
  const upserts = input.upserts ?? [];
  const deletes = input.deletes ?? [];

  if (upserts.length === 0 && deletes.length === 0) {
    return { ok: false, error: "沒有任何變更需要儲存" };
  }
  if (upserts.length > 500) return { ok: false, error: "一次最多只能存 500 列，請分批" };

  // 逐列驗證（沿用 EntrySchema，錯誤訊息已是中文）
  const validated: { id?: string; row: z.infer<typeof EntrySchema> }[] = [];
  for (let i = 0; i < upserts.length; i++) {
    const u = upserts[i];
    const parsed = EntrySchema.safeParse({
      entryDate: u.entryDate,
      departmentId: u.departmentId,
      carOrPerson: u.carOrPerson ?? "",
      item: u.item,
      amount: u.amount ?? 0,
      note1: u.note1 ?? "",
      note2: u.note2 ?? "",
    });
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "這列資料有點問題";
      return { ok: false, error: `第 ${i + 1} 列：${msg}` };
    }
    validated.push({ id: u.id, row: parsed.data });
  }

  const db = supabaseAdmin();
  const dbFail = "儲存時遇到狀況，請稍後再試一次";

  // 新增（無 id）一次寫入
  const toInsert = validated.filter((v) => !v.id);
  let inserted = 0;
  if (toInsert.length) {
    const payload = toInsert.map((v) => {
      const { income, expense } = splitAmount(v.row.amount);
      return {
        entry_date: v.row.entryDate,
        department_id: v.row.departmentId,
        car_or_person: v.row.carOrPerson || null,
        item: v.row.item,
        income,
        expense,
        note1: v.row.note1 || null,
        note2: v.row.note2 || null,
        created_by: adminId,
      };
    });
    const { data, error } = await db
      .from("ledger_entries")
      .insert(payload)
      .select("id");
    if (error) {
      console.error("[saveLedgerGrid] insert", error);
      return { ok: false, error: dbFail };
    }
    inserted = data?.length ?? toInsert.length;
  }

  // 修改（有 id）逐筆更新
  const toUpdate = validated.filter((v) => v.id);
  let updated = 0;
  for (const v of toUpdate) {
    const { income, expense } = splitAmount(v.row.amount);
    const { error } = await db
      .from("ledger_entries")
      .update({
        entry_date: v.row.entryDate,
        department_id: v.row.departmentId,
        car_or_person: v.row.carOrPerson || null,
        item: v.row.item,
        income,
        expense,
        note1: v.row.note1 || null,
        note2: v.row.note2 || null,
      })
      .eq("id", v.id!);
    if (error) {
      console.error("[saveLedgerGrid] update", error);
      return { ok: false, error: dbFail };
    }
    updated++;
  }

  // 刪除（軟刪除）
  let deleted = 0;
  if (deletes.length) {
    const { error } = await db
      .from("ledger_entries")
      .update({ deleted_at: new Date().toISOString() })
      .in("id", deletes);
    if (error) {
      console.error("[saveLedgerGrid] delete", error);
      return { ok: false, error: dbFail };
    }
    deleted = deletes.length;
  }

  updateTag("reports-ledger");
  return { ok: true, inserted, updated, deleted };
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

  updateTag("reports-ledger");
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
    "金額",
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
      // 帶正負號金額：正＝收入、負＝支出
      (Number(r.income) || 0) - (Number(r.expense) || 0),
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
