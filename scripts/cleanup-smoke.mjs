import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

const api = process.env.SUPABASE_URL;
const endpoint = process.env.CLEANUP_URL;
const db = process.env.LOCAL_DB_URL;
assert.match(api, /^http:\/\/127\.0\.0\.1:\d+$/);
assert.equal(api, process.env.E2E_EXPECTED_API_URL);
assert.match(endpoint, /^http:\/\/127\.0\.0\.1:\d+$/);
const dbUrl = new URL(db);
assert.equal(dbUrl.hostname, "127.0.0.1");
assert.equal(dbUrl.protocol, "postgresql:");
const service = createClient(api, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const makeClient = () =>
  createClient(api, process.env.LOCAL_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
const password = "Synthetic-cleanup-test-123!";
const ago = (days) => new Date(Date.now() - days * 86400000).toISOString();
const date = new Date().toISOString().slice(0, 10);
function good(result) {
  assert.equal(result.error, null, result.error?.message);
  return result.data;
}
async function user(label, admin = false) {
  const email = label + "@example.com";
  const { user: u } = good(
    await service.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: label },
    }),
  );
  if (admin) good(await service.from("user_roles").insert({ user_id: u.id, role: "admin" }));
  const client = makeClient();
  const { session } = good(await client.auth.signInWithPassword({ email, password }));
  return { id: u.id, token: session.access_token };
}
async function file(owner, label, extension = "png") {
  const name = owner.id + "_" + label + "." + extension;
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aBt8AAAAASUVORK5CYII=",
    "base64",
  );
  const bytes =
    extension === "gpx" ? Buffer.from('<?xml version="1.0"?><gpx version="1.1"></gpx>') : png;
  const contentType = extension === "gpx" ? "application/gpx+xml" : "image/png";
  good(await service.storage.from("proofs").upload(name, bytes, { contentType }));
  return { name, url: service.storage.from("proofs").getPublicUrl(name).data.publicUrl };
}
async function alive(f) {
  return (await fetch(f.url, { cache: "no-store" })).ok;
}
async function activity(owner, fields, ageApproved) {
  const a = good(
    await service
      .from("activities")
      .insert({
        user_id: owner.id,
        ride_date: date,
        km: 12,
        ...fields,
      })
      .select("*")
      .single(),
  );
  if (ageApproved !== undefined) {
    good(
      await service
        .from("activities")
        .update({ validated_at: ago(ageApproved) })
        .eq("id", a.id),
    );
  }
  return a;
}
async function row(a) {
  return good(await service.from("activities").select("*").eq("id", a.id).maybeSingle());
}
async function invoke(token, body, cronSecret) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: "Bearer " + token } : {}),
      ...(cronSecret ? { "x-cron-secret": cronSecret } : {}),
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
  const report = await response.json();
  return { status: response.status, report };
}
const scout = await user("cleanup-scout");
const other = await user("cleanup-other");
const staff = await user("cleanup-admin", true);
const old = await file(scout, "old-photo");
const oldTrack = await file(scout, "old-gpx", "gpx");
const fresh = await file(scout, "recent-photo");
const shared = await file(scout, "shared-photo");
const victim = await file(other, "unreferenced-recent-photo");
const pendingPhoto = await file(scout, "expired-pending-photo");
const pendingTrack = await file(scout, "expired-pending-gpx", "gpx");
const recentPending = await file(scout, "recent-pending");
const oldOrphan = await file(scout, "old-orphan");
const newOrphan = await file(scout, "new-orphan");
const oldAct = await activity(
  scout,
  {
    proof_path: old.url,
    gpx_path: oldTrack.url,
    strava_link: "https://www.strava.com/activities/100",
    note: "[course] private test note",
  },
  31,
);
const newAct = await activity(
  scout,
  {
    proof_path: fresh.url,
    strava_link: "https://www.strava.com/activities/101",
    note: "recent note",
  },
  29,
);
const sharedOld = await activity(
  scout,
  { proof_path: shared.url, strava_link: "https://www.strava.com/activities/102" },
  32,
);
const sharedNew = await activity(
  scout,
  { proof_path: shared.url, strava_link: "https://www.strava.com/activities/103" },
  2,
);
const spoofed = await activity(
  scout,
  { proof_path: victim.url, strava_link: "https://www.strava.com/activities/104" },
  33,
);
const stalePending = await activity(scout, {
  proof_path: pendingPhoto.url,
  gpx_path: pendingTrack.url,
  created_at: ago(61),
});
const keepPending = await activity(scout, { proof_path: recentPending.url, created_at: ago(59) });
for (const a of [oldAct, newAct, sharedOld, sharedNew, spoofed])
  assert.equal((await row(a)).status, "approved");
