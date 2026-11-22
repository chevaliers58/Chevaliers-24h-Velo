/** Début du défi : aucune sortie ne peut être datée avant ce jour (contrôlé aussi par la base). */
export const CHALLENGE_START = "2026-09-27";
export const CHALLENGE_START_LABEL = "27 septembre 2026";

import { useQuery } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Season = { starts_on: string | null; ends_on: string; enabled: boolean };
const db = supabase as unknown as SupabaseClient;

export function brusselsDate(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Brussels",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (kind: string) => parts.find((p) => p.type === kind)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function useChallengeSeason() {
  const query = useQuery<Season>({
    queryKey: ["challenge-season"],
    queryFn: async () => {
      const { data, error } = await db
        .from("annual_points_settings")
        .select("starts_on,ends_on,enabled")
        .single();
      if (error || !data) throw error || new Error("Saison introuvable");
      return data as Season;
    },
    retry: false,
    staleTime: 0,
  });
  const today = brusselsDate();
  const start = query.data?.starts_on || CHALLENGE_START;
  const end = query.data?.ends_on || today;
  const latest = end < today ? end : today;
  const ready = !!query.data?.enabled && !!query.data.starts_on && !query.isError;
  const message = query.isPending
    ? "Chargement des dates de la saison…"
    : query.isError
      ? "Impossible de vérifier les dates de la saison. Réessaie plus tard."
      : !ready
        ? "La saison n’est pas encore ouverte par le staff."
        : `Les sorties doivent être comprises entre le ${start} et le ${latest}.`;
  return { start, end, today, latest, ready, message };
}
