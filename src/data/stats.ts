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

export type DownlineMember = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  /** 與本人的距離層級：1＝直接推薦，最多 5 層 */
  level: number;
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

/** 取得目前登入會員的下線名單（含 LINE 名稱、頭像、層級） */
export async function getMyDownline(): Promise<DownlineMember[]> {
  const session = await auth();
  const memberId = session?.user?.memberId;
  if (!memberId) return [];
  return listDownline(memberId);
}

/** 往下展開所有層級的下線會員（上限 5 層），與 countNetwork 同邏輯但帶回名稱與頭像 */
async function listDownline(rootId: string): Promise<DownlineMember[]> {
  "use cache";
  cacheTag(`stats-${rootId}`);

  const db = supabaseAdmin();
  const out: DownlineMember[] = [];
  const seen = new Set<string>([rootId]); // 防環：正常樹狀資料下不影響數量
  let frontier: string[] = [rootId];

  for (let depth = 0; depth < 5 && frontier.length > 0; depth++) {
    const { data } = await db
      .from("members")
      .select("id, line_display, line_avatar_url, name")
      .in("upline_id", frontier);

    const next: string[] = [];
    for (const r of data ?? []) {
      const id = r.id as string;
      if (seen.has(id)) continue;
      seen.add(id);
      out.push({
        id,
        displayName:
          (r.line_display as string | null) ??
          (r.name as string | null) ??
          "未命名司機",
        avatarUrl: (r.line_avatar_url as string | null) ?? null,
        level: depth + 1,
      });
      next.push(id);
    }
    frontier = next;
  }

  return out;
}
