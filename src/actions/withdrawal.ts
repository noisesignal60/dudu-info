"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isValidBankCode } from "@/lib/banks";

const MIN_AMOUNT = 100;

const WithdrawalSchema = z.object({
  amount: z.coerce
    .number()
    .min(MIN_AMOUNT, `最低提領金額為 $${MIN_AMOUNT}`)
    .max(10_000_000, "金額過大"),
  bankCode: z
    .string()
    .trim()
    .optional()
    .default("")
    .refine((v) => v === "" || isValidBankCode(v), "請從清單選擇銀行"),
  bankAccount: z.string().trim().optional().default(""),
  note: z.string().trim().max(200).optional().default(""),
});

export type WithdrawalState =
  | { ok: false; fieldErrors?: Record<string, string>; error?: string }
  | { ok: true; message: string };

export async function requestWithdrawalAction(
  _prev: WithdrawalState | null,
  formData: FormData,
): Promise<WithdrawalState> {
  const session = await auth();
  const memberId = session?.user?.memberId;
  if (!memberId) return { ok: false, error: "未登入" };

  const parsed = WithdrawalSchema.safeParse({
    amount: formData.get("amount"),
    bankCode: formData.get("bankCode") ?? "",
    bankAccount: formData.get("bankAccount"),
    note: formData.get("note"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]?.toString() ?? "_";
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, fieldErrors };
  }

  const amount = parsed.data.amount;
  const db = supabaseAdmin();

  // 檢查目前餘額
  const { data: balance } = await db
    .from("balances")
    .select("pending, locked")
    .eq("member_id", memberId)
    .single();
  const pending = Number(balance?.pending ?? 0);
  const locked = Number(balance?.locked ?? 0);

  if (amount > pending) {
    return {
      ok: false,
      fieldErrors: {
        amount: `超過可提領金額：$${pending.toLocaleString("zh-TW")}`,
      },
    };
  }

  // 寫入提領申請
  const { error: insertErr } = await db.from("withdrawals").insert({
    member_id: memberId,
    amount,
    bank_code: parsed.data.bankCode || null,
    bank_account: parsed.data.bankAccount || null,
    note: parsed.data.note || null,
    status: "pending",
  });
  if (insertErr) {
    console.error("[withdrawal] insert error", insertErr);
    return { ok: false, error: "送出申請失敗，請稍後再試" };
  }

  // pending → locked
  await db
    .from("balances")
    .update({
      pending: pending - amount,
      locked: locked + amount,
    })
    .eq("member_id", memberId);

  updateTag(`stats-${memberId}`);
  updateTag(`wd-${memberId}`);

  return { ok: true, message: "提領申請已送出，將於 1–3 個工作日內處理" };
}
