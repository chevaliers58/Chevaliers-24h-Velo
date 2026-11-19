// Strava validates signed webhook events over the timestamp and the raw request body.
// See https://developers.strava.com/docs/webhookexample/.
export async function verifyStravaSignature(
  header: string | null,
  rawBody: Uint8Array,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): Promise<boolean> {
  if (!header || !secret) return false;
  const parts = header.split(",").map((part) => part.trim());
  const timestamps = parts.filter((part) => part.startsWith("t="));
  const signatures = parts.filter((part) => part.startsWith("v1="));
  if (timestamps.length !== 1 || signatures.length !== 1) return false;
  const timestamp = timestamps[0].slice(2);
  const signature = signatures[0].slice(3);
  if (!/^\d+$/.test(timestamp) || !/^[0-9a-fA-F]{64}$/.test(signature)) return false;
  const seconds = Number(timestamp);
  if (!Number.isSafeInteger(seconds) || Math.abs(nowSeconds - seconds) > 300) return false;

  const encoder = new TextEncoder();
  const prefix = encoder.encode(timestamp + ".");
  const payload = new Uint8Array(prefix.length + rawBody.length);
  payload.set(prefix);
  payload.set(rawBody, prefix.length);
  const digest = new Uint8Array(32);
  for (let i = 0; i < digest.length; i++) {
    digest[i] = Number.parseInt(signature.slice(i * 2, i * 2 + 2), 16);
  }
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  return crypto.subtle.verify("HMAC", key, digest, payload);
}
