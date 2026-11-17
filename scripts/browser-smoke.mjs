// @ts-check
// Runs only against a disposable Supabase stack in GitHub CI.
// No production accounts, credentials or external activity requests.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const origin = process.env.E2E_WEB_ORIGIN;
assert.match(origin, /^http:\/\/127\.0\.0\.1:\d+$/);
const base = origin + "/velo";
const api = process.env.VITE_SUPABASE_URL;
assert.match(api, /^http:\/\/127\.0\.0\.1:\d+$/);
assert.equal(api, process.env.E2E_EXPECTED_API_URL);
const key = process.env.LOCAL_SERVICE_ROLE_KEY;
assert.ok(key);
const admin = createClient(api, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const { chromium } = await import(process.env.E2E_PLAYWRIGHT);
const browser = await chromium.launch({ headless: true });
const password = "Synthetic-e2e-password-123!";
const email = "scout-e2e@example.com";
const adminEmail = "admin-e2e@example.com";
const patrolName = "Patrouille Test Navigateur";
const scoutName = "Scout Test Navigateur";
const totem = "E2E Scout";
let stage = "initialization";

function good(result) {
  assert.equal(result.error, null, result.error?.message);
  return result.data;
}
async function eventually(fn, label, timeout = 25000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const value = await fn();
    if (value) return value;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("Timed out: " + label);
}
async function context() {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    serviceWorkers: "block",
    acceptDownloads: true,
  });
  // Deny all external network calls (Strava, maps, emails, tracking, CDN).
  await ctx.route("**/*", (r) => {
    const u = new URL(r.request().url());
    return u.origin === origin || u.origin === api ? r.continue() : r.abort();
  });
  return ctx;
}
async function login(page, address) {
  await page.goto(base + "/auth");
  await page.locator("#login-email").fill(address);
  await page.locator("#login-pw").fill(password);
  await page.getByRole("button", { name: "Se connecter", exact: true }).click();
  await page.waitForURL((u) => u.pathname === "/velo/" || u.pathname === "/velo", {
    timeout: 30000,
  });
}
async function activities(id) {
  return good(await admin.from("activities").select("*").eq("user_id", id));
}
try {
  stage = "seed only synthetic patrol and admin";
  const patrol = good(
    await admin
      .from("patrols")
      .insert({ name: patrolName, category: "homme" })
      .select("id")
      .single(),
  );
  const created = good(
    await admin.auth.admin.createUser({
      email: adminEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: "Admin Test Navigateur", patrol_id: patrol.id, scout_year: "1" },
    }),
  );
  good(await admin.from("user_roles").insert({ user_id: created.user.id, role: "admin" }));
  stage = "anonymous access and protected route";
  const guest = await context();
  const page = await guest.newPage();
  await page.goto(base + "/");
  await page.getByText("Chevaliers 58", { exact: false }).first().waitFor();
  await page.goto(base + "/admin");
  await page.waitForURL((u) => u.pathname.endsWith("/auth"));
  console.log("PASS anonymous protected route");
  stage = "signup UI";
  await page.getByRole("tab", { name: "Créer un compte" }).click();
  await page.locator("#signup-email").fill(email);
  await page.locator("#signup-pw").fill(password);
  await page.locator("#signup-name").fill(scoutName);
  await page.locator("#signup-totem").fill(totem);
  await page.getByRole("combobox").filter({ hasText: "Choisir patrouille" }).click();
  await page.getByRole("option", { name: new RegExp(patrolName) }).click();
  await page.getByRole("combobox").filter({ hasText: "Choisir l'année" }).click();
  await page.getByRole("option", { name: "1ère année (Novice)" }).click();
  await page.getByRole("button", { name: "Créer mon compte scout" }).click();
  const scout = await eventually(async () => {
    const users = good(await admin.auth.admin.listUsers());
    return users.users.find((u) => u.email === email);
  }, "account registration");
  const profile = await eventually(async () => {
    const p = good(await admin.from("profiles").select("*").eq("id", scout.id).maybeSingle());
    return p?.patrol_id === patrol.id ? p : null;
  }, "profile registration");
  assert.equal(profile.totem, totem);
  // Simulate confirmation through the isolated Auth admin API if enabled;
  // this is not an email delivery test.
  if (!scout.email_confirmed_at)
    good(await admin.auth.admin.updateUserById(scout.id, { email_confirm: true }));
  await guest.close();
  console.log("PASS real signup and profile metadata");
  stage = "login with scout and deny admin";
  const member = await context();
  const scoutPage = await member.newPage();
  await login(scoutPage, email);
  await scoutPage.goto(base + "/admin");
  await scoutPage.getByText("Accès réservé aux chefs et admins").waitFor();
  console.log("PASS scout login and admin denial");
  stage = "submit manual link";
  await scoutPage.goto(base + "/mes-km");
  const form = scoutPage.locator("#enregistrer form");
  await form.locator("#distance-km").fill("12");
  await form.locator("#patrol-select").click();
  await scoutPage.getByRole("option", { name: new RegExp(patrolName) }).click();
  await form
    .getByPlaceholder("https://www.strava.com/activities/123456789...")
    .fill("https://www.strava.com/activities/123456789");
  // Synthetic two-segment track (equator; not a real member location).
  const segment = (xs) =>
    "<trkseg>" + xs.map((x) => '<trkpt lat="0" lon="' + x + '"/>').join("") + "</trkseg>";
  const track =
    '<gpx version="1.1" creator="CI"><trk>' +
    segment(["0", "0.003", "0.006", "0.009"]) +
    segment(["0.030", "0.033", "0.036", "0.039"]) +
    "</trk></gpx>";
  await form.locator('input[type="file"][accept*=".gpx"]').setInputFiles({
    name: "synthetic.gpx",
    mimeType: "application/gpx+xml",
    buffer: Buffer.from(track),
  });
  await form.locator("#ride-note").fill("E2E manual link");
  await form.locator('button[type="submit"]').click();
  const manual = await eventually(
    async () => (await activities(scout.id)).find((a) => a.note === "E2E manual link"),
    "manual activity persistence",
  );
  assert.equal(manual.status, "approved");
  assert.equal(Number(manual.km), 12);
  assert.equal(manual.source, "manual");
  assert.ok(manual.gpx_path?.startsWith(api));
  const gpxResponse = await fetch(manual.gpx_path);
  assert.ok(gpxResponse.ok);
  const storedGpx = await gpxResponse.text();
  assert.ok(storedGpx.includes('lon="0.003"'));
  assert.ok(storedGpx.includes('lon="0.036"'));
  assert.ok(!storedGpx.includes('lon="0"'));
  assert.ok(!storedGpx.includes('lon="0.039"'));
  assert.equal((storedGpx.match(/<trkseg>/g) ?? []).length, 2);
  assert.equal((storedGpx.match(/<trkpt /g) ?? []).length, 6);
  console.log("PASS manual activity and approved status");
  console.log("PASS GPX upload trims endpoints across segments");
  stage = "submit photo and verify storage";
  await scoutPage.goto(base + "/mes-km");
  await form.locator("#distance-km").fill("8");
  await form.locator("#patrol-select").click();
  await scoutPage.getByRole("option", { name: new RegExp(patrolName) }).click();
  await form.getByRole("button", { name: "Photo compteur" }).click();
  await form.locator('input[type="file"][accept="image/*"]').setInputFiles({
    name: "test-proof.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aBt8AAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await form.locator("#ride-note").fill("E2E photo proof");
  await form.locator('button[type="submit"]').click();
  const pending = await eventually(
    async () => (await activities(scout.id)).find((a) => a.note === "E2E photo proof"),
    "photo activity persistence",
  );
  assert.equal(pending.status, "pending");
  assert.ok(pending.proof_path?.startsWith(api));
  assert.ok((await fetch(pending.proof_path)).ok);
  console.log("PASS photo upload, existing public URL and pending approval");
  stage = "admin approval preserves photo";
  const staff = await context();
  const staffPage = await staff.newPage();
  await login(staffPage, adminEmail);
  await staffPage.goto(base + "/admin");
  await staffPage.getByRole("button", { name: "Valider les km" }).click();
  const approved = await eventually(
    async () =>
      (await activities(scout.id)).find((a) => a.id === pending.id && a.status === "approved"),
    "admin approval persisted",
  );
  assert.equal(approved.proof_path, pending.proof_path);
  assert.ok(approved.validated_at);
  assert.ok((await fetch(approved.proof_path)).ok);
  console.log("PASS admin approval and retained proof");
  stage = "public leaderboard after approval";
  const visitor = await context();
  const publicPage = await visitor.newPage();
  await publicPage.goto(base + "/");
  const rows = good(await admin.rpc("leaderboard", { _from: null, _to: null }));
  assert.ok(rows.some((r) => r.user_id === scout.id && Number(r.km) === 20));
  await publicPage.getByText(totem, { exact: false }).first().waitFor({ timeout: 30000 });
  console.log("PASS public ranking and 20 km total");
  stage = "admin CSV export";
  await staffPage.getByRole("button", { name: "Exporter en PDF" }).click();
  const dialog = staffPage.getByRole("dialog");
  await dialog.getByRole("combobox").filter({ hasText: "PDF" }).click();
  await staffPage.getByRole("option", { name: "CSV (tableur)" }).click();
  const download = staffPage.waitForEvent("download", { timeout: 30000 });
  await dialog.getByRole("button", { name: "Télécharger CSV" }).click();
  const csv = await download;
  assert.match(csv.suggestedFilename(), /\.csv$/i);
  const csvContent = await readFile(await csv.path(), "utf8");
  assert.ok(csvContent.includes(scoutName) || csvContent.includes(totem));
  assert.ok(csvContent.includes(patrolName));
  console.log("PASS admin CSV download with activity data");
  stage = "admin PDF export from bundled libraries";
  await dialog.waitFor({ state: "hidden", timeout: 10000 });
  await staffPage.getByRole("button", { name: "Exporter en PDF" }).click();
  await dialog.waitFor({ state: "visible" });
  const formatSelect = dialog.getByRole("combobox").nth(1);
  if (!(await formatSelect.innerText()).includes("PDF")) {
    await formatSelect.click();
    await staffPage.getByRole("option", { name: "PDF", exact: true }).click();
  }
  const pdfDownload = staffPage.waitForEvent("download", { timeout: 30000 });
  await dialog.getByRole("button", { name: "Télécharger PDF" }).click();
  const pdf = await pdfDownload;
  assert.match(pdf.suggestedFilename(), /\.pdf$/i);
  const contents = await readFile(await pdf.path());
  assert.equal(contents.subarray(0, 5).toString(), "%PDF-");
  assert.ok(contents.length > 1000);
  console.log("PASS admin PDF download without external CDN");
  stage = "late admin role response after account switch";
  const switching = await context();
  const switchingPage = await switching.newPage();
  let held = false;
  let releaseAdminResponse;
  const release = new Promise((resolve) => {
    releaseAdminResponse = resolve;
  });
  let responseDelivered = false;
  // Retrieve a genuine admin response before the switch, but delay delivery.
  await switchingPage.route("**/rest/v1/user_roles?*", async (route) => {
    const url = new URL(route.request().url());
    if (
      url.searchParams.get("user_id") === "eq." + created.user.id &&
      url.searchParams.get("role") === "eq.admin"
    ) {
      const response = await route.fetch();
      held = true;
      await release;
      await route.fulfill({ response });
      responseDelivered = true;
    } else {
      await route.continue();
    }
  });
  try {
    await login(switchingPage, adminEmail);
    await eventually(() => held, "captured genuine admin role response");
    await switchingPage.getByRole("button", { name: "Déconnexion", exact: true }).click();
    await switchingPage.getByRole("link", { name: "Connexion", exact: true }).first().click();
    await switchingPage.locator("#login-email").fill(email);
    await switchingPage.locator("#login-pw").fill(password);
    await switchingPage.getByRole("button", { name: "Se connecter", exact: true }).click();
    await switchingPage.waitForURL((u) => u.pathname === "/velo/" || u.pathname === "/velo");
    // SPA navigation: do not reload and accidentally cancel the delayed response.
    await switchingPage.evaluate((url) => {
      history.pushState({}, "", url);
      dispatchEvent(new PopStateEvent("popstate"));
    }, base + "/admin");
    await switchingPage.getByText("Accès réservé aux chefs et admins").waitFor();
    releaseAdminResponse?.();
    await eventually(() => responseDelivered, "delayed admin role delivered");
    await switchingPage.waitForTimeout(700);
    assert.ok(await switchingPage.getByText("Accès réservé aux chefs et admins").isVisible());
  } finally {
    releaseAdminResponse?.();
    await switching.close();
  }
  console.log("PASS stale admin role cannot restore access after account switch");
  stage = "mobile application and service worker";
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    serviceWorkers: "allow",
  });
  await mobile.route("**/*", (route) => {
    const url = new URL(route.request().url());
    return url.origin === origin || url.origin === api ? route.continue() : route.abort();
  });
  // Emulate the installed mode rather than just a narrow browser viewport.
  await mobile.addInitScript(() => {
    Object.defineProperty(navigator, "standalone", { value: true, configurable: true });
  });
  const mobilePage = await mobile.newPage();
  await mobilePage.goto(base + "/");
  await mobilePage.waitForURL((url) => url.pathname === "/velo/app");
  await mobilePage.locator("html.app-standalone").waitFor({ state: "attached" });
  await mobilePage.getByText("Le défi kilomètres des patrouilles").waitFor();
  await mobilePage.waitForFunction(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    return registration?.active?.state === "activated";
  });
  const registration = await mobilePage.evaluate(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    return { scope: reg?.scope, script: reg?.active?.scriptURL };
  });
  assert.equal(registration.scope, base + "/");
  assert.equal(registration.script, base + "/sw.js");
  await mobilePage.reload();
  await mobilePage.waitForFunction(() => !!navigator.serviceWorker.controller);
  const manifest = await (await fetch(base + "/manifest.webmanifest")).json();
  assert.equal(manifest.start_url, "/velo/app");
  assert.equal(manifest.scope, "/velo/");
  assert.equal(manifest.display, "standalone");
  for (const icon of manifest.icons) {
    const image = await fetch(origin + icon.src);
    assert.ok(image.ok);
    assert.ok(image.headers.get("content-type")?.includes("image/png"));
  }
  const cached = await mobilePage.evaluate(async () => {
    await fetch("/unrelated-site-asset.png").catch(() => {});
    await new Promise((resolve) => setTimeout(resolve, 500));
    const cache = await caches.open("chevaliers58-app-shell-v2");
    return (await cache.keys()).map((request) => new URL(request.url).pathname);
  });
  assert.ok(cached.includes("/velo/"));
  assert.ok(cached.every((path) => path.startsWith("/velo/")));
  await mobile.setOffline(true);
  const shell = await mobilePage.evaluate(async () => {
    const response = await caches.match("/velo/");
    return !!response && (await response.text()).includes("Chevaliers 58");
  });
  assert.ok(shell);
  await mobile.setOffline(false);
  await mobile.close();
  console.log("PASS mobile manifest, service worker scope, cached shell and icons");
  console.log("BROWSER_SMOKE_OK");
} catch (error) {
  console.error("Browser smoke failed at:", stage);
  throw error;
} finally {
  await browser.close();
}
