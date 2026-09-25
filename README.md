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
| Device sync (FR-03)                     | Connected devices                                    | Live BLE heart-rate/cadence sensor connection and Google Health API OAuth 2.0 via Vercel serverless functions; provider credentials are required for Google OAuth.                                    |
| Privacy, export, revoke, delete (FR-09) | Privacy center                                       | Permission controls, JSON export, consent toggle, disconnect and local demo-data deletion.                                                                                                            |
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

### Google Health API

The Connected devices page uses Google OAuth 2.0 and a Vercel Node API function to import exercise records. The scope is read-only activity and fitness. OAuth tokens are sealed with AES-256-GCM and stored in a Secure, HttpOnly, SameSite cookie; they are not written to localStorage. Imported activities and GPS recorded by the browser are kept in the encrypted demo vault.

Set these variables in Vercel Project Settings ? Environment Variables (and in `.env.local` for local `vercel dev`):

- `GOOGLE_HEALTH_CLIENT_ID`
- `GOOGLE_HEALTH_CLIENT_SECRET`
- `GOOGLE_HEALTH_REDIRECT_URI` ? `https://<your-domain>/api/google-health/callback`
- `GOOGLE_HEALTH_COOKIE_SECRET` ? at least 32 random characters (for example, generate with `openssl rand -base64 48`)

Create/enable the Google Health API in Google Cloud and configure a Web application OAuth client. Register the exact BioSync callback URL above as an authorized redirect URI (the [Google Health setup guide](https://developers.google.com/health/setup) may also ask you to add `https://www.google.com`). Add the activity and fitness read-only scope, and add test users while the consent screen is in Testing. Google marks its Health API scopes restricted; wider/public release requires completing Google's applicable verification and security review. To exercise the Vercel API functions locally run `npx vercel dev` rather than plain `npm run dev`.

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
