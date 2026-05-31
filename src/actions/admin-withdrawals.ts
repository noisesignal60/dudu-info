"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { getCurrentAdmin } from "@/lib/admin-session";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type WithdrawalDecisionState =
  | { ok: false; error?: string; fieldErrors?: Record<string, string> }
  | { ok: true; message: string };

const DecisionSchema = z.object({
  adminNote: z.string().trim().max(500).optional().default(""),
});

async function requireAdminId(): Promise<string> {
  const admin = await getCurrentAdmin();
  if (!admin?.adminId) throw new Error("Unauthorized");
  return admin.adminId;
}

async function loadPending(id: string) {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("withdrawals")
    .select("id, member_id, amount, status")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as
    | { id: string; member_id: string; amount: number | string; status: string }
    | null;
}

function invalidate(memberId: string, withdrawalId: string) {
  updateTag("admin-withdrawals");
  updateTag("admin-withdrawal-counts");
  updateTag("admin-stats");
  updateTag("admin-activity");
  updateTag(`admin-withdrawal-${withdrawalId}`);
  updateTag(`stats-${memberId}`);
  updateTag(`wd-${memberId}`);
  updateTag(`tx-${memberId}`);
  updateTag("admin-transactions");
}

export async function approveWithdrawalAction(
  id: string,
  _prev: WithdrawalDecisionState | null,
  formData: FormData,
): Promise<WithdrawalDecisionState> {
  const adminId = await requireAdminId();
  const parsed = DecisionSchema.safeParse({ adminNote: formData.get("adminNote") });
  if (!parsed.success) {
    return { ok: false, error: "備註過長" };
  }

  const wd = await loadPending(id);
  if (!wd) return { ok: false, error: "找不到此提領申請" };
  if (wd.status !== "pending") {
    return { ok: false, error: "此申請已被處理過" };
  }

  const amount = Number(wd.amount);
  const db = supabaseAdmin();

  // 1) 更新 withdrawals
  const { error: updErr } = await db
    .from("withdrawals")
    .update({
      status: "approved",
      admin_note: parsed.data.adminNote || null,
      processed_at: new Date().toISOString(),
      processed_by: adminId,
    })
    .eq("id", id);
  if (updErr) {
    return { ok: false, error: "更新失敗：" + updErr.message };
  }

  // 2) 調整 balances：locked - amount, withdrawn + amount
  const { data: bal } = await db
    .from("balances")
    .select("locked, withdrawn")
    .eq("member_id", wd.member_id)
    .single();
  if (bal) {
    await db
      .from("balances")
      .update({
        locked: Number(bal.locked) - amount,
        withdrawn: Number(bal.withdrawn) + amount,
      })
      .eq("member_id", wd.member_id);
  }

  // 3) 寫入 transactions（kind=withdrawal, amount 為負）
  await db.from("transactions").insert({
    member_id: wd.member_id,
    kind: "withdrawal",
    amount: -amount,
    title: "提領撥款",
    description: parsed.data.adminNote || null,
    ref_id: id,
    created_by: adminId,
  });

  invalidate(wd.member_id, id);
  return { ok: true, message: "已通過提領申請" };
}

export async function rejectWithdrawalAction(
  id: string,
  _prev: WithdrawalDecisionState | null,
  formData: FormData,
): Promise<WithdrawalDecisionState> {
  const adminId = await requireAdminId();
  const parsed = DecisionSchema.safeParse({ adminNote: formData.get("adminNote") });
  if (!parsed.success) {
    return { ok: false, error: "備註過長" };
  }

  const wd = await loadPending(id);
  if (!wd) return { ok: false, error: "找不到此提領申請" };
  if (wd.status !== "pending") {
    return { ok: false, error: "此申請已被處理過" };
  }

  const amount = Number(wd.amount);
  const db = supabaseAdmin();

  const { error: updErr } = await db
    .from("withdrawals")
    .update({
      status: "rejected",
      admin_note: parsed.data.adminNote || null,
      processed_at: new Date().toISOString(),
      processed_by: adminId,
    })
    .eq("id", id);
  if (updErr) {
    return { ok: false, error: "更新失敗：" + updErr.message };
  }

  // 退回 pending：locked - amount, pending + amount
  const { data: bal } = await db
    .from("balances")
    .select("locked, pending")
    .eq("member_id", wd.member_id)
    .single();
  if (bal) {
    await db
      .from("balances")
      .update({
        locked: Number(bal.locked) - amount,
        pending: Number(bal.pending) + amount,
      })
      .eq("member_id", wd.member_id);
  }

  invalidate(wd.member_id, id);
  return { ok: true, message: "已拒絕提領申請，金額已退回待領取" };
}
