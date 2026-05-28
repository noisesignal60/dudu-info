import "server-only";

import { cacheTag } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type AdminMemberRow = {
  id: string;
  lineUserId: string;
  lineDisplay: string | null;
  lineAvatarUrl: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  referralCode: string | null;
  uplineName: string | null;
  uplineReferralCode: string | null;
  totalEarned: number;
  pending: number;
  withdrawn: number;
  locked: number;
  downlineCount: number;
  bankHolder: string | null;
  bankAccount: string | null;
  bankCode: string | null;
  passbookUrl: string | null;
  createdAt: string;
};

export type MemberListResult = {
  rows: AdminMemberRow[];
  total: number;
  page: number;
  pageSize: number;
};

export type MemberListParams = {
  q?: string;          // 搜尋（姓名 / LINE 名稱 / 推薦碼 / Email / 電話）
  page?: number;
  pageSize?: number;
};

export async function listMembers(
  params: MemberListParams = {},
): Promise<MemberListResult> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(5, params.pageSize ?? 20));
  const q = (params.q ?? "").trim();

  return queryMembers(q, page, pageSize);
}

async function queryMembers(
  q: string,
  page: number,
  pageSize: number,
): Promise<MemberListResult> {
  "use cache";
  cacheTag("admin-members");
  cacheTag(`admin-members-q-${q}-${page}-${pageSize}`);

  const db = supabaseAdmin();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = db
    .from("members")
    .select(
      `id, line_user_id, line_display, line_avatar_url, name, email, phone,
       referral_code, created_at,
       bank_holder, bank_account, bank_code, passbook_url,
       upline:upline_id ( name, referral_code )`,
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (q) {
    // 簡易搜尋：name / line_display / referral_code / email / phone
    const pattern = `%${q}%`;
    query = query.or(
      [
        `name.ilike.${pattern}`,
        `line_display.ilike.${pattern}`,
        `referral_code.ilike.${pattern}`,
        `email.ilike.${pattern}`,
        `phone.ilike.${pattern}`,
      ].join(","),
    );
  }

  const { data: rows, count } = await query;

  // 補抓 balances + 下線數量
  const ids = (rows ?? []).map((r) => r.id as string);
  const [balRes, downRes] = await Promise.all([
    ids.length
      ? db.from("balances").select("member_id, total_earned, pending, withdrawn, locked").in("member_id", ids)
      : Promise.resolve({ data: [] as Array<{ member_id: string; total_earned: number; pending: number; withdrawn: number; locked: number }> }),
    ids.length
      ? db.from("members").select("upline_id").in("upline_id", ids)
      : Promise.resolve({ data: [] as Array<{ upline_id: string }> }),
  ]);

  const balByMember = new Map<string, { total: number; pending: number; withdrawn: number; locked: number }>();
  for (const b of balRes.data ?? []) {
    balByMember.set(b.member_id as string, {
      total: Number(b.total_earned ?? 0),
      pending: Number(b.pending ?? 0),
      withdrawn: Number(b.withdrawn ?? 0),
      locked: Number(b.locked ?? 0),
    });
  }
  const downCount = new Map<string, number>();
  for (const d of downRes.data ?? []) {
    const uid = d.upline_id as string;
    downCount.set(uid, (downCount.get(uid) ?? 0) + 1);
  }

  const mapped: AdminMemberRow[] = (rows ?? []).map((r) => {
    const uplineRaw = r.upline as
      | { name: string | null; referral_code: string | null }
      | { name: string | null; referral_code: string | null }[]
      | null;
    const upline = Array.isArray(uplineRaw) ? uplineRaw[0] : uplineRaw;
    const bal = balByMember.get(r.id as string);
    return {
      id: r.id as string,
      lineUserId: r.line_user_id as string,
      lineDisplay: r.line_display as string | null,
      lineAvatarUrl: r.line_avatar_url as string | null,
      name: r.name as string | null,
      email: r.email as string | null,
      phone: r.phone as string | null,
      referralCode: r.referral_code as string | null,
      uplineName: upline?.name ?? null,
      uplineReferralCode: upline?.referral_code ?? null,
      totalEarned: bal?.total ?? 0,
      pending: bal?.pending ?? 0,
      withdrawn: bal?.withdrawn ?? 0,
      locked: bal?.locked ?? 0,
      downlineCount: downCount.get(r.id as string) ?? 0,
      bankHolder: r.bank_holder as string | null,
      bankAccount: r.bank_account as string | null,
      bankCode: r.bank_code as string | null,
      passbookUrl: r.passbook_url as string | null,
      createdAt: r.created_at as string,
    };
  });

  return { rows: mapped, total: count ?? mapped.length, page, pageSize };
}

export async function getMemberById(id: string): Promise<AdminMemberRow | null> {
  "use cache";
  cacheTag(`admin-member-${id}`);

  const db = supabaseAdmin();
  const { data } = await db
    .from("members")
    .select(
      `id, line_user_id, line_display, line_avatar_url, name, email, phone,
       referral_code, created_at,
       bank_holder, bank_account, bank_code, passbook_url,
       upline:upline_id ( name, referral_code )`,
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;

  const [balRes, downRes] = await Promise.all([
    db.from("balances").select("total_earned, pending, withdrawn, locked").eq("member_id", id).maybeSingle(),
    db.from("members").select("id", { count: "exact", head: true }).eq("upline_id", id),
  ]);

  const uplineRaw = data.upline as
    | { name: string | null; referral_code: string | null }
    | { name: string | null; referral_code: string | null }[]
    | null;
  const upline = Array.isArray(uplineRaw) ? uplineRaw[0] : uplineRaw;

  return {
    id: data.id as string,
    lineUserId: data.line_user_id as string,
    lineDisplay: data.line_display as string | null,
    lineAvatarUrl: data.line_avatar_url as string | null,
    name: data.name as string | null,
    email: data.email as string | null,
    phone: data.phone as string | null,
    referralCode: data.referral_code as string | null,
    uplineName: upline?.name ?? null,
    uplineReferralCode: upline?.referral_code ?? null,
    totalEarned: Number(balRes.data?.total_earned ?? 0),
    pending: Number(balRes.data?.pending ?? 0),
    withdrawn: Number(balRes.data?.withdrawn ?? 0),
    locked: Number(balRes.data?.locked ?? 0),
    downlineCount: downRes.count ?? 0,
    bankHolder: data.bank_holder as string | null,
    bankAccount: data.bank_account as string | null,
    bankCode: data.bank_code as string | null,
    passbookUrl: data.passbook_url as string | null,
    createdAt: data.created_at as string,
  };
}

/** 取得 Supabase Storage 中存摺圖片的簽名 URL（admin 檢視用） */
export async function getPassbookSignedUrl(
  storagePath: string,
  expiresIn = 300,
): Promise<string | null> {
  const bucket = process.env.SUPABASE_BUCKET_PASSBOOK || "passbooks";
  const db = supabaseAdmin();
  const { data } = await db.storage.from(bucket).createSignedUrl(storagePath, expiresIn);
  return data?.signedUrl ?? null;
}
