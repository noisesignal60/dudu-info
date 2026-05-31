"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { getCurrentAdmin } from "@/lib/admin-session";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { searchMembersForPicker, type MemberOption } from "@/data/admin/transactions";

export type TxFormState =
  | { ok: false; error?: string; fieldErrors?: Record<string, string> }
  | { ok: true; message: string };

async function requireAdminId(): Promise<string> {
  const admin = await getCurrentAdmin();
  if (!admin?.adminId) throw new Error("Unauthorized");
  return admin.adminId;
}

function flatten(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path[0]?.toString() ?? "_";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

function invalidateForMember(memberId: string) {
  updateTag("admin-transactions");
  updateTag("admin-stats");
  updateTag("admin-activity");
  updateTag(`tx-${memberId}`);
  updateTag(`stats-${memberId}`);
  updateTag(`admin-member-${memberId}`);
}

// ──────────────────────────────────────────────────────────────
// 1. 創建新交易（分潤 / 手動調整）— amount 為正
// ──────────────────────────────────────────────────────────────

const CreateGeneralSchema = z.object({
  memberId: z.string().uuid("請選擇會員"),
  amount: z.coerce.number().refine((n) => n !== 0, "金額不可為 0"),
  description: z.string().trim().max(300).optional().default(""),
  kind: z.enum(["commission", "adjust"]).default("commission"),
});

export async function createGeneralTransactionAction(
  _prev: TxFormState | null,
  formData: FormData,
): Promise<TxFormState> {
  const adminId = await requireAdminId();
  const parsed = CreateGeneralSchema.safeParse({
    memberId: formData.get("memberId"),
    amount: formData.get("amount"),
    description: formData.get("description"),
    kind: formData.get("kind") ?? "commission",
  });
  if (!parsed.success) {
    return { ok: false, fieldErrors: flatten(parsed.error) };
  }
  const { memberId, amount, description, kind } = parsed.data;
  const db = supabaseAdmin();

  const title = kind === "commission" ? "分潤" : "手動調整";
  const { error } = await db.from("transactions").insert({
    member_id: memberId,
    kind,
    amount,
    title,
    description: description || null,
    created_by: adminId,
  });
  if (error) return { ok: false, error: error.message };

  // 同步調整 balance：正數 → total_earned + pending
  const { data: bal } = await db
    .from("balances")
    .select("total_earned, pending")
    .eq("member_id", memberId)
    .single();
  if (bal) {
    await db
      .from("balances")
      .update({
        total_earned: Number(bal.total_earned) + amount,
        pending: Number(bal.pending) + amount,
      })
      .eq("member_id", memberId);
  }

  invalidateForMember(memberId);
  return { ok: true, message: "已建立交易並更新餘額" };
}

// ──────────────────────────────────────────────────────────────
// 2. 手動提領（admin 直接扣 pending → withdrawn）
// ──────────────────────────────────────────────────────────────

const ManualWithdrawalSchema = z.object({
  memberId: z.string().uuid("請選擇會員"),
  amount: z.coerce.number().positive("提領金額需大於 0"),
  note: z.string().trim().max(300).optional().default(""),
});

export async function manualWithdrawalAction(
  _prev: TxFormState | null,
  formData: FormData,
): Promise<TxFormState> {
  const adminId = await requireAdminId();
  const parsed = ManualWithdrawalSchema.safeParse({
    memberId: formData.get("memberId"),
    amount: formData.get("amount"),
    note: formData.get("note"),
  });
  if (!parsed.success) {
    return { ok: false, fieldErrors: flatten(parsed.error) };
  }
  const { memberId, amount, note } = parsed.data;
  const db = supabaseAdmin();

  const { data: bal } = await db
    .from("balances")
    .select("pending, withdrawn")
    .eq("member_id", memberId)
    .single();
  if (!bal) return { ok: false, error: "找不到會員餘額" };
  if (Number(bal.pending) < amount) {
    return {
      ok: false,
      fieldErrors: { amount: "超過會員待領取金額" },
    };
  }

  await db
    .from("balances")
    .update({
      pending: Number(bal.pending) - amount,
      withdrawn: Number(bal.withdrawn) + amount,
    })
    .eq("member_id", memberId);

  const { error } = await db.from("transactions").insert({
    member_id: memberId,
    kind: "withdrawal",
    amount: -amount,
    title: "手動提領",
    description: note || null,
    created_by: adminId,
  });
  if (error) return { ok: false, error: error.message };

  invalidateForMember(memberId);
  return { ok: true, message: "已記錄手動提領" };
}

// ──────────────────────────────────────────────────────────────
// 3. 新帳號獎勵
// ──────────────────────────────────────────────────────────────

const RewardSchema = z.object({
  memberId: z.string().uuid("請選擇新用戶"),
  amount: z.coerce.number().positive("獎勵金額需大於 0"),
  description: z.string().trim().max(300).optional().default(""),
});

export async function newMemberRewardAction(
  _prev: TxFormState | null,
  formData: FormData,
): Promise<TxFormState> {
  const adminId = await requireAdminId();
  const parsed = RewardSchema.safeParse({
    memberId: formData.get("memberId"),
    amount: formData.get("amount"),
    description: formData.get("description"),
  });
  if (!parsed.success) {
    return { ok: false, fieldErrors: flatten(parsed.error) };
  }
  const { memberId, amount, description } = parsed.data;
  const db = supabaseAdmin();

  const { error } = await db.from("transactions").insert({
    member_id: memberId,
    kind: "reward",
    amount,
    title: "新帳號獎勵",
    description: description || null,
    created_by: adminId,
  });
  if (error) return { ok: false, error: error.message };

  const { data: bal } = await db
    .from("balances")
    .select("total_earned, pending")
    .eq("member_id", memberId)
    .single();
  if (bal) {
    await db
      .from("balances")
      .update({
        total_earned: Number(bal.total_earned) + amount,
        pending: Number(bal.pending) + amount,
      })
      .eq("member_id", memberId);
  }

  invalidateForMember(memberId);
  return { ok: true, message: "已發放新帳號獎勵" };
}

// ──────────────────────────────────────────────────────────────
// 4. 編輯交易（只能改 amount 與 description，不變動 kind/balance）
//    為避免 balance 不一致，編輯不改 amount 對 balance 的影響
//    若 amount 變動 → 需要 admin 自行用「手動調整」修正
// ──────────────────────────────────────────────────────────────

const EditTxSchema = z.object({
  amount: z.coerce.number().refine((n) => n !== 0, "金額不可為 0"),
  description: z.string().trim().max(300).optional().default(""),
});

export async function editTransactionAction(
  txId: string,
  _prev: TxFormState | null,
  formData: FormData,
): Promise<TxFormState> {
  await requireAdminId();
  const parsed = EditTxSchema.safeParse({
    amount: formData.get("amount"),
    description: formData.get("description"),
  });
  if (!parsed.success) {
    return { ok: false, fieldErrors: flatten(parsed.error) };
  }

  const db = supabaseAdmin();
  const { data: tx } = await db
    .from("transactions")
    .select("id, member_id, amount")
    .eq("id", txId)
    .maybeSingle();
  if (!tx) return { ok: false, error: "找不到此交易" };

  const { error } = await db
    .from("transactions")
    .update({
      amount: parsed.data.amount,
      description: parsed.data.description || null,
    })
    .eq("id", txId);
  if (error) return { ok: false, error: error.message };

  invalidateForMember(tx.member_id as string);
  return {
    ok: true,
    message: "已更新；如金額有變動，請自行用『手動調整』修正餘額",
  };
}

// ──────────────────────────────────────────────────────────────
// 5. Member 搜尋（給 Client combobox）
// ──────────────────────────────────────────────────────────────

export async function searchMembersAction(q: string): Promise<MemberOption[]> {
  await requireAdminId();
  return searchMembersForPicker(q);
}

// ──────────────────────────────────────────────────────────────
// 6. CSV 匯出
// ──────────────────────────────────────────────────────────────

export async function exportTransactionsCsvAction(
  filters: { kind?: string; memberId?: string; from?: string; to?: string },
): Promise<{ ok: true; csv: string; filename: string } | { ok: false; error: string }> {
  await requireAdminId();
  const db = supabaseAdmin();

  let query = db
    .from("transactions")
    .select(
      `id, kind, member_id, title, description, amount, created_at,
       member:member_id ( name, line_display )`,
    )
    .order("created_at", { ascending: false })
    .limit(10000);

  if (filters.kind && filters.kind !== "all") query = query.eq("kind", filters.kind);
  if (filters.memberId) query = query.eq("member_id", filters.memberId);
  if (filters.from) query = query.gte("created_at", filters.from);
  if (filters.to) query = query.lte("created_at", filters.to);

  const { data, error } = await query;
  if (error) return { ok: false, error: error.message };

  const head = ["時間", "類型", "會員", "名目", "金額", "描述"];
  const lines = [head.join(",")];
  for (const r of data ?? []) {
    const memberRaw = r.member as
      | { name: string | null; line_display: string | null }
      | { name: string | null; line_display: string | null }[]
      | null;
    const m = Array.isArray(memberRaw) ? memberRaw[0] : memberRaw;
    const row = [
      r.created_at,
      r.kind,
      m?.name ?? m?.line_display ?? "",
      r.title,
      r.amount,
      (r.description as string | null) ?? "",
    ].map(csvEscape);
    lines.push(row.join(","));
  }
  const csv = "﻿" + lines.join("\n"); // UTF-8 BOM 讓 Excel 不亂碼
  const filename = `transactions_${new Date().toISOString().slice(0, 10)}.csv`;
  return { ok: true, csv, filename };
}

function csvEscape(v: unknown): string {
  if (v == null) return "";
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
