import "server-only";

import { cacheTag } from "next/cache";
import { auth } from "@/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type MemberProfile = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  birthday: string | null;
  bankHolder: string | null;
  bankAccount: string | null;
  bankCode: string | null;
  passbookUrl: string | null;
  referralCode: string | null;
  uplineName: string | null;
  uplineReferralCode: string | null;
  lineDisplay: string | null;
  lineAvatarUrl: string | null;
  profileCompleted: boolean;
};

/** 取得當前登入會員的 profile DTO（已剝離敏感欄位） */
export async function getCurrentMember(): Promise<MemberProfile | null> {
  const session = await auth();
  const memberId = session?.user?.memberId;
  if (!memberId) return null;
  return getMemberById(memberId);
}

/** 內部：可被快取的純查詢函式（以 memberId 為快取鍵） */
async function getMemberById(memberId: string): Promise<MemberProfile | null> {
  "use cache";
  cacheTag(`member-${memberId}`);

  const db = supabaseAdmin();
  const { data, error } = await db
    .from("members")
    .select(
      `id, name, email, phone, birthday,
       bank_holder, bank_account, bank_code, passbook_url,
       referral_code, line_display, line_avatar_url, profile_completed,
       upline:upline_id ( name, referral_code )`,
    )
    .eq("id", memberId)
    .maybeSingle();

  if (error || !data) return null;

  const uplineRaw = data.upline as unknown as
    | { name: string | null; referral_code: string | null }
    | { name: string | null; referral_code: string | null }[]
    | null
    | undefined;
  const upline = Array.isArray(uplineRaw) ? uplineRaw[0] ?? null : uplineRaw ?? null;

  return {
    id: data.id,
    name: data.name,
    email: data.email,
    phone: data.phone,
    birthday: data.birthday,
    bankHolder: data.bank_holder,
    bankAccount: data.bank_account,
    bankCode: data.bank_code,
    passbookUrl: data.passbook_url,
    referralCode: data.referral_code,
    uplineName: upline?.name ?? null,
    uplineReferralCode: upline?.referral_code ?? null,
    lineDisplay: data.line_display,
    lineAvatarUrl: data.line_avatar_url,
    profileCompleted: data.profile_completed,
  };
}
