# Panduan Google Health OAuth di Vercel

Panduan ini menyiapkan integrasi Google Health untuk BioSync. Halaman Subscription di aplikasi hanya menampilkan fitur paket; seluruh langkah konfigurasi ada di dokumen ini.

## Prasyarat

- Proyek BioSync sudah di-deploy ke Vercel dan memiliki URL HTTPS, misalnya `https://biosync-xi.vercel.app`.
- Akun Google Cloud dengan izin untuk membuat proyek dan kredensial OAuth.
- URL callback BioSync harus sama persis di Google Cloud dan Vercel: `https://<domain-vercel>/api/google-health/callback`.

## 1. Buat proyek dan OAuth Client

1. Buka [panduan setup resmi Google Health](https://developers.google.com/health/setup), lalu buat atau pilih proyek Google Cloud.
2. Aktifkan **Google Health API** dan buat OAuth 2.0 Client ID dengan tipe aplikasi web/server.
3. Tambahkan `https://www.google.com` sebagai Authorized redirect URI sesuai alur setup Google Health.
4. Tambahkan callback BioSync sebagai Authorized redirect URI: `https://<domain-vercel>/api/google-health/callback`.
5. Simpan Client ID dan Client Secret di password manager. Jangan masukkan keduanya ke kode frontend atau Git.

## 2. Atur layar persetujuan OAuth

1. Isi nama aplikasi, email dukungan, kontak developer, tautan kebijakan privasi, dan domain aplikasi.
2. Atur audiens yang sesuai. Akun Google pribadi menggunakan tipe **External**.
3. Selama status publikasi **Testing**, masukkan alamat email setiap akun Google yang akan menguji integrasi ke daftar **Test users**.
4. Di **Data Access**, tambahkan hanya scope yang dipakai BioSync untuk membaca aktivitas:

   ```text
   https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly
   ```

Scope ini read-only. Jangan meminta scope lain jika tidak dibutuhkan. Google menyatakan refresh token dari aplikasi yang masih berstatus Testing kedaluwarsa setelah 7 hari. Untuk penggunaan publik, ikuti proses verifikasi OAuth dan tinjauan keamanan Google yang berlaku.

## 3. Tambahkan environment variables di Vercel

Buka **Vercel Dashboard > proyek BioSync > Settings > Environment Variables**. Tambahkan variabel berikut untuk **Production**. Tambahkan **Preview** hanya jika ingin menguji preview deployment; URL callback preview juga harus didaftarkan di Google Cloud.

| Nama variabel | Nilai |
| --- | --- |
| `GOOGLE_HEALTH_CLIENT_ID` | OAuth Client ID dari Google Cloud |
| `GOOGLE_HEALTH_CLIENT_SECRET` | OAuth Client Secret dari Google Cloud |
| `GOOGLE_HEALTH_REDIRECT_URI` | `https://<domain-vercel>/api/google-health/callback` |
| `GOOGLE_HEALTH_COOKIE_SECRET` | Rahasia acak minimal 32 karakter |

Contoh membuat secret lokal:

```bash
openssl rand -base64 48
```

Jangan gunakan awalan `VITE_` pada nama variabel. Vite mengekspos variabel berawalan tersebut ke bundle browser, sementara semua kredensial OAuth wajib tetap di sisi server. Jangan commit `.env.local`.

Setelah menyimpan variabel, buat deployment Vercel baru agar fungsi server memakai nilai terbaru. Jika menggunakan domain khusus, daftarkan callback dengan domain khusus itu juga. Pastikan URL dan path callback sama persis, termasuk HTTPS dan garis miring.

## 4. Uji koneksi Google Health

1. Buka BioSync melalui URL Vercel HTTPS dan masuk ke akun lokal.
2. Buka **Personal Space > Subscription**, lalu aktifkan **Plus demo**. Aksi ini hanya simulasi lokal dan tidak menagih pembayaran.
3. Pada kartu Google Health, pilih **Hubungkan Google Health** dan masuk menggunakan akun yang terdaftar sebagai test user.
4. Setujui akses aktivitas/fitness, lalu uji impor aktivitas atau pemutusan koneksi.

Token OAuth diproses melalui Vercel Functions dan disimpan dalam cookie terenkripsi `Secure`, `HttpOnly`, dan `SameSite`. Token tidak disimpan di `localStorage`.

Untuk pengembangan lokal, gunakan `npx vercel dev` agar endpoint `/api/google-health/*` berjalan sebagai Vercel Functions. `npm run dev` saja hanya menjalankan frontend Vite. Simpan variabel Development di `.env.local` yang tidak dilacak Git atau tarik melalui `vercel env pull`.

## Referensi resmi

- [Setup Google Cloud dan OAuth untuk Google Health](https://developers.google.com/health/setup)
- [Pusat bantuan verifikasi aplikasi OAuth Google](https://support.google.com/cloud/answer/13463073)
