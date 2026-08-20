"use server";

import { updateTag } from "next/cache";
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
      error:
        error.code === "23505"
          ? "此部門名稱已存在"
          : "新增失敗，請稍後再試一次",
    };
  }

  updateTag("reports-departments");
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
      error:
        error.code === "23505"
          ? "此部門名稱已存在"
          : "更新失敗，請稍後再試一次",
    };
  }
  updateTag("reports-departments");
  return { ok: true };
}

/** 該部門底下「使用中」的帳有幾筆。 */
async function countActiveEntries(id: string): Promise<number> {
  const { count } = await supabaseAdmin()
    .from("ledger_entries")
    .select("id", { count: "exact", head: true })
    .eq("department_id", id)
    .is("deleted_at", null);
  return count ?? 0;
}

export type DeptDeletePreview =
  | { ok: true; activeCount: number; purgedCount: number }
  | { ok: false; error: string };

/**
 * 刪除部門前的預檢：回報底下有幾筆「使用中」與幾筆「已刪除但仍留在資料庫」的帳。
 *
 * 為什麼需要這個：ledger_entries 是軟刪除（只寫 deleted_at），但外鍵是
 * `on delete restrict`，它看的是全部資料列。所以畫面上看不到任何帳的部門，
 * 底下仍可能有軟刪除列卡著刪不掉。前端拿這兩個數字組出一次到位的確認訊息。
 */
export async function getDepartmentDeletePreview(
  id: string,
): Promise<DeptDeletePreview> {
  await requireAdmin();

  const db = supabaseAdmin();
  const [active, purged] = await Promise.all([
    db
      .from("ledger_entries")
      .select("id", { count: "exact", head: true })
      .eq("department_id", id)
      .is("deleted_at", null),
    db
      .from("ledger_entries")
      .select("id", { count: "exact", head: true })
      .eq("department_id", id)
      .not("deleted_at", "is", null),
  ]);

  if (active.error || purged.error) {
    return { ok: false, error: "查不到這個部門的資料，請重新整理再試一次" };
  }

  return {
    ok: true,
    activeCount: active.count ?? 0,
    purgedCount: purged.count ?? 0,
  };
}

/**
 * 刪除部門。`purgeDeleted` 為真時，會一併「永久清除」該部門底下已軟刪除的帳
 *（那些帳在畫面上早就不存在、也沒有復原功能，只是還卡著外鍵）。
 * 使用中的帳一律擋下，不會被這個動作碰到。
 */
export async function deleteDepartmentAction(
  id: string,
  purgeDeleted = false,
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();

  const db = supabaseAdmin();

  // 重查一次，防止預檢到實際刪除之間有人剛新增帳
  const activeCount = await countActiveEntries(id);
  if (activeCount > 0) {
    return {
      ok: false,
      error: `這個部門底下還有 ${activeCount} 筆帳在用，請先把這些帳改到其他部門或刪掉，才能刪除部門`,
    };
  }

  if (purgeDeleted) {
    // 只清「已軟刪除」的列 — 這個條件不能拿掉，否則會連使用中的帳一起刪
    const { error } = await db
      .from("ledger_entries")
      .delete()
      .eq("department_id", id)
      .not("deleted_at", "is", null);
    if (error) {
      return { ok: false, error: "清除舊資料時出了問題，請稍後再試一次" };
    }
  }

  const { error } = await db.from("departments").delete().eq("id", id);
  if (error) {
    return {
      ok: false,
      error:
        error.code === "23503"
          ? "這個部門底下還有帳，沒辦法刪除"
          : "刪除失敗，請稍後再試一次",
    };
  }

  updateTag("reports-departments");
  return { ok: true };
}
