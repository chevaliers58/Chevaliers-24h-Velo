/**
 * Diagnostic du backend Supabase configuré pour l'application.
 *
 * Lancement : npm run test:supabase
 * Ce script ne crée, ne modifie et ne supprime aucune donnée.
 */

import { supabase } from "../src/integrations/supabase/client";

async function runDiagnostics() {
  const url = process.env["VITE_SUPABASE_URL"]?.trim();
  const key = process.env["VITE_SUPABASE_PUBLISHABLE_KEY"]?.trim();

  if (!url || !key) {
    console.error("❌ Configure VITE_SUPABASE_URL et VITE_SUPABASE_PUBLISHABLE_KEY dans ton environnement.");
    process.exitCode = 1;
    return;
  }

  console.log("Diagnostic du backend Supabase");
  console.log("Projet configuré :", url);

  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    console.log("✅ Client Supabase initialisé.");
    console.log(
      sessionData.session
        ? "✅ Une session Auth est disponible."
        : "ℹ️ Aucune session Auth (normal pour un diagnostic hors navigateur).",
    );
  } catch (error) {
    console.error("❌ Impossible d'initialiser ou de joindre Supabase :", error);
    process.exitCode = 1;
    return;
  }

  const checks = [
    { name: "patrols", run: () => supabase.from("patrols").select("id").limit(1) },
    { name: "activities", run: () => supabase.from("activities").select("id").limit(1) },
  ];

  for (const check of checks) {
    try {
      const { error } = await check.run();
      if (error) {
        console.error(`❌ Table ${check.name} : ${error.message}`);
        process.exitCode = 1;
      } else {
        console.log(`✅ Table ${check.name} accessible.`);
      }
    } catch (error) {
      console.error(`❌ Table ${check.name} :`, error);
      process.exitCode = 1;
    }
  }
}

runDiagnostics().catch((error) => {
  console.error("Erreur fatale du diagnostic Supabase :", error);
  process.exitCode = 1;
});
