// =====================================================================
// Fonction Edge « menage » : ménage des données de la troupe
//
// Appelée chaque nuit par pg_cron (en-tête x-cron-secret) ou par un admin
// depuis la page Admin (jeton de session). Elle :
//  1. appelle cleanup_database() : sorties à plusieurs vides, comptes à
//     rebours dépassés, sorties en attente de plus de 60 jours, liens Strava
//     et descriptions des sorties validées depuis plus de 30 jours ;
//  2. efface les photos de preuve validées depuis plus de 30 jours
//     (les km restent, proof_path passe à null) ;
//  3. efface les fichiers orphelins de plus de 7 jours (proofs et backgrounds)
//     qui ne sont plus référencés nulle part ;
//  4. note le résultat dans cleanup_runs.
// Corps JSON optionnel : { "dry_run": true } = aperçu, rien n'est supprimé.
// =====================================================================
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const PHOTO_DAYS = 30;
const ORPHAN_DAYS = 7;
const MAX_FILES_PER_RUN = 300;
const siteUrl = (Deno.env.get("SITE_URL") ?? "http://localhost:3000").replace(/\/+$/, "");
const siteOrigin = new URL(siteUrl).origin;

const cors = {
  "Access-Control-Allow-Origin": siteOrigin,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

/** Only flat object names in this project's buckets may be removed. */
function fileName(value: string | null | undefined, bucket: string): string | null {
  if (!value) return null;
  try {
    let name = value.trim();
    if (name.includes("://")) {
      const url = new URL(name);
      if (url.origin !== new URL(SUPABASE_URL).origin) return null;
      const prefix = ["public", "sign", "authenticated"]
        .map((kind) => `/storage/v1/object/${kind}/${bucket}/`)
        .find((candidate) => url.pathname.startsWith(candidate));
      if (!prefix) return null;
      name = decodeURIComponent(url.pathname.slice(prefix.length));
    }
    if (Array.from(name).some((char) => char.charCodeAt(0) < 32)) return null;
    return /^[^/\\:?%]+$/.test(name) && !name.startsWith(".") ? name : null;
  } catch {
    return null;
  }
}

function ownedName(value: string | null, userId: string): string | null {
  const name = fileName(value, "proofs");
  return name && (name.startsWith(userId + "_") || name.startsWith("proposed_" + userId + "_"))
    ? name
    : null;
}

type ProofRow = {
  id: string;
  user_id: string;
  proof_path: string | null;
  gpx_path: string | null;
};

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 3600 * 1000).toISOString();

type PageResult<T> = {
  data: T[] | null;
  error: { message: string } | null;
};

