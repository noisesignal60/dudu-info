import "server-only";

import { cacheTag } from "next/cache";
import { auth } from "@/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type DashboardStats = {
  totalAmount: number;
  pendingAmount: number;
  withdrawnAmount: number;
  lockedAmount: number;
  referralCount: number;
  networkCount: number;
};

export async function getDashboardStats(): Promise<DashboardStats | null> {
  const session = await auth();
  const memberId = session?.user?.memberId;
  if (!memberId) return null;
  return computeStats(memberId);
}

async function computeStats(memberId: string): Promise<DashboardStats> {
  "use cache";
  cacheTag(`stats-${memberId}`);

  const db = supabaseAdmin();

  const [balanceRes, referralRes] = await Promise.all([
    db
      .from("balances")
      .select("total_earned, pending, withdrawn, locked")
      .eq("member_id", memberId)
      .maybeSingle(),
    db
      .from("members")
      .select("id", { count: "exact", head: true })
      .eq("upline_id", memberId),
  ]);

  const networkCount = await countNetwork(memberId);
  const balance = balanceRes.data;

  return {
    totalAmount: Number(balance?.total_earned ?? 0),
    pendingAmount: Number(balance?.pending ?? 0),
    withdrawnAmount: Number(balance?.withdrawn ?? 0),
    lockedAmount: Number(balance?.locked ?? 0),
    referralCount: referralRes.count ?? 0,
    networkCount,
  };
}

/** 往下展開所有層級的會員數量（上限 5 層） */
async function countNetwork(rootId: string): Promise<number> {
  const db = supabaseAdmin();
  let total = 0;
  let frontier: string[] = [rootId];
  for (let depth = 0; depth < 5 && frontier.length > 0; depth++) {
    const { data } = await db.from("members").select("id").in("upline_id", frontier);
    const next = (data ?? []).map((r) => r.id as string);
    total += next.length;
    frontier = next;
  }
  return total;
}
