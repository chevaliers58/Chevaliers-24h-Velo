/**
 * Compatibility-only domain types for the Supabase-backed application.
 *
 * The former StandaloneDatabase/localStorage implementation has been retired.
 * Runtime helpers live in activity.ts and patrolEmblem.ts.
 */

export type PatrolCategory = "homme" | "femme" | "staff";

export interface Patrol {
  id: string;
  name: string;
  category: PatrolCategory;
  emoji?: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  totem: string | null;
  quali: string | null;
  scout_year: number | null;
  phone: string | null;
  birth_day?: number | null;
  birth_month?: number | null;
  strava_url: string | null;
  patrol_id: string | null;
  is_chef?: boolean;
  is_admin?: boolean;
  onboarded: boolean;
  created_at: string;
}

export type { ActivitySport } from "@/lib/activity";
export { SPORT_INFO, getActivitySport, cleanActivityNote } from "@/lib/activity";
export { getPatrolEmblem, getCustomPatrolEmojis, setCustomPatrolEmoji } from "@/lib/patrolEmblem";

export interface Activity {
  id: string;
  user_id: string;
  ride_date: string;
  km: number;
  proof_path: string | null;
  gpx_path?: string | null;
  strava_link: string | null;
  status: "pending" | "approved" | "rejected";
  sport?: import("@/lib/activity").ActivitySport;
  note: string | null;
  created_at: string;
}

export interface TimelineEvent {
  id: string;
  year: number;
  date_str: string;
  title: string;
  description: string;
  image_url: string | null;
  drive_url: string | null;
  tag: string;
  created_at: string;
}

export interface CountdownConfig {
  id: string;
  title: string;
  target_date: string;
  is_active: boolean;
  subtitle?: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: "admin" | "user";
}
