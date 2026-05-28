import "server-only";

import { cacheTag } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type TreeNode = {
  id: string;
  name: string;
  attributes: {
    referralCode?: string;
    lineDisplay?: string;
    downlineCount?: number;
  };
  children: TreeNode[];
};

export type NetworkSnapshot = {
  // 多個根節點（沒有 upline 的會員），UI 端可選擇要不要包一層虛擬 root
  roots: TreeNode[];
  totalMembers: number;
};

export async function getNetworkTree(): Promise<NetworkSnapshot> {
  "use cache";
  cacheTag("admin-network");

  const db = supabaseAdmin();
  const { data, error } = await db
    .from("members")
    .select("id, name, line_display, referral_code, upline_id")
    .order("created_at", { ascending: true });

  if (error || !data) {
    return { roots: [], totalMembers: 0 };
  }

  type Raw = {
    id: string;
    name: string | null;
    line_display: string | null;
    referral_code: string | null;
    upline_id: string | null;
  };

  const rows = data as unknown as Raw[];
  const nodeMap = new Map<string, TreeNode>();

  for (const r of rows) {
    nodeMap.set(r.id, {
      id: r.id,
      name: r.name || r.line_display || "(未填寫)",
      attributes: {
        referralCode: r.referral_code ?? undefined,
        lineDisplay: r.line_display ?? undefined,
        downlineCount: 0,
      },
      children: [],
    });
  }

  const roots: TreeNode[] = [];

  for (const r of rows) {
    const node = nodeMap.get(r.id)!;
    if (r.upline_id && nodeMap.has(r.upline_id)) {
      const parent = nodeMap.get(r.upline_id)!;
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  // 計算 downlineCount
  function countDescendants(n: TreeNode): number {
    let c = 0;
    for (const child of n.children) {
      c += 1 + countDescendants(child);
    }
    n.attributes.downlineCount = c;
    return c;
  }
  roots.forEach(countDescendants);

  return { roots, totalMembers: rows.length };
}
