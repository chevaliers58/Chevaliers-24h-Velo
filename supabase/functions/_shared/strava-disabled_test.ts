import { stravaDisabled } from "./strava-disabled.ts";

Deno.test("retired Strava handler rejects OAuth and webhook requests", async () => {
  for (const method of ["GET", "POST", "OPTIONS", "DELETE"]) {
    const response = stravaDisabled(new Request("https://example.invalid/strava?code=fake", { method }));
    if (response.status !== 410) throw new Error(`${method} unexpectedly accepted`);
    if ((await response.text()) !== "Automatic Strava integration is disabled.") {
      throw new Error("Unexpected retired endpoint response");
    }
  }
});
