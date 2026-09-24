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
| Landing and onboarding (FR-02)          | Landing page → four-step SweetAlert flow → Dashboard | Goals, age range, body details, activity level, optional source selection and privacy intro; login/email verification remain backend work (FR-01).                                                    |
| Dashboard and daily metrics (FR-04)     | Dashboard                                            | Responsive score, streak, step/calorie/heart cards, activity trend and health snapshot using sample data.                                                                                             |
| Activity tracking (FR-05)               | Activity                                             | Create activities with the start/finish flow, read/filter history, edit activity details, and delete entries.                                                                                         |
| Health trends and body goals (FR-06)    | Health → Body                                        | BMI, Kemenkes adult reference bands, formula-based body-fat estimate, reference-weight range, waist-to-height ratio, and a user-entered target. Includes limitations and a non-diagnostic disclaimer. |
| Challenges and badges (FR-07)           | Challenges                                           | Carousel, join/leave community challenges, create/edit/delete personal challenges and view demo badges.                                                                                               |
| Device sync (FR-03)                     | Connected devices                                    | Granular consent dialog and local connected-state demo. Real health-provider OAuth/API sync requires provider credentials and secure server endpoints.                                                |
| Privacy, export, revoke, delete (FR-09) | Privacy center                                       | Permission controls, JSON export, consent toggle, disconnect and local demo-data deletion.                                                                                                            |
| Optional ownership beta (FR-10)         | Privacy center                                       | Explains the optional wallet boundary; no wallet or chain transaction is simulated.                                                                                                                   |

### Local demo security

- The first visit asks the demo user to create a local passphrase. Existing plaintext demo data is encrypted during this setup; returning users unlock the vault with that passphrase.
- Profile, body goals, activities, challenge membership, personal challenges, device selections and permissions, and consent are encrypted in localStorage with AES-256-GCM. A separate HMAC-SHA-256 authenticates the stored envelope. PBKDF2 with SHA-256 and a random per-vault salt derives the keys; keys and passphrase stay in memory only until the vault is locked or the page is closed.
- The passphrase cannot be reset: forgetting it means the encrypted local data cannot be recovered. Export data before deleting the vault if you need a copy.
- This is browser-side protection for a demo. It does not protect an unlocked session from malicious same-origin JavaScript/XSS or replace a server-side account and health-data backend. Device selections and permissions are local demo state; no provider API sync occurs. Use HTTPS and a strong, unique passphrase.
- No diagnosis is provided, and the app does not write health data to a blockchain.

### Body calculator references

- Adult BMI bands use the Indonesian Ministry of Health's SKI 2023 definitions: under 18.5 (wasting), 18.5 to below 25 (normal), 25 to below 27 (overweight), and 27 or higher (obesity): [BKPK Kemenkes](https://www.badankebijakan.kemkes.go.id/daftar-frequently-asked-question-seputar-hasil-utama-ski-2023/hasil-utama-ski-2023/).
- Reference-weight range uses BMI 18.5 to 24.9 for adults and is shown as a range, not an ideal target.
- Body-fat percentage is an estimate from the Deurenberg adult equation (BMI, age, and sex), not a direct measurement: [Deurenberg et al., British Journal of Nutrition](https://www.cambridge.org/core/services/aop-cambridge-core/content/view/S0007114591000193). BMI itself does not directly measure body fat or distinguish fat from lean mass: [CDC BMI FAQ](https://www.cdc.gov/bmi/faq/).

## Deployment

### Vercel

Import the GitHub repository into Vercel. Vercel detects Vite automatically; use build command `npm run build` and output directory `dist`. Pushes to the connected production branch deploy automatically, and other branches get preview deployments.

### GitHub Pages

The workflow at `.github/workflows/deploy-pages.yml` builds and publishes `dist` on every push to `main`, or when manually started from the Actions tab. Vite derives the Pages base path from `GITHUB_REPOSITORY`, so project pages and `username.github.io` repositories both work.

1. Push this project to a GitHub repository whose default deployment branch is `main`.
2. In the repository, open **Settings → Pages** and set **Build and deployment → Source** to **GitHub Actions**.
3. Push to `main` or run **Deploy to GitHub Pages** from the Actions tab. GitHub displays the published URL in the completed workflow run and under **Settings → Pages**.

Vercel and GitHub Pages can both deploy from the same GitHub repository. This repository is connected to GitHub; Pages publishing also requires Actions billing to be enabled and the Pages source to be set to GitHub Actions.
