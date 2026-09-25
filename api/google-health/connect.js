import { randomBytes } from "node:crypto";
import {
  ACTIVITY_SCOPE,
  cookie,
  json,
  oauthClient,
  setCookies,
  STATE_COOKIE,
} from "../../server/google-health.js";

export default function connect(req, res) {
  if (req.method !== "GET")
    return json(res, 405, { error: "Method not allowed" });
  const client = oauthClient();
  if (!client)
    return json(res, 503, {
      error: "Google Health OAuth belum dikonfigurasi di environment Vercel.",
    });

  const state = randomBytes(32).toString("base64url");
  setCookies(res, [cookie(STATE_COOKIE, state, 300)]);
  res.setHeader("Cache-Control", "no-store");
  return res.redirect(
    client.generateAuthUrl({
      access_type: "offline",
      include_granted_scopes: true,
      prompt: "consent",
      scope: [ACTIVITY_SCOPE],
      state,
    }),
  );
}
