import "server-only";

import { cacheTag } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type Department = {
  id: string;
  name: string;
  sortOrder: number;
  createdAt: string;
};

export async function listDepartments(): Promise<Department[]> {
  "use cache";
  cacheTag("reports-departments");

  const db = supabaseAdmin();
  const { data } = await db
    .from("departments")
    .select("id, name, sort_order, created_at")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  return (data ?? []).map((r) => ({
    id: r.id as string,
    name: r.name as string,
    sortOrder: Number(r.sort_order ?? 0),
    createdAt: r.created_at as string,
  }));
}
