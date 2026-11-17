/** Diagnostic en lecture seule : utilise exclusivement les variables publiques du projet. */
import { createClient } from "@supabase/supabase-js";

async function runDiagnostics() {
  const url = process.env["VITE_SUPABASE_URL"]?.trim().replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
  const key = process.env["VITE_SUPABASE_PUBLISHABLE_KEY"]?.trim();
  let legacyAnon = false;
  try {
    if (key) legacyAnon = JSON.parse(Buffer.from(key.split(".")[1] ?? "", "base64url").toString()).role === "anon";
  } catch { /* une clé opaque n'est pas un JWT */ }
  if (!url || !/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url) ||
      !key || (!key.startsWith("sb_publishable_") && !legacyAnon)) {
    console.error("Configure VITE_SUPABASE_URL et une clé publishable ou anon valide. Aucune clé privilégiée.");
    process.exitCode = 1;
    return;
  }
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  console.log("Diagnostic en lecture seule :", url);
  // Un visiteur doit pouvoir lire les patrouilles et vues publiques,
  // mais les tables profiles et activities restent réservées aux membres.
  for (const table of ["patrols", "profiles_public", "activities_public"]) {
    const { error } = await supabase.from(table).select("*").limit(1);
    if (error) {
      console.error(table + " : " + error.message);
      process.exitCode = 1;
    } else console.log(table + " : lecture OK");
  }
}

runDiagnostics().catch((error) => {
  console.error("Échec du diagnostic :", error);
  process.exitCode = 1;
});
