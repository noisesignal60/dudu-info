import "server-only";

import { cacheTag } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type WithdrawalStatus = "pending" | "approved" | "rejected";

export type AdminWithdrawalRow = {
  id: string;
  memberId: string;
  memberName: string | null;
  memberLineDisplay: string | null;
  memberPassbookUrl: string | null;
  amount: number;
  status: WithdrawalStatus;
  bankCode: string | null;
  bankAccount: string | null;
  note: string | null;
  adminNote: string | null;
  createdAt: string;
  processedAt: string | null;
  processedBy: string | null;
};

export type ListWithdrawalsParams = {
  status?: WithdrawalStatus | "all";
  page?: number;
  pageSize?: number;
  from?: string;
  to?: string;
};

export type WithdrawalListResult = {
  rows: AdminWithdrawalRow[];
  total: number;
  page: number;
  pageSize: number;
};

export async function listAdminWithdrawals(
  params: ListWithdrawalsParams = {},
): Promise<WithdrawalListResult> {
  const status = params.status ?? "pending";
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(10, params.pageSize ?? 30));
  return queryWithdrawals(status, page, pageSize, params.from, params.to);
}

async function queryWithdrawals(
  status: WithdrawalStatus | "all",
  page: number,
  pageSize: number,
  from?: string,
  to?: string,
): Promise<WithdrawalListResult> {
  "use cache";
  cacheTag("admin-withdrawals");
  cacheTag(`admin-withdrawals-${status}-${page}-${pageSize}-${from ?? ""}-${to ?? ""}`);

  const db = supabaseAdmin();
  const offset = (page - 1) * pageSize;

  let query = db
    .from("withdrawals")
    .select(
      `id, member_id, amount, status, bank_code, bank_account, note, admin_note,
       created_at, processed_at, processed_by,
       member:member_id ( name, line_display, passbook_url )`,
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (status !== "all") query = query.eq("status", status);
  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", to);

  const { data, count } = await query;

  const rows: AdminWithdrawalRow[] = (data ?? []).map((r) => {
    const memberRaw = r.member as
      | { name: string | null; line_display: string | null; passbook_url: string | null }
      | { name: string | null; line_display: string | null; passbook_url: string | null }[]
      | null;
    const member = Array.isArray(memberRaw) ? memberRaw[0] : memberRaw;
    return {
      id: r.id as string,
      memberId: r.member_id as string,
      memberName: member?.name ?? null,
      memberLineDisplay: member?.line_display ?? null,
      memberPassbookUrl: member?.passbook_url ?? null,
      amount: Number(r.amount),
      status: r.status as WithdrawalStatus,
      bankCode: (r.bank_code as string | null) ?? null,
      bankAccount: (r.bank_account as string | null) ?? null,
      note: (r.note as string | null) ?? null,
      adminNote: (r.admin_note as string | null) ?? null,
      createdAt: r.created_at as string,
      processedAt: (r.processed_at as string | null) ?? null,
      processedBy: (r.processed_by as string | null) ?? null,
    };
  });

  return { rows, total: count ?? rows.length, page, pageSize };
}

export type WithdrawalCounts = {
  pending: number;
  approved: number;
  rejected: number;
  all: number;
};

export async function countWithdrawalsByStatus(): Promise<WithdrawalCounts> {
  "use cache";
  cacheTag("admin-withdrawal-counts");

  const db = supabaseAdmin();
  const [p, a, r, t] = await Promise.all([
    db.from("withdrawals").select("id", { count: "exact", head: true }).eq("status", "pending"),
    db.from("withdrawals").select("id", { count: "exact", head: true }).eq("status", "approved"),
    db.from("withdrawals").select("id", { count: "exact", head: true }).eq("status", "rejected"),
    db.from("withdrawals").select("id", { count: "exact", head: true }),
  ]);

  return {
    pending: p.count ?? 0,
    approved: a.count ?? 0,
    rejected: r.count ?? 0,
    all: t.count ?? 0,
  };
}

export async function getWithdrawalById(id: string): Promise<AdminWithdrawalRow | null> {
  "use cache";
  cacheTag(`admin-withdrawal-${id}`);

  const db = supabaseAdmin();
  const { data } = await db
    .from("withdrawals")
    .select(
      `id, member_id, amount, status, bank_code, bank_account, note, admin_note,
       created_at, processed_at, processed_by,
       member:member_id ( name, line_display, passbook_url )`,
    )
    .eq("id", id)
    .maybeSingle();

  if (!data) return null;
  const memberRaw = data.member as
    | { name: string | null; line_display: string | null; passbook_url: string | null }
    | { name: string | null; line_display: string | null; passbook_url: string | null }[]
    | null;
  const member = Array.isArray(memberRaw) ? memberRaw[0] : memberRaw;

  return {
    id: data.id as string,
    memberId: data.member_id as string,
    memberName: member?.name ?? null,
    memberLineDisplay: member?.line_display ?? null,
    memberPassbookUrl: member?.passbook_url ?? null,
    amount: Number(data.amount),
    status: data.status as WithdrawalStatus,
    bankCode: (data.bank_code as string | null) ?? null,
    bankAccount: (data.bank_account as string | null) ?? null,
    note: (data.note as string | null) ?? null,
    adminNote: (data.admin_note as string | null) ?? null,
    createdAt: data.created_at as string,
    processedAt: (data.processed_at as string | null) ?? null,
    processedBy: (data.processed_by as string | null) ?? null,
  };
}
