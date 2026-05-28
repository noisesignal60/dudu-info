import "server-only";

import { cacheTag } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type TxKind = "commission" | "reward" | "withdrawal" | "adjust";

export type AdminTxRow = {
  id: string;
  kind: TxKind;
  memberId: string;
  memberName: string | null;
  memberLineDisplay: string | null;
  title: string;
  description: string | null;
  amount: number;
  createdAt: string;
};

export type ListTxParams = {
  kind?: TxKind | "all";
  memberId?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
};

export type TxListResult = {
  rows: AdminTxRow[];
  total: number;
  page: number;
  pageSize: number;
};

export async function listAdminTransactions(
  params: ListTxParams = {},
): Promise<TxListResult> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(10, params.pageSize ?? 30));
  return queryTx(
    params.kind ?? "all",
    params.memberId ?? "",
    params.from ?? "",
    params.to ?? "",
    page,
    pageSize,
  );
}

async function queryTx(
  kind: TxKind | "all",
  memberId: string,
  from: string,
  to: string,
  page: number,
  pageSize: number,
): Promise<TxListResult> {
  "use cache";
  cacheTag("admin-transactions");
  cacheTag(`admin-tx-${kind}-${memberId}-${from}-${to}-${page}-${pageSize}`);

  const db = supabaseAdmin();
  const offset = (page - 1) * pageSize;

  let query = db
    .from("transactions")
    .select(
      `id, kind, member_id, title, description, amount, created_at,
       member:member_id ( name, line_display )`,
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (kind !== "all") query = query.eq("kind", kind);
  if (memberId) query = query.eq("member_id", memberId);
  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", to);

  const { data, count } = await query;

  const rows: AdminTxRow[] = (data ?? []).map((r) => {
    const memberRaw = r.member as
      | { name: string | null; line_display: string | null }
      | { name: string | null; line_display: string | null }[]
      | null;
    const m = Array.isArray(memberRaw) ? memberRaw[0] : memberRaw;
    return {
      id: r.id as string,
      kind: r.kind as TxKind,
      memberId: r.member_id as string,
      memberName: m?.name ?? null,
      memberLineDisplay: m?.line_display ?? null,
      title: r.title as string,
      description: (r.description as string | null) ?? null,
      amount: Number(r.amount),
      createdAt: r.created_at as string,
    };
  });

  return { rows, total: count ?? rows.length, page, pageSize };
}

export type MemberOption = {
  id: string;
  label: string;
};

export async function searchMembersForPicker(q: string): Promise<MemberOption[]> {
  // 不快取（搜尋輸入需要即時）
  const db = supabaseAdmin();
  const term = q.trim();
  let query = db
    .from("members")
    .select("id, name, line_display, referral_code, phone")
    .order("created_at", { ascending: false })
    .limit(20);

  if (term) {
    const p = `%${term}%`;
    query = query.or(
      [
        `name.ilike.${p}`,
        `line_display.ilike.${p}`,
        `referral_code.ilike.${p}`,
        `phone.ilike.${p}`,
      ].join(","),
    );
  }

  const { data } = await query;
  return (data ?? []).map((r) => ({
    id: r.id as string,
    label: [
      r.name ?? r.line_display ?? "(未填寫)",
      r.referral_code ? `[${r.referral_code}]` : null,
      r.phone ? `· ${r.phone}` : null,
    ]
      .filter(Boolean)
      .join(" "),
  }));
}
