"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import argon2 from "argon2";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getAdminSession } from "@/lib/admin-session";
import { FAIL_THRESHOLD, lockDurationMs, formatRetryAfter } from "@/lib/login-throttle";

const LoginSchema = z.object({
  username: z.string().trim().min(1, "請輸入帳號"),
  password: z.string().min(1, "請輸入密碼"),
});

export type AdminLoginState =
  | {
      ok: false;
      error?: string;
      fieldErrors?: Record<string, string>;
      attempts?: number;
      retryAfterSeconds?: number;
    }
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
    .select("id, username, display_name, password_hash, is_active, failed_attempts, locked_until")
    .eq("username", parsed.data.username)
    .maybeSingle();

  if (!admin) {
    return { ok: false, error: "帳號或密碼錯誤" };
  }
  if (admin.is_active === false) {
    return { ok: false, error: "此帳號已停用，請聯絡其他管理員" };
  }

  // 鎖定檢查：仍在鎖定期間內，直接擋下（不浪費 argon2 驗證成本）
  const lockedUntilMs = admin.locked_until ? new Date(admin.locked_until).getTime() : 0;
  const now = Date.now();
  if (lockedUntilMs > now) {
    const remain = lockedUntilMs - now;
    return {
      ok: false,
      retryAfterSeconds: Math.ceil(remain / 1000),
      error: `因連續輸入錯誤已暫時鎖定，請於 ${formatRetryAfter(remain)} 後再試`,
    };
  }

  const valid = await argon2.verify(admin.password_hash, parsed.data.password);
  if (!valid) {
    const next = (admin.failed_attempts ?? 0) + 1;
    const lockMs = lockDurationMs(next);
    await db
      .from("admins")
      .update({
        failed_attempts: next,
        locked_until: lockMs > 0 ? new Date(now + lockMs).toISOString() : null,
      })
      .eq("id", admin.id);

    if (lockMs > 0) {
      return {
        ok: false,
        attempts: next,
        retryAfterSeconds: Math.ceil(lockMs / 1000),
        error: `帳號或密碼錯誤，已連續錯誤 ${next} 次，已暫時鎖定，請於 ${formatRetryAfter(lockMs)} 後再試`,
      };
    }
    const left = FAIL_THRESHOLD - next;
    return {
      ok: false,
      attempts: next,
      error: `帳號或密碼錯誤（已連續錯誤 ${next} 次，再錯 ${left} 次將暫時鎖定）`,
    };
  }

  // 登入成功：更新 last_login_at 並重設失敗計數與鎖定
  await db
    .from("admins")
    .update({
      last_login_at: new Date().toISOString(),
      failed_attempts: 0,
      locked_until: null,
    })
    .eq("id", admin.id);

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
