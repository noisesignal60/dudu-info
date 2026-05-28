import "server-only";

import { cacheTag } from "next/cache";
import { auth } from "@/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type WithdrawalDTO = {
  id: string;
  amount: number;
  status: "pending" | "approved" | "rejected";
  bankCode: string | null;
  bankAccount: string | null;
  note: string | null;
  adminNote: string | null;
  createdAt: string;
  processedAt: string | null;
};

export async function getMyWithdrawals(limit = 10): Promise<WithdrawalDTO[]> {
  const session = await auth();
  const memberId = session?.user?.memberId;
  if (!memberId) return [];
  return listWithdrawals(memberId, limit);
}

async function listWithdrawals(
  memberId: string,
  limit: number,
): Promise<WithdrawalDTO[]> {
  "use cache";
  cacheTag(`wd-${memberId}`);

  const db = supabaseAdmin();
  const { data } = await db
    .from("withdrawals")
    .select(
      "id, amount, status, bank_code, bank_account, note, admin_note, created_at, processed_at",
    )
    .eq("member_id", memberId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((r) => ({
    id: r.id as string,
    amount: Number(r.amount),
    status: r.status as WithdrawalDTO["status"],
    bankCode: (r.bank_code as string | null) ?? null,
    bankAccount: (r.bank_account as string | null) ?? null,
    note: (r.note as string | null) ?? null,
    adminNote: (r.admin_note as string | null) ?? null,
    createdAt: r.created_at as string,
    processedAt: (r.processed_at as string | null) ?? null,
  }));
}
