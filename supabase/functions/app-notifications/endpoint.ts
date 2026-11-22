// The endpoint URL comes from an untrusted client. Only recognized browser
// push providers may receive server-side requests, including existing subscriptions.
export function isTrustedPushEndpoint(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 4096) return false;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.port || url.hash) {
      return false;
    }
    const host = url.hostname;
    return (
      host === "fcm.googleapis.com" ||
      host === "android.googleapis.com" ||
      host.endsWith(".push.services.mozilla.com") ||
      host === "push.apple.com" ||
      host.endsWith(".push.apple.com") ||
      host.endsWith(".notify.windows.com")
    );
  } catch {
    return false;
  }
}
