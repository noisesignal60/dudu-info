"use server";

import { revalidateTag } from "next/cache";
import { z } from "zod";
import argon2 from "argon2";
import { getCurrentAdmin } from "@/lib/admin-session";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type AdminFormState =
  | { ok: false; error?: string; fieldErrors?: Record<string, string> }
  | { ok: true; message: string };

const UsernameRule = z
  .string()
  .trim()
  .min(3, "帳號至少 3 字元")
  .max(40, "帳號過長")
  .regex(/^[a-zA-Z0-9_.-]+$/u, "只能使用英數與 . _ -");

const PasswordRule = z
  .string()
  .min(8, "密碼至少 8 字元")
  .max(100, "密碼過長");

const CreateSchema = z.object({
  username: UsernameRule,
  displayName: z.string().trim().min(1, "請輸入姓名").max(50),
  password: PasswordRule,
});

const UpdateSchema = z.object({
  displayName: z.string().trim().min(1, "請輸入姓名").max(50),
});

const ResetPasswordSchema = z.object({
  password: PasswordRule,
});

async function requireAdmin(): Promise<{ id: string }> {
  const admin = await getCurrentAdmin();
  if (!admin?.adminId) throw new Error("Unauthorized");
  return { id: admin.adminId };
}

function flatten(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path[0]?.toString() ?? "_";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export async function createAdminAction(
  _prev: AdminFormState | null,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();

  const parsed = CreateSchema.safeParse({
    username: formData.get("username"),
    displayName: formData.get("displayName"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, fieldErrors: flatten(parsed.error) };
  }

  const db = supabaseAdmin();

  const { data: existing } = await db
    .from("admins")
    .select("id")
    .eq("username", parsed.data.username)
    .maybeSingle();
  if (existing) {
    return { ok: false, fieldErrors: { username: "此帳號已存在" } };
  }

  const hash = await argon2.hash(parsed.data.password, { type: argon2.argon2id });
  const { error } = await db.from("admins").insert({
    username: parsed.data.username,
    display_name: parsed.data.displayName,
    password_hash: hash,
  });
  if (error) {
    console.error("[admins] create error", error);
    return { ok: false, error: "建立失敗：" + error.message };
  }

  revalidateTag("admin-admins", "max");
  return { ok: true, message: "已新增管理員" };
}

export async function updateAdminAction(
  targetId: string,
  _prev: AdminFormState | null,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();
  const parsed = UpdateSchema.safeParse({
    displayName: formData.get("displayName"),
  });
  if (!parsed.success) {
    return { ok: false, fieldErrors: flatten(parsed.error) };
  }

  const db = supabaseAdmin();
  const { error } = await db
    .from("admins")
    .update({ display_name: parsed.data.displayName })
    .eq("id", targetId);
  if (error) {
    return { ok: false, error: "儲存失敗：" + error.message };
  }

  revalidateTag("admin-admins", "max");
  revalidateTag(`admin-admin-${targetId}`, "max");
  return { ok: true, message: "已更新" };
}

export async function resetAdminPasswordAction(
  targetId: string,
  _prev: AdminFormState | null,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();
  const parsed = ResetPasswordSchema.safeParse({
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, fieldErrors: flatten(parsed.error) };
  }

  const hash = await argon2.hash(parsed.data.password, { type: argon2.argon2id });
  const db = supabaseAdmin();
  const { error } = await db
    .from("admins")
    .update({ password_hash: hash })
    .eq("id", targetId);
  if (error) {
    return { ok: false, error: "重設失敗：" + error.message };
  }

  revalidateTag("admin-admins", "max");
  return { ok: true, message: "密碼已重設" };
}

export async function toggleAdminActiveAction(
  targetId: string,
  nextActive: boolean,
): Promise<{ ok: boolean; error?: string }> {
  const me = await requireAdmin();
  if (me.id === targetId) {
    return { ok: false, error: "不可停用自己" };
  }

  const db = supabaseAdmin();
  const { error } = await db
    .from("admins")
    .update({ is_active: nextActive })
    .eq("id", targetId);
  if (error) {
    return { ok: false, error: error.message };
  }

  revalidateTag("admin-admins", "max");
  revalidateTag(`admin-admin-${targetId}`, "max");
  return { ok: true };
}
