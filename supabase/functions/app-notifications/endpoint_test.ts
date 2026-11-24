import { isTrustedPushEndpoint } from "./endpoint.ts";

Deno.test("Only known HTTPS Web Push services are accepted", () => {
  const allowed = [
    "https://fcm.googleapis.com/fcm/send/test",
    "https://android.googleapis.com/gcm/send/test",
    "https://updates.push.services.mozilla.com/wpush/v2/test",
    "https://web.push.apple.com/test",
    "https://wns2.example.notify.windows.com/test",
  ];
  const rejected = [
    "http://fcm.googleapis.com/test",
    "https://fcm.googleapis.com.evil.invalid/test",
    "https://fcm.googleapis.com@evil.invalid/test",
    "https://evil.invalid@fcm.googleapis.com/test",
    "https://fcm.googleapis.com:444/test",
    "https://127.0.0.1/test",
    "https://[::1]/test",
    "https://169.254.169.254/test",
    "https://localhost/test",
    "https://evil.invalid/test",
    null,
    123,
  ];
  for (const value of allowed) {
    if (!isTrustedPushEndpoint(value)) throw new Error("Expected push provider was rejected");
  }
  for (const value of rejected) {
    if (isTrustedPushEndpoint(value)) throw new Error("Unexpected push provider was accepted");
  }
});
