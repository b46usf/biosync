# BS BioSync MVP

Responsive health and activity dashboard built with React, Vite, Tailwind CSS, Recharts, Lucide icons, and SweetAlert2. The project can be deployed as a static Vite app to Vercel.

## Run locally

```bash
npm install
npm run dev
```

Create a production build with `npm run build`. Vercel detects Vite automatically; the included `vercel.json` routes client-side app paths to the entry point.

## Wireframe and SRS alignment

This MVP follows the navigation and priorities in [`docs/biosync-wireframe-ui-ux.md`](docs/biosync-wireframe-ui-ux.md) and [`docs/biosync-srs-mvp.md`](docs/biosync-srs-mvp.md):

| Wireframe / SRS capability              | App surface                                          | Current MVP behavior                                                                                                                                                                                  |
| --------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Landing and onboarding (FR-02)          | Landing page → four-step SweetAlert flow → Dashboard | Goals, age range, body details, activity level and privacy intro; users connect devices from Connected devices after onboarding.                                                                      |
| Dashboard and daily metrics (FR-04)     | Dashboard                                            | Responsive score, streak, step/calorie/heart cards, activity trend and health snapshot using sample data.                                                                                             |
| Activity tracking (FR-05)               | Activity                                             | Record walking, running, cycling and hiking with browser GPS; view saved routes on an OpenStreetMap map; read/filter, edit, and delete activities.                                                    |
| Health trends and body goals (FR-06)    | Health → Body                                        | BMI, Kemenkes adult reference bands, formula-based body-fat estimate, reference-weight range, waist-to-height ratio, and a user-entered target. Includes limitations and a non-diagnostic disclaimer. |
| Challenges and badges (FR-07)           | Challenges                                           | Carousel, join/leave community challenges, create/edit/delete personal challenges and view demo badges.                                                                                               |
| Device sync (FR-03)                     | Connected devices / Personal Space                  | BLE heart-rate/cadence sensor on Connected devices; Google Health OAuth, sync, and disconnect only inside the Plus subscription features in Personal Space.                                        |
| Privacy, export, revoke, delete (FR-09) | Privacy center                                       | Permission controls, JSON export, consent toggle, disconnect and local demo-data deletion.                                                                                                            |
| Workspace subscription (FR-12)          | Personal Space                                      | Demo user starts on Free; Plus demo unlocks Google Health OAuth. Plan selection is stored in the encrypted local vault; payment is not configured.                                                   |
| Optional ownership beta (FR-10)         | Privacy center                                       | Explains the optional wallet boundary; no wallet or chain transaction is simulated.                                                                                                                   |

### Local demo security

- The first visit asks the demo user to create a local passphrase. Existing plaintext demo data is encrypted during this setup; returning users unlock the vault with that passphrase.
- Profile, body goals, activities, challenge membership, personal challenges, device selections and permissions, and consent are encrypted in localStorage with AES-256-GCM. A separate HMAC-SHA-256 authenticates the stored envelope. PBKDF2 with SHA-256 and a random per-vault salt derives the keys; keys and passphrase stay in memory only until the vault is locked or the page is closed.
- The passphrase cannot be reset: forgetting it means the encrypted local data cannot be recovered. Export data before deleting the vault if you need a copy.
- This is browser-side protection for a demo. It does not protect an unlocked session from malicious same-origin JavaScript/XSS or replace a server-side account and health-data backend. Activities, including GPS route coordinates, are encrypted in the local vault. Google OAuth refresh tokens are held only in an encrypted HttpOnly cookie on the user agent; Google Health data is fetched through Vercel serverless functions. Use HTTPS and a strong, unique passphrase.
- No diagnosis is provided, and the app does not write health data to a blockchain.

### Body calculator references

