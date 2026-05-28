import "server-only";

import { cacheTag } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type CommissionSettings = {
  id: string;
  rateA: number;
  rateB: number;
  rateC: number;
  rateD: number;
  rateE: number;
  newBonus: number;
  isActive: boolean;
  changedBy: string | null;
  createdAt: string;
};

export type CommissionWithChanger = CommissionSettings & {
  changerName: string | null;
};

export async function getActiveCommission(): Promise<CommissionSettings | null> {
  "use cache";
  cacheTag("commission-settings");

  const db = supabaseAdmin();
  const { data } = await db
    .from("commission_settings")
    .select("id, rate_a, rate_b, rate_c, rate_d, rate_e, new_bonus, is_active, changed_by, created_at")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  return mapRow(data);
}

export async function listCommissionHistory(
  limit = 50,
): Promise<CommissionWithChanger[]> {
  "use cache";
  cacheTag("commission-history");

  const db = supabaseAdmin();
  const { data } = await db
    .from("commission_settings")
    .select("id, rate_a, rate_b, rate_c, rate_d, rate_e, new_bonus, is_active, changed_by, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  const rows = (data ?? []).map(mapRow);

  const changerIds = Array.from(
    new Set(rows.map((r) => r.changedBy).filter((id): id is string => !!id)),
  );

  let nameMap = new Map<string, string>();
  if (changerIds.length) {
    const { data: admins } = await db
      .from("admins")
      .select("id, display_name, username")
      .in("id", changerIds);
    nameMap = new Map(
      (admins ?? []).map((a) => [
        a.id as string,
        (a.display_name as string) || (a.username as string),
      ]),
    );
  }

  return rows.map((r) => ({
    ...r,
    changerName: r.changedBy ? nameMap.get(r.changedBy) ?? null : null,
  }));
}

function mapRow(r: Record<string, unknown>): CommissionSettings {
  return {
    id: r.id as string,
    rateA: Number(r.rate_a),
    rateB: Number(r.rate_b),
    rateC: Number(r.rate_c),
    rateD: Number(r.rate_d),
    rateE: Number(r.rate_e),
    newBonus: Number(r.new_bonus ?? 0),
    isActive: r.is_active as boolean,
    changedBy: (r.changed_by as string | null) ?? null,
    createdAt: r.created_at as string,
  };
}
