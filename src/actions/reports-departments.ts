"use server";

import { revalidateTag } from "next/cache";
import { z } from "zod";
import { getCurrentAdmin } from "@/lib/admin-session";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type DeptFormState =
  | { ok: false; error?: string; fieldErrors?: Record<string, string> }
  | { ok: true; message: string };

async function requireAdmin() {
  const a = await getCurrentAdmin();
  if (!a?.adminId) throw new Error("Unauthorized");
}

const NameSchema = z.string().trim().min(1, "請輸入部門名稱").max(50, "名稱過長");

export async function createDepartmentAction(
  _prev: DeptFormState | null,
  formData: FormData,
): Promise<DeptFormState> {
  await requireAdmin();

  const parsed = NameSchema.safeParse(formData.get("name"));
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: { name: parsed.error.issues[0]?.message ?? "格式錯誤" },
    };
  }

  const db = supabaseAdmin();
  const { error } = await db.from("departments").insert({
    name: parsed.data,
  });
  if (error) {
    return {
      ok: false,
      error: error.code === "23505" ? "此部門名稱已存在" : "建立失敗：" + error.message,
    };
  }

  revalidateTag("reports-departments", "max");
  return { ok: true, message: "已新增部門" };
}

export async function renameDepartmentAction(
  id: string,
  name: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const parsed = NameSchema.safeParse(name);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "格式錯誤" };
  }

  const db = supabaseAdmin();
  const { error } = await db
    .from("departments")
    .update({ name: parsed.data })
    .eq("id", id);
  if (error) {
    return {
      ok: false,
      error: error.code === "23505" ? "此部門名稱已存在" : error.message,
    };
  }
  revalidateTag("reports-departments", "max");
  return { ok: true };
}

export async function deleteDepartmentAction(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();

  const db = supabaseAdmin();
  // 檢查是否有 ledger_entries 在用
  const { count } = await db
    .from("ledger_entries")
    .select("id", { count: "exact", head: true })
    .eq("department_id", id)
    .is("deleted_at", null);
  if ((count ?? 0) > 0) {
    return { ok: false, error: "此部門尚有記錄使用中，無法刪除" };
  }

  const { error } = await db.from("departments").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateTag("reports-departments", "max");
  return { ok: true };
}
