# Rupakarsa

Ruang produksi visual berbasis AI dengan **dua surface** yang berbagi satu login dan satu bahasa desain:

| Surface | Folder | Port dev | Fungsi |
| --- | --- | --- | --- |
| **Creator** | `apps/creator` | `3000` | Landing page, login kreator, drive proyek, studio Plan → Implement |
| **CMS** | `apps/cms` | `3001` | Overview, tenants, users & akses, providers, models & tarif, settings (login diarahkan ke Creator) |
| **Shared** | `packages/shared` | — | Design system, tipe domain, seed, auth/access, store |

Konsep akses: **default user adalah creator**. Setiap akun baru ber-role `USER` dan tidak bisa
masuk CMS. Superadmin dapat memberikan **Akses CMS** per akun dari `CMS → Users & akses`; user
tersebut tetap ber-role `USER` tetapi bisa masuk ke surface CMS. Superadmin selalu memiliki akses
CMS.

Login hanya **satu tampilan** di Creator (`/login`). Halaman login CMS mengarah ke login Creator;
tidak ada opsi CMS di halaman login. Setelah masuk sebagai Creator, gunakan **surface switcher**
di sidebar untuk berpindah Creator ↔ CMS tanpa logout—hanya muncul aktif jika akun punya akses
CMS. Sesi disimpan di cookie `rupakarsa_session` yang dibagi antar-app pada host yang sama; grant
akses CMS juga disimpan di cookie override agar langsung terbaca lintas surface.

**Token adalah milik tenant.** Setiap tenant punya kantong `tokenBalance` dan
`freePlanRemaining`. User dari tenant memakai saldo yang sama saat generate. Top-up dan kuota
Plan Mode diatur di `CMS → Tenants`, bukan per user. Saldo tenant disinkronkan lintas app lewat
cookie `rupakarsa_tenant_wallets`.

**Request akses** tersedia di `/request-access` (publik). Calon tenant mengisi form dan diarahkan
ke WhatsApp admin. Nomor WhatsApp admin diatur di `CMS → Settings` dan disimpan di cookie
`rupakarsa_admin_contact`.

## Menjalankan

```bash
npm install

# terminal 1
npm run dev:creator   # http://localhost:3000

# terminal 2
npm run dev:cms       # http://localhost:3001
```

## Akun demo

Semua password: `rupakarsa`.

| Email | Role | Akses CMS |
| --- | --- | --- |
| `demo@rupakarsa.id` | USER · Alfateve | Tidak |
| `nadia@alfateve.co.id` | USER · Alfateve | Tidak (bisa diberikan) |
| `bagas@alfateve.co.id` | USER · Alfateve | Tidak |
| `admin@rupakarsa.id` | SUPERADMIN · Rupakarsa | Ya |

Alur demo pemberian akses & token:

1. Login sekali sebagai `admin@rupakarsa.id` di `/login` Creator.
2. Di dalam Creator, gunakan surface switcher untuk pindah ke **CMS** tanpa logout.
3. Buka `Tenants`, top-up **Alfateve** (mis. 1.000 token + 50 plan).
4. Buka `Users & akses`, klik **Beri akses** pada Nadia.
5. Logout, lalu login sekali sebagai `nadia@alfateve.co.id` di `/login` Creator.
6. Nadia memakai saldo tenant Alfateve dan bisa berpindah Creator ↔ CMS tanpa login ulang.

Alur request akses:

1. Admin membuka `CMS → Settings` dan mengisi nomor WhatsApp admin.
2. Calon tenant membuka `/request-access`, mengisi form, lalu menekan **Kirim via WhatsApp**.
3. WhatsApp terbuka dengan pesan yang sudah terisi (nama, tenant, email, WhatsApp, kebutuhan).

## Dokumentasi

| Folder | Isi |
| --- | --- |
| `Requirement/` | PRD aktif (v2.1) — acuan produk & kontrak API untuk tim backend |
| `Rules/` | Aturan engineering (v2.1, historis) — bagian integrasi provider masih berlaku |

## Perintah

```bash
npm run typecheck     # kedua app
npm run lint          # kedua app
npm test              # unit test shared (root vitest)
npm run build         # build Creator lalu CMS
```

## Environment

Kedua app memakai env yang sama:

```
NEXT_PUBLIC_CREATOR_URL=http://localhost:3000
NEXT_PUBLIC_CMS_URL=http://localhost:3001
# Kosongkan untuk localhost. Di produksi: .rupakarsa.id
NEXT_PUBLIC_SESSION_COOKIE_DOMAIN=
```

Cookie sesi, grant akses CMS, dan saldo tenant dibagi antar-port pada `localhost`. Di produksi,
set `NEXT_PUBLIC_SESSION_COOKIE_DOMAIN=.rupakarsa.id` di kedua app agar sesi, grant akses CMS, dan
kantong tenant terbaca lintas subdomain.

## Catatan fase FE

- Sesi, grant akses CMS, saldo tenant, dan kontak admin memakai cookie yang dibagi antar-app. Data
  proyek/user lain masih mock dan disimpan di `localStorage` per origin; backend akan menyatukan
  seluruh data.
- Cookie sesi di demo ini tidak HttpOnly. Di produksi, backend harus menerbitkan sesi HttpOnly.
- Tidak ada panggilan provider sungguhan. Backend berada di repo terpisah (`rupakarsa-backend`) dan masih ditahan sampai FE final.

## Deploy (Netlify)

Repo ini berisi dua site. Buat **dua project Netlify** dari repo yang sama, lalu di
**Project configuration → Build settings** set **Package directory**:

| Site | Package directory | Build command | Publish |
| --- | --- | --- | --- |
| Creator | `apps/creator` | `npm run build -w @rupakarsa/creator` | `apps/creator/.next` |
| CMS | `apps/cms` | `npm run build -w @rupakarsa/cms` | `apps/cms/.next` |

**Base directory wajib kosong** (root repo). Netlify memasang dependency di root lewat npm
workspaces, lalu menjalankan build command dari root. Nilai `command`/`publish` sudah ada di
`apps/*/netlify.toml`; `ignore` di file itu mencegah site ikut rebuild saat app lain berubah.
`packages/shared` sengaja ikut di `ignore` karena kedua app mengimpornya.

### Node version

Next 16 membutuhkan Node **≥ 20.9**. Repo menetapkan Node 22 lewat `.nvmrc` dan
`[build.environment] NODE_VERSION = "22"` di kedua `netlify.toml`. Tanpa ini, site lama yang masih
memakai default Node 18 akan gagal saat build.

### Penyebab umum gagal deploy

| Gejala | Penyebab | Perbaikan |
| --- | --- | --- |
| `Missing script: "build:creator"` | **Base directory** diisi `apps/creator`/`apps/cms` | Kosongkan Base directory; isi hanya **Package directory** |
| Build sukses tapi `Deploy failed` / "no publish directory" | `publish` relatif ke base, bukan ke package | `publish` harus `apps/<app>/.next` selama base = root |
| Build dilewati total padahal ada commit | `ignore` tanpa guard; `$CACHED_COMMIT_REF` kosong pada deploy pertama membuat `git diff` membandingkan working tree dengan HEAD → exit 0 | Gunakan `test -n "$CACHED_COMMIT_REF" && git diff …` (sudah diterapkan) |
| `Unsupported Node.js version` / error sintaks Next 16 | Node 18 default Netlify | Set `NODE_VERSION=22` (sudah diterapkan) |
| `Cannot find module '@rupakarsa/shared'` | Install dijalankan di subfolder sehingga workspace tidak ter-link | Biarkan base = root agar `npm install` membaca workspaces |
