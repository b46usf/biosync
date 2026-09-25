import {
  json,
  oauthClient,
  openSession,
  readCookies,
  TOKEN_COOKIE,
} from "../../server/google-health.js";

export default function status(req, res) {
  if (req.method !== "GET")
    return json(res, 405, { error: "Method not allowed" });
  const configured = Boolean(
    oauthClient() && process.env.GOOGLE_HEALTH_COOKIE_SECRET?.length >= 32,
  );
  const session = configured
    ? openSession(readCookies(req)[TOKEN_COOKIE])
    : null;
  return json(res, 200, {
    configured,
    connected: Boolean(session?.refreshToken),
    connectedAt: session?.connectedAt || null,
  });
}
