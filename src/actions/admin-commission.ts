"use server";

import { revalidateTag } from "next/cache";
import { z } from "zod";
import { getCurrentAdmin } from "@/lib/admin-session";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type CommissionFormState =
  | { ok: false; error?: string; fieldErrors?: Record<string, string> }
  | { ok: true; message: string };

const Rate = z.coerce
  .number({ error: "請輸入數字" })
  .min(0, "比例需 ≥ 0")
  .max(100, "比例需 ≤ 100");

const Schema = z.object({
  rateA: Rate,
  rateB: Rate,
  rateC: Rate,
  rateD: Rate,
  rateE: Rate,
  newBonus: z.coerce
    .number({ error: "請輸入數字" })
    .min(0, "獎勵需 ≥ 0"),
});

async function requireAdminId(): Promise<string> {
  const admin = await getCurrentAdmin();
  if (!admin?.adminId) throw new Error("Unauthorized");
  return admin.adminId;
}

export async function updateCommissionAction(
  _prev: CommissionFormState | null,
  formData: FormData,
): Promise<CommissionFormState> {
  const adminId = await requireAdminId();
  const parsed = Schema.safeParse({
    rateA: formData.get("rateA"),
    rateB: formData.get("rateB"),
    rateC: formData.get("rateC"),
    rateD: formData.get("rateD"),
    rateE: formData.get("rateE"),
    newBonus: formData.get("newBonus"),
  });
  if (!parsed.success) {
    const fe: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const k = issue.path[0]?.toString() ?? "_";
      if (!fe[k]) fe[k] = issue.message;
    }
    return { ok: false, fieldErrors: fe };
  }

  const db = supabaseAdmin();

  // 1) 把舊的 active 設為 false
  await db
    .from("commission_settings")
    .update({ is_active: false })
    .eq("is_active", true);

  // 2) 插入新的 active
  const { error } = await db.from("commission_settings").insert({
    rate_a: parsed.data.rateA,
    rate_b: parsed.data.rateB,
    rate_c: parsed.data.rateC,
    rate_d: parsed.data.rateD,
    rate_e: parsed.data.rateE,
    new_bonus: parsed.data.newBonus,
    is_active: true,
    changed_by: adminId,
  });

  if (error) {
    return { ok: false, error: "儲存失敗：" + error.message };
  }

  revalidateTag("commission-settings", "max");
  revalidateTag("commission-history", "max");
  return { ok: true, message: "已更新分潤設定" };
}
