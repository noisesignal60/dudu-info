"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { getCurrentAdmin } from "@/lib/admin-session";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type AnnouncementFormState =
  | { ok: false; error?: string; fieldErrors?: Record<string, string> }
  | { ok: true; message: string };

const CreateSchema = z.object({
  title: z.string().trim().min(1, "請輸入標題").max(100, "標題過長"),
  content: z.string().trim().min(1, "請輸入內容").max(2000, "內容過長"),
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

export async function createAnnouncementAction(
  _prev: AnnouncementFormState | null,
  formData: FormData,
): Promise<AnnouncementFormState> {
  await requireAdmin();

  const parsed = CreateSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
  });
  if (!parsed.success) {
    return { ok: false, fieldErrors: flatten(parsed.error) };
  }

  const db = supabaseAdmin();
  const { error } = await db.from("announcements").insert({
    title: parsed.data.title,
    content: parsed.data.content,
  });
  if (error) {
    console.error("[announcements] create error", error);
    return { ok: false, error: "建立失敗：" + error.message };
  }

  updateTag("announcements");
  return { ok: true, message: "已發布公告" };
}

export async function deleteAnnouncementAction(id: string): Promise<void> {
  await requireAdmin();

  const db = supabaseAdmin();
  const { error } = await db.from("announcements").delete().eq("id", id);
  if (error) {
    throw new Error("刪除失敗：" + error.message);
  }

  updateTag("announcements");
}
