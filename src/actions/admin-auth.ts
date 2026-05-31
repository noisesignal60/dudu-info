"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import argon2 from "argon2";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getAdminSession } from "@/lib/admin-session";

const LoginSchema = z.object({
  username: z.string().trim().min(1, "請輸入帳號"),
  password: z.string().min(1, "請輸入密碼"),
});

export type AdminLoginState =
  | { ok: false; error?: string; fieldErrors?: Record<string, string> }
  | { ok: true };

// 只允許導向站內 /admin 或 /reports 底下的路徑，避免開放轉址（open redirect）
const SAFE_PREFIXES = ["/admin", "/reports"];
function safeRedirect(raw: FormDataEntryValue | null): string {
  const v = typeof raw === "string" ? raw : "";
  if (
    v.startsWith("/") &&
    !v.startsWith("//") &&
    SAFE_PREFIXES.some((p) => v === p || v.startsWith(p + "/"))
  ) {
    return v;
  }
  return "/admin";
}

export async function adminLoginAction(
  _prev: AdminLoginState | null,
  formData: FormData,
): Promise<AdminLoginState> {
  const parsed = LoginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
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
  const { data: admin } = await db
    .from("admins")
    .select("id, username, display_name, password_hash, is_active")
    .eq("username", parsed.data.username)
    .maybeSingle();

  if (!admin) {
    return { ok: false, error: "帳號或密碼錯誤" };
  }
  if (admin.is_active === false) {
    return { ok: false, error: "此帳號已停用，請聯絡其他管理員" };
  }

  const valid = await argon2.verify(admin.password_hash, parsed.data.password);
  if (!valid) {
    return { ok: false, error: "帳號或密碼錯誤" };
  }

  // 更新 last_login_at
  await db.from("admins").update({ last_login_at: new Date().toISOString() }).eq("id", admin.id);

  const session = await getAdminSession();
  session.adminId = admin.id;
  session.username = admin.username;
  session.displayName = admin.display_name;
  await session.save();

  redirect(safeRedirect(formData.get("redirectTo")));
}

export async function adminLogoutAction() {
  const session = await getAdminSession();
  session.destroy();
  redirect("/admin/login");
}
