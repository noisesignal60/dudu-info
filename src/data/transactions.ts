import "server-only";

import { cacheTag } from "next/cache";
import { auth } from "@/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type TransactionDTO = {
  id: string;
  kind: "commission" | "reward" | "withdrawal" | "adjust";
  title: string;
  description: string | null;
  amount: number;
  createdAt: string;
};

export async function getMyTransactions(limit = 20): Promise<TransactionDTO[]> {
  const session = await auth();
  const memberId = session?.user?.memberId;
  if (!memberId) return [];
  return listTransactions(memberId, limit);
}

async function listTransactions(
  memberId: string,
  limit: number,
): Promise<TransactionDTO[]> {
  "use cache";
  cacheTag(`tx-${memberId}`);

  const db = supabaseAdmin();
  const { data } = await db
    .from("transactions")
    .select("id, kind, title, description, amount, created_at")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((r) => ({
    id: r.id as string,
    kind: r.kind as TransactionDTO["kind"],
    title: r.title as string,
    description: (r.description as string | null) ?? null,
    amount: Number(r.amount),
    createdAt: r.created_at as string,
  }));
}
