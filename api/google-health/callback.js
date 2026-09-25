import {
  cookie,
  json,
  oauthClient,
  readCookies,
  sealSession,
  setCookies,
  STATE_COOKIE,
  TOKEN_COOKIE,
} from "../../server/google-health.js";

export default async function callback(req, res) {
  if (req.method !== "GET")
    return json(res, 405, { error: "Method not allowed" });
  const cookies = readCookies(req);
  const { code, state, error } = req.query;
  setCookies(res, [cookie(STATE_COOKIE, "", 0)]);

  if (error) return res.redirect("/?googleHealth=denied");
  if (!state || !cookies[STATE_COOKIE] || state !== cookies[STATE_COOKIE])
    return res.redirect("/?googleHealth=invalid_state");

  const client = oauthClient();
  if (!client || !code) return res.redirect("/?googleHealth=setup_error");
  try {
    const { tokens } = await client.getToken(code);
    if (!tokens.refresh_token)
      return res.redirect("/?googleHealth=missing_refresh_token");
    const session = sealSession({
      refreshToken: tokens.refresh_token,
      connectedAt: new Date().toISOString(),
    });
    setCookies(res, [cookie(TOKEN_COOKIE, session, 60 * 60 * 24 * 30)]);
    return res.redirect("/?googleHealth=connected");
  } catch {
    return res.redirect("/?googleHealth=authorization_error");
  }
}
