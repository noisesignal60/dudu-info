"use server";

import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentAdmin } from "@/lib/admin-session";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { addPassbookWatermark } from "@/lib/watermark";

const PASSBOOK_BUCKET = process.env.SUPABASE_BUCKET_PASSBOOK || "passbooks";

const UpdateBalanceSchema = z.object({
  totalEarned: z.coerce.number().min(0),
  pending: z.coerce.number().min(0),
  withdrawn: z.coerce.number().min(0),
  // locked 為審核中金額 — 由系統自動維護，admin 不可手動改
});

export type AdminMemberFormState =
  | { ok: false; error?: string; fieldErrors?: Record<string, string> }
  | { ok: true; message: string };

async function requireAdmin(): Promise<{ id: string }> {
  const admin = await getCurrentAdmin();
  if (!admin?.adminId) throw new Error("Unauthorized");
  return { id: admin.adminId };
}

export async function updateMemberBalanceAction(
  memberId: string,
  _prev: AdminMemberFormState | null,
  formData: FormData,
): Promise<AdminMemberFormState> {
  await requireAdmin();

  const parsed = UpdateBalanceSchema.safeParse({
    totalEarned: formData.get("totalEarned"),
    pending: formData.get("pending"),
    withdrawn: formData.get("withdrawn"),
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
    .from("balances")
    .update({
      total_earned: parsed.data.totalEarned,
      pending: parsed.data.pending,
      withdrawn: parsed.data.withdrawn,
    })
    .eq("member_id", memberId);
  if (error) {
    console.error("[admin-members] balance update error", error);
    return { ok: false, error: "儲存失敗：" + error.message };
  }

  revalidateTag(`admin-member-${memberId}`, "max");
  revalidateTag(`stats-${memberId}`, "max");
  revalidateTag("admin-stats", "max");
  return { ok: true, message: "已更新餘額" };
}

export async function deleteMemberAction(memberId: string): Promise<void> {
  await requireAdmin();
  const db = supabaseAdmin();
  const { error } = await db.from("members").delete().eq("id", memberId);
  if (error) {
    throw new Error("刪除失敗：" + error.message);
  }
  revalidateTag("admin-members", "max");
  redirect("/admin/members");
}

export async function replaceMemberPassbookAction(
  memberId: string,
  _prev: AdminMemberFormState | null,
  formData: FormData,
): Promise<AdminMemberFormState> {
  await requireAdmin();

  const file = formData.get("passbook");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, fieldErrors: { passbook: "請選擇銀行存摺圖片" } };
  }
  if (file.size > 8 * 1024 * 1024) {
    return { ok: false, fieldErrors: { passbook: "圖片過大，請小於 8 MB" } };
  }

  // 加浮水印 + 上傳到新路徑（保留舊檔，不覆蓋）
  const watermarked = await addPassbookWatermark(await file.arrayBuffer());
  const path = `${memberId}/${Date.now()}.jpg`;

  const db = supabaseAdmin();
  const upload = await db.storage
    .from(PASSBOOK_BUCKET)
    .upload(path, watermarked, { contentType: "image/jpeg", upsert: false });
  if (upload.error) {
    console.error("[admin-members] passbook upload error", upload.error);
    return { ok: false, error: "圖片上傳失敗，請稍後再試" };
  }

  const { error } = await db
    .from("members")
    .update({ passbook_url: path })
    .eq("id", memberId);
  if (error) {
    console.error("[admin-members] passbook update error", error);
    return { ok: false, error: "儲存失敗：" + error.message };
  }

  revalidateTag(`admin-member-${memberId}`, "max");
  revalidateTag(`member-${memberId}`, "max");
  return { ok: true, message: "已更換存摺圖片" };
}
