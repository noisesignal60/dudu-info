import "server-only";

import { cacheTag } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type AdminRow = {
  id: string;
  username: string;
  displayName: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};

export async function listAdmins(): Promise<AdminRow[]> {
  "use cache";
  cacheTag("admin-admins");

  const db = supabaseAdmin();
  const { data, error } = await db
    .from("admins")
    .select("id, username, display_name, is_active, last_login_at, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[admins] list error", error);
    return [];
  }

  return (data ?? []).map((r) => ({
    id: r.id as string,
    username: r.username as string,
    displayName: r.display_name as string,
    isActive: (r.is_active as boolean | null) ?? true,
    lastLoginAt: r.last_login_at as string | null,
    createdAt: r.created_at as string,
  }));
}

export async function getAdminById(id: string): Promise<AdminRow | null> {
  "use cache";
  cacheTag(`admin-admin-${id}`);

  const db = supabaseAdmin();
  const { data } = await db
    .from("admins")
    .select("id, username, display_name, is_active, last_login_at, created_at")
    .eq("id", id)
    .maybeSingle();

  if (!data) return null;
  return {
    id: data.id as string,
    username: data.username as string,
    displayName: data.display_name as string,
    isActive: (data.is_active as boolean | null) ?? true,
    lastLoginAt: data.last_login_at as string | null,
    createdAt: data.created_at as string,
  };
}