- Adult BMI bands use the Indonesian Ministry of Health's SKI 2023 definitions: under 18.5 (wasting), 18.5 to below 25 (normal), 25 to below 27 (overweight), and 27 or higher (obesity): [BKPK Kemenkes](https://www.badankebijakan.kemkes.go.id/daftar-frequently-asked-question-seputar-hasil-utama-ski-2023/hasil-utama-ski-2023/).
- Reference-weight range uses BMI 18.5 to 24.9 for adults and is shown as a range, not an ideal target.
- Body-fat percentage is an estimate from the Deurenberg adult equation (BMI, age, and sex), not a direct measurement: [Deurenberg et al., British Journal of Nutrition](https://www.cambridge.org/core/services/aop-cambridge-core/content/view/S0007114591000193). BMI itself does not directly measure body fat or distinguish fat from lean mass: [CDC BMI FAQ](https://www.cdc.gov/bmi/faq/).

## Live integrations

### Bluetooth LE

The Connected devices page can request a nearby BLE device and subscribe to standard Heart Rate, Running Speed and Cadence, or Cycling Speed and Cadence services when the browser and selected sensor expose them. This Web Bluetooth capability requires HTTPS (Vercel provides it), a browser with Web Bluetooth support, and an explicit user gesture and device permission. It does not make proprietary Apple Watch, Garmin, or Samsung protocols available to a web page.

### Google Health API OAuth

Google Health OAuth is shown under **Personal Space → BioSync Plus**. Connected devices is reserved for BLE sensor pairing. The server-side OAuth endpoints are Vercel Functions; the read-only activity and fitness scope is requested, and OAuth tokens are sealed with AES-256-GCM in a Secure, HttpOnly, SameSite cookie. Tokens are not stored in localStorage.

#### Google Cloud setup

1. Open [Google Health setup](https://developers.google.com/health/setup) and create or select a Google Cloud project.
2. Enable Google Health API. Create OAuth credentials for a **Web application**. The current Google Health setup flow also asks for `https://www.google.com` as an authorized redirect URI; add BioSync's callback URI too: `https://<your-vercel-domain>/api/google-health/callback`.
3. Configure the OAuth consent screen with app name, support email, developer contact, privacy policy, terms, and authorized domain. Set audience to **External** for personal Google accounts.
4. Under **Data Access**, add only `https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly`. This integration imports exercise records; it does not request write access.
5. While publishing status is **Testing**, add every Google account you will use under **Test users**. For production/public launch, complete Google's applicable OAuth verification and third-party security review for the requested Health scopes.
6. Copy the OAuth Client ID and Client Secret. Keep the secret private; never put it in frontend variables or commit it.

#### Vercel environment variables

In **Vercel Dashboard → project → Settings → Environment Variables**, add each variable separately. Select **Production**; select **Preview** only when you intend to test preview deployments. The redirect URI must match the Google OAuth client exactly, including scheme, hostname, path, and trailing-slash behavior:

| Name | Value |
| --- | --- |
| `GOOGLE_HEALTH_CLIENT_ID` | OAuth Client ID from Google Cloud |
| `GOOGLE_HEALTH_CLIENT_SECRET` | OAuth Client Secret from Google Cloud |
| `GOOGLE_HEALTH_REDIRECT_URI` | `https://<your-vercel-domain>/api/google-health/callback` |
| `GOOGLE_HEALTH_COOKIE_SECRET` | At least 32 random characters, e.g. `openssl rand -base64 48` |

Do not add a `VITE_` prefix. Vite exposes prefixed variables to the browser bundle, while these credentials must stay on the server. Keep `.env.local` out of Git. After saving variables, trigger a new deployment: environment variable changes do not update an already-built deployment. If you use a custom domain, register that production hostname as the callback; preview deployments need their own registered callback URL if OAuth will be tested there.

#### Verify the integration

1. Open the deployed Vercel URL over HTTPS, unlock the local vault, and navigate to **Personal Space**.
2. Select **Aktifkan Plus demo**. This only enables the demo feature and does not charge or create a paid subscription.
3. Select **Hubungkan Google Health**, choose an account listed as a test user, and grant the activity/fitness permission.
4. Return to Personal Space to sync exercise records or disconnect Google. Imported activity data is encrypted in the local vault.

For local API testing, use `npx vercel dev` so `/api/google-health/*` runs as Vercel Functions. Plain `npm run dev` runs only the Vite frontend. Vercel project variables for Development can be pulled with `vercel env pull`; alternatively use an untracked `.env.local` file.

### OpenStreetMap and GPS routes

Starting an outdoor activity requests browser location permission, records route points on-device, calculates distance, and saves the route in the encrypted vault when the activity finishes. Saved routes render as a selectable Leaflet polyline over OpenStreetMap tiles. The map is only requested while the Activity page is open; no route is uploaded to OpenStreetMap.

The default raster tiles are `https://tile.openstreetmap.org/{z}/{x}/{y}.png`, with visible OpenStreetMap attribution. The route itself is not uploaded, but the tile provider sees the user IP and tile area requests while that map is viewed. OSM's public tile service is best-effort and has no SLA; a higher-volume production deployment should configure an OSM-derived tile provider or self-host tiles. See the [OSM tile usage policy](https://operations.osmfoundation.org/policies/tiles/).

## Deployment

### Vercel

Import the GitHub repository into Vercel. Vercel detects Vite automatically; use build command `npm run build` and output directory `dist`. Pushes to the connected production branch deploy automatically, and other branches get preview deployments.

Google Health OAuth endpoints run as Vercel Functions. GitHub Pages serves only the static UI, so BLE (on supported HTTPS browsers) and OpenStreetMap work there, but Google Health OAuth does not. Use the Vercel deployment for all three integrations.

### GitHub Pages

The workflow at `.github/workflows/deploy-pages.yml` builds and publishes `dist` on every push to `main`, or when manually started from the Actions tab. Vite derives the Pages base path from `GITHUB_REPOSITORY`, so project pages and `username.github.io` repositories both work.

1. Push this project to a GitHub repository whose default deployment branch is `main`.
2. In the repository, open **Settings → Pages** and set **Build and deployment → Source** to **GitHub Actions**.
3. Push to `main` or run **Deploy to GitHub Pages** from the Actions tab. GitHub displays the published URL in the completed workflow run and under **Settings → Pages**.

Vercel and GitHub Pages can both deploy from the same GitHub repository. This repository is connected to GitHub; Pages publishing also requires Actions billing to be enabled and the Pages source to be set to GitHub Actions.
