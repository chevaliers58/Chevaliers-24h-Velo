export type ActivitySport = "velo" | "course" | "marche";

export const SPORT_INFO: Record<
  ActivitySport,
  { label: string; short: string; emoji: string; verb: string }
> = {
  velo: { label: "Sortie vélo", short: "Vélo", emoji: "🚴", verb: "roulé" },
  course: { label: "Course à pied", short: "Course", emoji: "🏃", verb: "couru" },
  marche: { label: "Marche", short: "Marche", emoji: "🥾", verb: "marché" },
};

export function getActivitySport(act: { note?: string | null } | null | undefined): ActivitySport {
  if (!act?.note) return "velo";
  const n = act.note.toLowerCase();
  if (
    n.startsWith("[course]") ||
    n.startsWith("[course_a_pied]") ||
    n.startsWith("[run]") ||
    n.startsWith("[running]") ||
    n.includes("#course") ||
    n.includes("#run")
  ) {
    return "course";
  }
  if (
    n.startsWith("[marche]") ||
    n.startsWith("[walk]") ||
    n.startsWith("[rando]") ||
    n.includes("#marche") ||
    n.includes("#walk")
  ) {
    return "marche";
  }
  return "velo";
}

export function cleanActivityNote(note?: string | null): string {
  if (!note) return "";
  return note
    .replace(/^\[(course|course_a_pied|run|running|velo|marche|walk|rando)\]\s*/i, "")
    .trim();
}
