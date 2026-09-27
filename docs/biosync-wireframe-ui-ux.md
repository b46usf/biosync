# BS BioSync — Wireframe UI/UX

Tagline: **Your Health. Your Data. Your Control.**  
Supporting line: **MOVE • SYNC • OWN**

## 1. Arah desain

- Mobile-first PWA, responsif desktop.
- Health-tech premium: navy `#071A2F`, teal `#16D6C3`, mint `#45D9B6`, lime `#B7F34A`, putih `#F5F8FC`.
- Font: Inter; kartu rounded 16–24 px; grafik sederhana dan mudah dibaca.
- Web3 bersifat opsional. Data kesehatan mentah tetap terenkripsi off-chain; blockchain untuk consent, verifikasi, dan ownership.

## 2. Struktur navigasi

```mermaid
flowchart TD
  A[Landing] --> B{Member?}
  B -->|Login| C[Username + Password]
  B -->|Register| D[Create local member]
  C --> E[Unlock encrypted vault]
  D --> F[Onboarding]
  E --> G[Dashboard]
  F --> G
  G --> H[Activity]
  G --> I[Health]
  G --> J[Challenges]
  G --> K[Profile & Privacy]
  G --> L[Personal Space · Free]
  L --> M[Subscription · Plus]
  M --> N[Google Health OAuth]
  K --> O[Connected devices · BLE]
  K --> P[Web3 Ownership]
```

Mobile bottom navigation: **Home · Activity · Health · Challenges · Profile**.

## 3. Wireframe utama

### A. Landing page

```text
[BS BioSync logo]
Your Health. Your Data. Your Control.
[Start Tracking] [Explore Features]
[health dashboard preview] [privacy / Web3 statement]
Features: Track · Sync · Challenge · Own
```

### B. Onboarding

1. Welcome — logo, tagline, CTA “Get Started”.
2. Login member dengan username dan password, atau pilih **Register member** jika belum memiliki akun.
3. Setelah register, isi health goals, nama tampilan, rentang usia, tinggi, berat, dan activity level.
4. Akun demo bersifat lokal pada browser ini; password membuka brankas terenkripsi dan tidak membuat akun server.
5. Standard BLE sensor connection is available after onboarding from **Connected devices**. Google Health OAuth is available only under **Personal Space → BioSync Plus**.
6. Privacy choice — data permission per kategori, “Skip for now”.

### C. Dashboard / Home

```text
[Good morning, User]                 [avatar]
Daily score  82/100       Streak  7 days
[Steps 8,420] [Calories 640] [Heart 76 bpm]
[weekly activity chart................]
Suggested: 20-min walk          [Start]
Latest activity: Morning Run     [View]
```

### D. Activity

- Filter: All, Run, Walk, Cycle, Hike, Gym, Yoga, Swim, Other.
- OpenStreetMap route map with saved GPS polylines, distance and duration.
- CTA **Start Activity** requests location permission and records route points locally.
- Detail activity: split, heart-rate zone, calories, share card, NFT badge opsional.

### E. Connected devices

- Bluetooth LE: nearby device picker and live standard Heart Rate/Cadence metrics when the sensor exposes those GATT services.
- Explain secure-context, browser and device-protocol requirements; Apple Health needs an iOS companion app.

### F. Personal Space dan subscription

- Workspace **Personal Space** starts on the Free plan and is reachable from the workspace switcher in the sidebar.
- Show Free and BioSync Plus plan cards, current-plan state, included capabilities, and a clear demo-only activation note while payment is unavailable.
- BioSync Plus contains Google Health OAuth connect, activity sync, and disconnect. Never place Google account connect in Connected devices.
- Include setup guidance for Google Cloud OAuth and Vercel environment variables.

### G. Health

- Tabs: Overview, Sleep, Heart, Body, Recovery.
- Trend 7/30/90 hari.
- Status menggunakan label normal, perhatian, dan perlu konsultasi—bukan diagnosis.
- Export data JSON/CSV/PDF dan revoke access.

### H. Challenges

```text
[Weekly Challenge] 12.4 / 20 km
[Join Challenge]
Community: 2,430 participants
[Leaderboard] [My Rewards]
Badges: First Move · 10K Steps · 7-Day Streak
```

### I. Profile, Privacy, dan Web3

- Profil, connected devices, notification, language, account security.
- **Data permissions:** siapa yang dapat mengakses, jenis data, masa berlaku.
- **Ownership:** encrypted vault, consent history, verification hash, wallet optional.
- Tombol jelas: **Download My Data**, **Revoke Access**, **Delete Account**.

## 4. Komponen UI

Button primary, secondary, icon button, metric card, chart card, map card, badge, progress ring, bottom sheet, modal consent, toast, skeleton loader, empty state, error state, confirmation dialog.

## 5. Responsive layout

| Viewport | Layout |
| --- | --- |
| 360–640 px | 1 kolom, bottom nav, sidebar drawer |
| 641–850 px | 1 kolom, sidebar drawer berlabel |
| 851–1199 px | konten responsif, sidebar penuh |
| 1200 px ke atas | sidebar tetap, dashboard 3 kolom |

## 6. Prioritas MVP

1. Landing, login, onboarding.
2. Dashboard dan pencatatan activity.
3. Integrasi Google Health API (OAuth) dan perangkat Bluetooth LE standar.
4. Health metrics dasar dan grafik.
5. Challenge, streak, badge.
6. Privacy center dan export/delete data.
7. Web3 consent/ownership sebagai fitur beta.