/** Read every row, not just PostgREST's default first 1,000. */
async function loadAllRows<T>(
  fetchPage: (from: number, to: number) => PromiseLike<PageResult<T>>,
): Promise<PageResult<T>> {
  const rows: T[] = [];
  const pageSize = 1000;
  const maxRows = 100_000;
  for (let offset = 0; offset < maxRows; offset += pageSize) {
    const { data, error } = await fetchPage(offset, offset + pageSize - 1);
    if (error) return { data: null, error };
    rows.push(...(data ?? []));
    if (!data || data.length < pageSize) return { data: rows, error: null };
  }
  return {
    data: null,
    error: { message: `Plus de ${maxRows} lignes : nettoyage interrompu par sécurité` },
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "POST attendu" }, 405);

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  // ---------- Qui appelle ? ----------
  let source = "nuit";
  const cronSecret = req.headers.get("x-cron-secret");
  if (cronSecret) {
    const { data: ok } = await admin.rpc("cleanup_check_secret", { _secret: cronSecret });
    if (ok !== true) return json({ error: "Clé invalide" }, 401);
  } else {
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const { data: userData } = await admin.auth.getUser(token);
    const user = userData?.user;
    if (!user) return json({ error: "Connexion requise" }, 401);
    const { data: role } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!role) return json({ error: "Réservé aux admins" }, 403);
    source = "admin";
  }

  let dryRun = false;
  try {
    const rawBody = await req.text();
    if (rawBody.trim()) {
      const body = JSON.parse(rawBody);
      if (
        !body ||
        typeof body !== "object" ||
        Array.isArray(body) ||
        ("dry_run" in body && typeof body.dry_run !== "boolean")
      ) {
        return json({ error: "Corps JSON invalide" }, 400);
      }
      dryRun = body.dry_run === true;
    }
  } catch {
    return json({ error: "Corps JSON invalide" }, 400);
  }

  const report: Record<string, unknown> = { source, aperçu: dryRun };
  const errors: string[] = [];

  // Snapshot expired pending rows before SQL deletes them, including their owners.
  // A browser-supplied path must not let a privileged cleanup delete another file.
  const pending = await loadAllRows((from, to) =>
    admin
      .from("activities")
      .select("id, user_id, proof_path, gpx_path")
      .eq("status", "pending")
      .lt("created_at", daysAgo(60))
      .order("id")
      .range(from, to),
  );
  if (pending.error) return json({ ...report, erreurs: [pending.error.message] }, 500);
  const pendingRows = (pending.data ?? []) as ProofRow[];
  const expiredPendingIds = new Set(pendingRows.map((r) => r.id));

  // ---------- 1. Base de données ----------
  const { data: db, error: dbError } = await admin.rpc("cleanup_database", { _dry: dryRun });
  if (dbError) errors.push("base : " + dbError.message);
  const dbReport = (db ?? {}) as Record<string, unknown>;
  report.groupes_vides_supprimes = dbReport.groupes_vides_supprimes ?? 0;
  report.comptes_a_rebours_desactives = dbReport.comptes_a_rebours_desactives ?? 0;
  report.sorties_en_attente_supprimees = dbReport.sorties_en_attente_supprimees ?? 0;
  report.sorties_validees_nettoyees = dbReport.sorties_validees_nettoyees ?? 0;
  const returnedPaths = new Set((dbReport.fichiers_a_effacer as string[] | undefined) ?? []);
  const pendingFiles = pendingRows.flatMap((r) =>
    [r.proof_path, r.gpx_path].flatMap((path) => {
      const name = path && returnedPaths.has(path) ? ownedName(path, r.user_id) : null;
      return name ? [name] : [];
    }),
  );

  // ---------- 2. Photos de preuve validées depuis plus de 30 jours ----------
  const { data: oldProofs, error: proofError } = await admin
    .from("activities")
    .select("id, user_id, proof_path, gpx_path")
    .eq("status", "approved")
    .not("proof_path", "is", null)
    .lt("validated_at", daysAgo(PHOTO_DAYS))
    .order("validated_at")
    .order("id")
    .limit(MAX_FILES_PER_RUN);
  if (proofError) errors.push("photos : " + proofError.message);
  const photoRows = (oldProofs ?? []) as ProofRow[];
  const expiringPhotos = new Map(
    photoRows.filter((r) => ownedName(r.proof_path, r.user_id)).map((r) => [r.id, r.proof_path]),
  );
  const used = new Set<string>();

  // ---------- 3. Fichiers orphelins ----------
  const orphanFiles = { proofs: [] as string[], backgrounds: [] as string[] };
  if (!errors.length) {
    // Tout ce qui est encore référencé quelque part
    const [acts, challenges, routes, timeline, settings] = await Promise.all([
      loadAllRows((from, to) =>
        admin
          .from("activities")
          .select("id, status, proof_path, gpx_path")
          .order("id")
          .range(from, to),
      ),
      loadAllRows((from, to) =>
        admin.from("scout_challenges").select("gpx_template_path").order("id").range(from, to),
      ),
      loadAllRows((from, to) =>
        admin.from("proposed_routes").select("gpx_url").order("id").range(from, to),
      ),
      loadAllRows((from, to) =>
        admin.from("timeline").select("image_url").order("id").range(from, to),
      ),
      loadAllRows((from, to) =>
        admin.from("site_settings").select("value").order("key").range(from, to),
      ),
    ]);
    const queryErrors = [acts, challenges, routes, timeline, settings].filter((r) => r.error);
    if (queryErrors.length) {
      errors.push("références : " + queryErrors.map((r) => r.error!.message).join(", "));
    } else {
      for (const a of (acts.data ?? []) as Array<ProofRow & { status: string }>) {
        if (dryRun && a.status === "pending" && expiredPendingIds.has(a.id)) continue;
        // Exclude only the proof reference that is about to expire, never a GPX.
        if (expiringPhotos.get(a.id) !== a.proof_path) {
          const photo = fileName(a.proof_path, "proofs");
          if (photo) used.add("proofs/" + photo);
        }
        const gpx = fileName(a.gpx_path, "proofs");
        if (gpx) used.add("proofs/" + gpx);
      }
      for (const c of (challenges.data ?? []) as { gpx_template_path: string | null }[]) {
        const n = fileName(c.gpx_template_path, "proofs");
        if (n) used.add("proofs/" + n);
      }
      for (const r of (routes.data ?? []) as { gpx_url: string | null }[]) {
        const n = fileName(r.gpx_url, "proofs");
        if (n) used.add("proofs/" + n);
      }
      for (const t of (timeline.data ?? []) as { image_url: string | null }[]) {
        for (const b of ["proofs", "backgrounds"]) {
          const n = fileName(t.image_url, b);
          if (n) used.add(`${b}/${n}`);
        }
      }
      for (const s of (settings.data ?? []) as { value: string }[]) {
        const n = fileName(s.value, "backgrounds");
        if (n) used.add("backgrounds/" + n);
      }

      const limit = daysAgo(ORPHAN_DAYS);
      for (const bucket of ["proofs", "backgrounds"] as const) {
        for (let offset = 0; offset < 5000; offset += 1000) {
          const { data: list, error } = await admin.storage
            .from(bucket)
            .list("", { limit: 1000, offset, sortBy: { column: "name", order: "asc" } });
          if (error) {
            errors.push(`liste ${bucket} : ${error.message}`);
            break;
          }
          for (const f of list ?? []) {
            if (!f.id || f.name.startsWith(".")) continue; // dossiers et fichiers techniques
            if (used.has(`${bucket}/${f.name}`)) continue;
            if (!f.created_at || f.created_at > limit) continue; // trop récent : envoi en cours ?
            orphanFiles[bucket].push(f.name);
          }
          if (!list || list.length < 1000) break;
        }
      }
    }
  }

  // Never remove a file still referenced elsewhere. Only remove expired proof
  // files whose names belong to the activity owner. Clear stale/foreign/shared
  // references without deleting the other file.
  const photoFiles = photoRows
    .map((row) => ownedName(row.proof_path, row.user_id))
    .filter((name): name is string => !!name && !used.has("proofs/" + name));
  const expiredNames = new Set([...photoFiles, ...pendingFiles]);
  const orphanProofs = orphanFiles.proofs.filter((name) => !expiredNames.has(name));
  const toDelete = {
    proofs: [
      ...new Set([
        ...photoFiles,
        ...pendingFiles.filter((name) => !used.has("proofs/" + name)),
        ...orphanProofs,
      ]),
    ].slice(0, MAX_FILES_PER_RUN),
    backgrounds: orphanFiles.backgrounds.slice(0, MAX_FILES_PER_RUN),
  };
  const successful = new Set<string>();
  let detachedPhotos = 0;

  // If reference enumeration failed, do not issue privileged Storage deletes.
  if (!errors.length) {
    for (const bucket of ["proofs", "backgrounds"] as const) {
      const names = toDelete[bucket];
      for (let i = 0; i < names.length; i += 100) {
        const batch = names.slice(i, i + 100);
        if (!dryRun) {
          const { error } = await admin.storage.from(bucket).remove(batch);
          if (error) {
            errors.push(`suppression ${bucket} : ${error.message}`);
            continue;
          }
        }
        for (const name of batch) successful.add(`${bucket}/${name}`);
      }
    }
    for (const row of photoRows) {
      const name = ownedName(row.proof_path, row.user_id);
      if (name && !used.has("proofs/" + name) && !successful.has("proofs/" + name)) {
        continue; // Failed or deferred: keep the reference for a later run.
      }
      if (dryRun) {
        detachedPhotos++;
        continue;
      }
      const { data, error } = await admin
        .from("activities")
        .update({ proof_path: null })
        .eq("id", row.id)
        .eq("proof_path", row.proof_path ?? "")
        .eq("status", "approved")
        .lt("validated_at", daysAgo(PHOTO_DAYS))
        .select("id");
      if (error) errors.push("mise à jour des sorties : " + error.message);
      else detachedPhotos += data?.length ?? 0;
    }
  }
  report.photos_de_preuve_effacees = detachedPhotos;
  report.fichiers_orphelins_effaces =
    orphanProofs.filter((n) => successful.has("proofs/" + n)).length +
    orphanFiles.backgrounds.filter((n) => successful.has("backgrounds/" + n)).length;
  report.fichiers_effaces = successful.size;

  if (!dryRun) {
    const { error } = await admin.from("cleanup_runs").insert({
      trigger_source: source,
      details: { ...report, erreurs: errors },
    });
    if (error) errors.push("journal : " + error.message);
  }

  return json({ ...report, erreurs: errors }, errors.length ? 207 : 200);
});
