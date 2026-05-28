import "server-only";

import { cacheTag } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type AdminStats = {
  totalMembers: number;
  totalTransactionAmount: number;
  totalCommissionAmount: number;
  pendingApprovalCount: number;
};

export async function getAdminStats(): Promise<AdminStats> {
  "use cache";
  cacheTag("admin-stats");

  const db = supabaseAdmin();

  const [members, txAll, txComm, pending] = await Promise.all([
    db.from("members").select("id", { count: "exact", head: true }),
    db.from("transactions").select("amount"),
    db.from("transactions").select("amount").eq("kind", "commission"),
    db.from("withdrawals").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  const sum = (rows: { amount: number | string | null }[] | null) =>
    (rows ?? []).reduce((s, r) => s + Number(r.amount ?? 0), 0);

  return {
    totalMembers: members.count ?? 0,
    totalTransactionAmount: sum(txAll.data as { amount: number }[] | null),
    totalCommissionAmount: sum(txComm.data as { amount: number }[] | null),
    pendingApprovalCount: pending.count ?? 0,
  };
}

export type AdminActivity = {
  id: string;
  title: string;
  amount: number;
  memberName: string | null;
  createdAt: string;
};

export async function getRecentActivity(limit = 10): Promise<AdminActivity[]> {
  "use cache";
  cacheTag("admin-activity");

  const db = supabaseAdmin();
  const { data } = await db
    .from("transactions")
    .select("id, title, amount, created_at, member:member_id ( name, line_display )")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((r) => {
    const memberRaw = r.member as
      | { name: string | null; line_display: string | null }
      | { name: string | null; line_display: string | null }[]
      | null;
    const member = Array.isArray(memberRaw) ? memberRaw[0] : memberRaw;
    return {
      id: r.id as string,
      title: r.title as string,
      amount: Number(r.amount),
      memberName: member?.name ?? member?.line_display ?? null,
      createdAt: r.created_at as string,
    };
  });
}
