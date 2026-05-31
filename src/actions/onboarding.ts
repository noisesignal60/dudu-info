"use server";

import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { addPassbookWatermark } from "@/lib/watermark";

const OnboardingSchema = z.object({
  name: z.string().trim().min(1, "請輸入姓名").max(50),
  email: z
    .string()
    .trim()
    .max(200)
    .email("Email 格式錯誤")
    .or(z.literal(""))
    .optional()
    .default(""),
  phone: z.string().trim().min(1, "請輸入行動電話"),
  bankHolder: z.string().trim().min(1, "請輸入銀行戶名"),
  bankAccount: z
    .string()
    .trim()
    .regex(/^\d{10,16}$/, "銀行帳號格式錯誤（10~16 碼數字）"),
  bankCode: z.string().trim().optional().default(""),
  referralCode: z.string().trim().optional().default(""),
});

export type OnboardingState =
  | { ok: false; fieldErrors?: Record<string, string>; error?: string }
  | { ok: true };

const PASSBOOK_BUCKET = process.env.SUPABASE_BUCKET_PASSBOOK || "passbooks";

export async function completeOnboardingAction(
  _prev: OnboardingState | null,
  formData: FormData,
): Promise<OnboardingState> {
  const session = await auth();
  const memberId = session?.user?.memberId;
  if (!memberId) return { ok: false, error: "未登入，請重新登入" };

  const parsed = OnboardingSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    bankHolder: formData.get("bankHolder"),
    bankAccount: formData.get("bankAccount"),
    bankCode: formData.get("bankCode"),
    referralCode: formData.get("referralCode"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]?.toString() ?? "_";
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, fieldErrors };
  }

  const file = formData.get("passbook");
  if (!(file instanceof File) || file.size === 0) {
    return {
      ok: false,
      fieldErrors: { passbook: "請上傳銀行存摺圖片" },
    };
  }
  if (file.size > 8 * 1024 * 1024) {
    return {
      ok: false,
      fieldErrors: { passbook: "圖片過大，請小於 8 MB" },
    };
  }

  const db = supabaseAdmin();

  // 確認還沒有 passbook（不可覆蓋）
  const { data: current } = await db
    .from("members")
    .select("passbook_url")
    .eq("id", memberId)
    .single();
  if (current?.passbook_url) {
    return {
      ok: false,
      error: "您的存摺圖片已上傳完成，無法再次更換。如需更換請聯絡客服。",
    };
  }

  // 上浮水印 + 上傳
  const watermarked = await addPassbookWatermark(await file.arrayBuffer());
  const path = `${memberId}/${Date.now()}.jpg`;

  const upload = await db.storage
    .from(PASSBOOK_BUCKET)
    .upload(path, watermarked, {
      contentType: "image/jpeg",
      upsert: false,
    });
  if (upload.error) {
    console.error("[onboarding] upload error", upload.error);
    return { ok: false, error: "圖片上傳失敗，請稍後再試" };
  }

  // 找上級
  let uplineId: string | null = null;
  if (parsed.data.referralCode) {
    const { data: upline } = await db
      .from("members")
      .select("id")
      .eq("referral_code", parsed.data.referralCode.toUpperCase())
      .maybeSingle();
    uplineId = upline?.id ?? null;
  }

  const { error: updateErr } = await db
    .from("members")
    .update({
      name: parsed.data.name,
      email: parsed.data.email || null,
      phone: parsed.data.phone,
      bank_holder: parsed.data.bankHolder,
      bank_account: parsed.data.bankAccount,
      bank_code: parsed.data.bankCode || null,
      passbook_url: path,
      upline_id: uplineId,
      profile_completed: true,
    })
    .eq("id", memberId);

  if (updateErr) {
    console.error("[onboarding] update error", updateErr);
    return { ok: false, error: "儲存失敗，請稍後再試" };
  }

  revalidateTag(`member-${memberId}`, "max");
  redirect("/dashboard");
}
