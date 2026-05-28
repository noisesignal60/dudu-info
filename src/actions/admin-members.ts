"use server";

import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentAdmin } from "@/lib/admin-session";
import { supabaseAdmin } from "@/lib/supabase/admin";

const UpdateMemberSchema = z.object({
  name: z.string().trim().max(50).optional().default(""),
  phone: z.string().trim().max(20).optional().default(""),
  email: z.string().trim().max(200).optional().default(""),
  bankHolder: z.string().trim().max(50).optional().default(""),
  bankCode: z.string().trim().max(10).optional().default(""),
  bankAccount: z
    .string()
    .trim()
    .regex(/^\d{10,16}$|^$/u, "銀行帳號格式錯誤")
    .optional()
    .default(""),
});

const UpdateBalanceSchema = z.object({
  totalEarned: z.coerce.number().min(0),
  pending: z.coerce.number().min(0),
  withdrawn: z.coerce.number().min(0),
  // locked 為審核中金額 — 由系統自動維護，admin 不可手動改
});

export type AdminMemberFormState =
  | { ok: false; error?: string; fieldErrors?: Record<string, string> }
  | { ok: true; message: string };

async function requireAdmin(): Promise<{ id: string }> {
  const admin = await getCurrentAdmin();
  if (!admin?.adminId) throw new Error("Unauthorized");
  return { id: admin.adminId };
}

export async function updateMemberBasicAction(
  memberId: string,
  _prev: AdminMemberFormState | null,
  formData: FormData,
): Promise<AdminMemberFormState> {
  await requireAdmin();

  const parsed = UpdateMemberSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    bankHolder: formData.get("bankHolder"),
    bankCode: formData.get("bankCode"),
    bankAccount: formData.get("bankAccount"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]?.toString() ?? "_";
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, fieldErrors };
  }

  const db = supabaseAdmin();
  const { error } = await db
    .from("members")
    .update({
      name: parsed.data.name || null,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      bank_holder: parsed.data.bankHolder || null,
      bank_code: parsed.data.bankCode || null,
      bank_account: parsed.data.bankAccount || null,
    })
    .eq("id", memberId);
  if (error) {
    console.error("[admin-members] update error", error);
    return { ok: false, error: "儲存失敗：" + error.message };
  }

  revalidateTag(`admin-member-${memberId}`, "max");
  revalidateTag(`member-${memberId}`, "max");
  revalidateTag("admin-members", "max");
  return { ok: true, message: "已儲存基本資料" };
}

export async function updateMemberBalanceAction(
  memberId: string,
  _prev: AdminMemberFormState | null,
  formData: FormData,
): Promise<AdminMemberFormState> {
  await requireAdmin();

  const parsed = UpdateBalanceSchema.safeParse({
    totalEarned: formData.get("totalEarned"),
    pending: formData.get("pending"),
    withdrawn: formData.get("withdrawn"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]?.toString() ?? "_";
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, fieldErrors };
  }

  const db = supabaseAdmin();
  const { error } = await db
    .from("balances")
    .update({
      total_earned: parsed.data.totalEarned,
      pending: parsed.data.pending,
      withdrawn: parsed.data.withdrawn,
    })
    .eq("member_id", memberId);
  if (error) {
    console.error("[admin-members] balance update error", error);
    return { ok: false, error: "儲存失敗：" + error.message };
  }

  revalidateTag(`admin-member-${memberId}`, "max");
  revalidateTag(`stats-${memberId}`, "max");
  revalidateTag("admin-stats", "max");
  return { ok: true, message: "已更新餘額" };
}

export async function deleteMemberAction(memberId: string): Promise<void> {
  await requireAdmin();
  const db = supabaseAdmin();
  const { error } = await db.from("members").delete().eq("id", memberId);
  if (error) {
    throw new Error("刪除失敗：" + error.message);
  }
  revalidateTag("admin-members", "max");
  redirect("/admin/members");
}
