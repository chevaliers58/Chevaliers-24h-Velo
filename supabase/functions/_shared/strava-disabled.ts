// No secrets, database access, or network calls are needed by this handler.
export function stravaDisabled(_request: Request): Response {
  return new Response("Automatic Strava integration is disabled.", { status: 410 });
}
