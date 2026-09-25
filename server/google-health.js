import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import { OAuth2Client } from "google-auth-library";

export const TOKEN_COOKIE = "biosync_google_health";
export const STATE_COOKIE = "biosync_google_health_state";
export const ACTIVITY_SCOPE =
  "https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly";

export function oauthClient() {
  const {
    GOOGLE_HEALTH_CLIENT_ID,
    GOOGLE_HEALTH_CLIENT_SECRET,
    GOOGLE_HEALTH_REDIRECT_URI,
  } = process.env;
  if (
    !GOOGLE_HEALTH_CLIENT_ID ||
    !GOOGLE_HEALTH_CLIENT_SECRET ||
    !GOOGLE_HEALTH_REDIRECT_URI
  )
    return null;
  return new OAuth2Client(
    GOOGLE_HEALTH_CLIENT_ID,
    GOOGLE_HEALTH_CLIENT_SECRET,
    GOOGLE_HEALTH_REDIRECT_URI,
  );
}

function secretKey() {
  const secret = process.env.GOOGLE_HEALTH_COOKIE_SECRET;
  if (!secret || secret.length < 32)
    throw new Error(
      "GOOGLE_HEALTH_COOKIE_SECRET must contain at least 32 characters.",
    );
  return createHash("sha256").update(secret).digest();
}

export function sealSession(session) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", secretKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(session)),
    cipher.final(),
  ]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString(
    "base64url",
  );
}

export function openSession(value) {
  if (!value) return null;
  try {
    const bytes = Buffer.from(value, "base64url");
    const decipher = createDecipheriv(
      "aes-256-gcm",
      secretKey(),
      bytes.subarray(0, 12),
    );
    decipher.setAuthTag(bytes.subarray(12, 28));
    const plaintext = Buffer.concat([
      decipher.update(bytes.subarray(28)),
      decipher.final(),
    ]);
    return JSON.parse(plaintext.toString("utf8"));
  } catch {
    return null;
  }
}

export function readCookies(req) {
  return Object.fromEntries(
    (req.headers.cookie || "")
      .split(";")
      .filter(Boolean)
      .map((part) => {
        const separator = part.indexOf("=");
        return [
          part.slice(0, separator).trim(),
          decodeURIComponent(part.slice(separator + 1).trim()),
        ];
      }),
  );
}

export function cookie(name, value, maxAge, path = "/api/google-health") {
  return `${name}=${encodeURIComponent(value)}; Path=${path}; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export function setCookies(res, values) {
  const existing = res.getHeader("Set-Cookie");
  res.setHeader("Set-Cookie", [
    ...(Array.isArray(existing) ? existing : existing ? [existing] : []),
    ...values,
  ]);
}

export function json(res, status, body) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.status(status).json(body);
}

export async function authorizedClient(session) {
  if (!session?.refreshToken) return null;
  const client = oauthClient();
  if (!client) return null;
  client.setCredentials({ refresh_token: session.refreshToken });
  await client.getAccessToken();
  return client;
}

export function durationSeconds(value) {
  const seconds = Number.parseFloat(String(value || "").replace(/s$/, ""));
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : 0;
}
