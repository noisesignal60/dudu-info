import "server-only";

import { cacheTag } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type Announcement = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
};

function mapRow(r: Record<string, unknown>): Announcement {
  return {
    id: r.id as string,
    title: r.title as string,
    content: r.content as string,
    createdAt: r.created_at as string,
  };
}

/** 會員端：僅顯示啟用中的公告，最新在前 */
export async function getActiveAnnouncements(): Promise<Announcement[]> {
  "use cache";
  cacheTag("announcements");

  const db = supabaseAdmin();
  const { data, error } = await db
    .from("announcements")
    .select("id, title, content, created_at")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[announcements] active list error", error);
    return [];
  }
  return (data ?? []).map(mapRow);
}

/** 後台：全部公告（含停用），最新在前 */
export async function listAllAnnouncements(): Promise<Announcement[]> {
  "use cache";
  cacheTag("announcements");

  const db = supabaseAdmin();
  const { data, error } = await db
    .from("announcements")
    .select("id, title, content, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[announcements] list error", error);
    return [];
  }
  return (data ?? []).map(mapRow);
}
