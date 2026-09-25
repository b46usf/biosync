import {
  cookie,
  json,
  oauthClient,
  openSession,
  readCookies,
  setCookies,
  TOKEN_COOKIE,
} from "../../server/google-health.js";

export default async function disconnect(req, res) {
  if (req.method !== "POST")
    return json(res, 405, { error: "Method not allowed" });
  const session = openSession(readCookies(req)[TOKEN_COOKIE]);
  if (session?.refreshToken) {
    try {
      await oauthClient()?.revokeToken(session.refreshToken);
    } catch {
      // Always clear local access even when Google's revocation endpoint is unavailable.
    }
  }
  setCookies(res, [cookie(TOKEN_COOKIE, "", 0)]);
  return json(res, 200, { disconnected: true });
}