assert.equal((await row(stalePending)).status, "pending");
assert.ok(Date.parse((await row(oldAct)).validated_at) < Date.now() - 30 * 86400000);
// Artificially age only the synthetic orphan's metadata for the test.
assert.match(oldOrphan.name, /^[a-f0-9-]+_old-orphan\.png$/);
execFileSync(
  "psql",
  [
    db,
    "-X",
    "-v",
    "ON_ERROR_STOP=1",
    "-c",
    "update storage.objects set created_at = now() - interval '8 days' where bucket_id = 'proofs' and name = '" +
      oldOrphan.name +
      "'",
  ],
  { stdio: "pipe" },
);
const groupOld = good(
  await service
    .from("group_rides")
    .insert({ created_by: scout.id, ride_date: date, sport: "velo", created_at: ago(31) })
    .select("id")
    .single(),
);
const groupNew = good(
  await service
    .from("group_rides")
    .insert({ created_by: scout.id, ride_date: date, sport: "velo", created_at: ago(2) })
    .select("id")
    .single(),
);
const countdown = good(
  await service
    .from("countdowns")
    .insert({ title: "Échéance test", target_date: ago(2), is_active: true })
    .select("id")
    .single(),
);

assert.equal((await invoke(null, { dry_run: true })).status, 401);
assert.equal((await invoke(scout.token, { dry_run: true })).status, 403);
assert.equal((await invoke(null, { dry_run: true }, "invalid-test-secret")).status, 401);
assert.equal((await invoke(staff.token, "{ malformed")).status, 400);
assert.equal((await invoke(staff.token, { dry_run: "true" })).status, 400);
console.log("PASS cleanup authentication and malformed request safety");
const dry = await invoke(staff.token, { dry_run: true });
assert.equal(dry.status, 200, JSON.stringify(dry.report));
assert.equal(dry.report["aperçu"], true);
assert.equal(dry.report.sorties_en_attente_supprimees, 1);
assert.equal(dry.report.photos_de_preuve_effacees, 3);
assert.equal(dry.report.groupes_vides_supprimes, 1);
assert.equal(dry.report.comptes_a_rebours_desactives, 1);
assert.ok(await row(stalePending));
assert.equal((await row(oldAct)).proof_path, old.url);
assert.ok(await alive(old));
assert.ok(await alive(oldOrphan));
assert.equal(good(await service.from("cleanup_runs").select("id")).length, 0);
console.log("PASS dry run changes nothing");
const run = await invoke(staff.token, { dry_run: false });
assert.equal(run.status, 200, JSON.stringify(run.report));
assert.equal(run.report.photos_de_preuve_effacees, 3);
const cleaned = await row(oldAct);
assert.equal(cleaned.proof_path, null);
assert.equal(cleaned.strava_link, null);
assert.equal(cleaned.note, "[course]");
assert.equal(cleaned.gpx_path, oldTrack.url);
assert.equal(Number(cleaned.km), 12);
assert.equal(cleaned.ride_date, date);
assert.equal(cleaned.status, "approved");
assert.equal(await alive(old), false);
assert.ok(await alive(oldTrack));
assert.equal((await row(newAct)).proof_path, fresh.url);
assert.equal((await row(newAct)).note, "recent note");
assert.ok(await alive(fresh));
console.log("PASS 30-day cleanup retains kilometers, sport, date and GPX");
assert.equal((await row(sharedOld)).proof_path, null);
assert.equal((await row(sharedNew)).proof_path, shared.url);
assert.ok(await alive(shared));
assert.equal((await row(spoofed)).proof_path, null);
assert.ok(await alive(victim));
console.log("PASS shared and other-owner file protection");
assert.equal(await row(stalePending), null);
assert.equal(await alive(pendingPhoto), false);
assert.equal(await alive(pendingTrack), false);
assert.ok(await row(keepPending));
assert.ok(await alive(recentPending));
assert.equal(await alive(oldOrphan), false);
assert.ok(await alive(newOrphan));
console.log("PASS 60-day pending and 7-day orphan retention");
assert.equal(
  good(await service.from("group_rides").select("id").eq("id", groupOld.id).maybeSingle()),
  null,
);
assert.ok(good(await service.from("group_rides").select("id").eq("id", groupNew.id).maybeSingle()));
assert.equal(
  good(await service.from("countdowns").select("is_active").eq("id", countdown.id).single())
    .is_active,
  false,
);
assert.equal(good(await service.from("cleanup_runs").select("id")).length, 1);
const scoutClient = makeClient();
good(await scoutClient.auth.signInWithPassword({ email: "cleanup-scout@example.com", password }));
assert.equal(good(await scoutClient.from("cleanup_runs").select("id")).length, 0);
const second = await invoke(staff.token, { dry_run: false });
assert.equal(second.status, 200, JSON.stringify(second.report));
assert.equal(second.report.photos_de_preuve_effacees, 0);
assert.equal(second.report.sorties_en_attente_supprimees, 0);
assert.equal(second.report.fichiers_effaces, 0);
assert.ok(await alive(oldTrack));
console.log("PASS groups, countdowns, admin-only cleanup journal, repeated run");
console.log("CLEANUP_SMOKE_OK");
