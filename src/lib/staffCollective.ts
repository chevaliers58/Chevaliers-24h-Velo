import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { ActivitySport } from "@/lib/activity";

const db = supabase as unknown as SupabaseClient;

export type StaffCollectiveDistance = {
  patrol_id: string | null;
  ride_date: string;
  sport: ActivitySport;
  km: number;
  rides: number;
};

/** Public totals only; no staff user IDs are read or generated. */
export async function fetchStaffCollectiveDistances(
  from?: string,
  to?: string,
): Promise<StaffCollectiveDistance[]> {
  const pageSize = 1000;
  const rows: StaffCollectiveDistance[] = [];
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await db
      .rpc("staff_collective_distances", { _from: from ?? null, _to: to ?? null })
      .range(offset, offset + pageSize - 1);
    if (error) throw error;
    const page = (data ?? []) as StaffCollectiveDistance[];
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}
