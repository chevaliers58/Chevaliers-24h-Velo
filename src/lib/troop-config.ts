// Troupe-specific public configuration. Values are supplied at build time by Vite.
const env = import.meta.env;

export const TROOP_NAME = env?.["VITE_TROOP_NAME"]?.trim() || "Votre troupe";
export const SITE_URL = (env?.["VITE_SITE_URL"] || "").replace(/\/+$/, "");
const clubUrl = env?.["VITE_TROOP_STRAVA_CLUB_URL"]?.trim() || "";
export const TROOP_STRAVA_CLUB_URL = clubUrl.startsWith("https://") ? clubUrl : "";
