"use server";

import { revalidateTag } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

const UpdateProfileSchema = z.object({
  name: z.string().trim().min(1, "請輸入姓名").max(50),
  phone: z.string().trim().min(1, "請輸入行動電話"),
  bankHolder: z.string().trim().min(1, "請輸入銀行戶名"),
  bankAccount: z
    .string()
    .trim()
    .regex(/^\d{10,16}$/, "銀行帳號格式錯誤（10~16 碼數字）"),
  bankCode: z.string().trim().optional().default(""),
});

export type ProfileState =
  | { ok: false; fieldErrors?: Record<string, string>; error?: string }
  | { ok: true; message: string };

/**
 * 編輯個人資料。
 * 規則：銀行存摺圖片永遠不可變；其他可改。
 */
export async function updateProfileAction(
  _prev: ProfileState | null,
  formData: FormData,
): Promise<ProfileState> {
  const session = await auth();
  const memberId = session?.user?.memberId;
  if (!memberId) return { ok: false, error: "未登入，請重新登入" };

  const parsed = UpdateProfileSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    bankHolder: formData.get("bankHolder"),
    bankAccount: formData.get("bankAccount"),
    bankCode: formData.get("bankCode"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]?.toString() ?? "_";
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, fieldErrors };
  }

  const db = supabaseAdmin();
  const { error } = await db
    .from("members")
    .update({
      name: parsed.data.name,
      phone: parsed.data.phone,
      bank_holder: parsed.data.bankHolder,
      bank_account: parsed.data.bankAccount,
      bank_code: parsed.data.bankCode || null,
    })
    .eq("id", memberId);

  if (error) {
    console.error("[profile] update error", error);
    return { ok: false, error: "儲存失敗，請稍後再試" };
  }

  revalidateTag(`member-${memberId}`, "max");
  return { ok: true, message: "儲存成功" };
}
