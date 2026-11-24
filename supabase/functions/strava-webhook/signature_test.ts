import { verifyStravaSignature } from "./signature.ts";

Deno.test("Strava signature rejects altered or stale events", async () => {
  const timestamp = 1700000000;
  const secret = "local-test-signing-secret";
  const encoder = new TextEncoder();
  const body = encoder.encode('{"object_id":123}');
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const bytes = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(timestamp + '.{"object_id":123}'),
  );
  const signature = Array.from(new Uint8Array(bytes), (value) =>
    value.toString(16).padStart(2, "0"),
  ).join("");
  const header = `t=${timestamp},v1=${signature}`;
  const cases = [
    [await verifyStravaSignature(header, body, secret, timestamp), true],
    [await verifyStravaSignature(header, encoder.encode("{}"), secret, timestamp), false],
    [await verifyStravaSignature(header, body, "incorrect", timestamp), false],
    [await verifyStravaSignature(header, body, secret, timestamp + 301), false],
    [await verifyStravaSignature(null, body, secret, timestamp), false],
    [await verifyStravaSignature(header + ",t=1", body, secret, timestamp), false],
    [await verifyStravaSignature("t=1700000000,v1=bad", body, secret, timestamp), false],
  ];
  for (const [actual, expected] of cases) {
    if (actual !== expected) throw new Error("Unexpected webhook signature validation result");
  }
});
