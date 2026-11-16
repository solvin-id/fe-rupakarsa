# Rupakarsa

Ruang produksi visual berbasis AI dengan **dua surface** yang berbagi satu login dan satu bahasa desain:

| Surface | Folder | Port dev | Fungsi |
| --- | --- | --- | --- |
| **Creator** | `apps/creator` | `3000` | Landing page, login kreator, drive proyek, studio Plan → Implement |
| **CMS** | `apps/cms` | `3001` | Overview, workspaces, users & akses, providers, models & tarif, settings (login diarahkan ke Creator) |
| **Shared** | `packages/shared` | — | Design system, tipe domain, API client, hooks TanStack Query, auth/access |
| **API** | `../be-core-rupakarsa` | `8787` | Hono + PostgreSQL + Redis: sesi, workspace, token ledger, render pipeline, CMS |

Konsep akses: **default user adalah creator**. Setiap akun baru ber-role `USER` dan tidak bisa
masuk CMS. Superadmin dapat memberikan **Akses CMS** per akun dari `CMS → Users & akses`; user
tersebut tetap ber-role `USER` tetapi bisa masuk ke surface CMS. Superadmin selalu memiliki akses
CMS.

Login hanya **satu tampilan** di Creator (`/login`). Halaman login CMS mengarah ke login Creator;
tidak ada opsi CMS di halaman login. Setelah masuk sebagai Creator, gunakan **surface switcher**
di sidebar untuk berpindah Creator ↔ CMS tanpa logout—hanya muncul aktif jika akun punya akses
CMS. Sesi diterbitkan API sebagai cookie `rupakarsa_session` yang **HttpOnly** dan dibagi antar-app
pada host yang sama, sehingga browser tidak lagi menyimpan data domain apa pun.

**Token adalah milik workspace.** Setiap workspace punya kantong `tokenBalance` dan
`freePlanRemaining`. User dari workspace memakai saldo yang sama saat generate. Top-up dan kuota
Plan Mode diatur di `CMS → Workspaces`, dan setiap perubahan masuk ke ledger server (`HOLD`,
`COMMIT`, `REFUND`, `TOPUP`).

**Request akses** tersedia di `/request-access` (publik). Calon workspace mengisi form dan
diarahkan ke WhatsApp admin. Nomor WhatsApp admin diatur di `CMS → Settings` dan disimpan di
tabel `app_settings` server, lalu dibaca lewat `GET /api/public/config`.

## Menjalankan

Backend harus hidup lebih dulu (repo terpisah `../be-core-rupakarsa`):

```bash
# terminal 0 — API + worker render (PostgreSQL & Redis sudah berjalan)
cd ../be-core-rupakarsa
npm run db:migrate && npm run db:seed
npm run dev          # http://localhost:8787
npm run dev:worker   # terminal terpisah
```

Lalu dua frontend:

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
3. Buka `Workspaces`, top-up **Alfateve** (mis. 1.000 token + 50 plan).
4. Buka `Users & akses`, klik **Beri akses** pada Nadia.
5. Logout, lalu login sekali sebagai `nadia@alfateve.co.id` di `/login` Creator.
6. Nadia memakai saldo workspace Alfateve dan bisa berpindah Creator ↔ CMS tanpa login ulang.

Alur request akses:

1. Admin membuka `CMS → Settings` dan mengisi nomor WhatsApp admin.
2. Calon workspace membuka `/request-access`, mengisi form, lalu menekan **Kirim via WhatsApp**.
3. WhatsApp terbuka dengan pesan yang sudah terisi (nama, workspace, email, WhatsApp, kebutuhan).

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
npm run api:types     # salin ../be-core-rupakarsa/openapi.json + regenerasi api-schema.d.ts
```

## Environment

Kedua app memakai env yang sama:

```
NEXT_PUBLIC_CREATOR_URL=http://localhost:3000
NEXT_PUBLIC_CMS_URL=http://localhost:3001
NEXT_PUBLIC_API_BASE_URL=http://localhost:8787
```

`NEXT_PUBLIC_API_BASE_URL` menunjuk ke API Hono. Cookie sesi HttpOnly diterbitkan API dan dibagi
antar-port pada `localhost`. Di produksi, set `NEXT_PUBLIC_API_BASE_URL` ke host API publik dan
atur `COOKIE_DOMAIN=.rupakarsa.id` + `FRONTEND_ORIGINS` di `.env` backend agar sesi terbaca lintas
subdomain.

## Catatan arsitektur

- Server adalah satu-satunya sumber kebenaran: workspace, folder, generasi, model, provider,
  kontak admin, dan saldo token hidup di PostgreSQL. Browser hanya menyimpan cookie sesi HttpOnly.
- Server state di frontend dipegang TanStack Query (`packages/shared/src/hooks/*`); Zustand hanya
  untuk UI state (`ui-store`).
- Render dijalankan worker (`GENERATION_DRIVER=queue` di dev, `inline` di test). Provider masih
  stub: Plan memakai builder deterministik dan render menghasilkan poster SVG, dengan antarmuka
  adapter yang siap diganti provider sungguhan.
- Kontrak API dijaga dua arah: `openapi.json` di repo backend, dan assert tipe di
  `packages/shared/src/lib/api-contract.ts` yang gagal saat `npm run typecheck` bila DTO frontend
  menyimpang dari schema backend.

## Deploy (Netlify)

Repo ini berisi dua site. Buat **dua project Netlify** dari repo yang sama, lalu di
**Project configuration → Build settings** isi **Package directory**:

| Site | Base directory | Package directory | Build command | Publish |
| --- | --- | --- | --- | --- |
| Creator | *(kosong / `\`)* | `apps/creator` | *(kosong, dari netlify.toml)* | *(kosong, dari netlify.toml)* |
| CMS | *(kosong / `\`)* | `apps/cms` | *(kosong, dari netlify.toml)* | *(kosong, dari netlify.toml)* |

Nilai `command`/`publish` sudah ada di `apps/*/netlify.toml`. **Base directory harus tetap root**
supaya `npm install` membaca npm workspaces dan `packages/shared` ter-link.

**Penting: `publish` bersifat relatif terhadap Base directory.** Karena base = root, `publish`
harus `apps/creator/.next`. Kalau Base directory diisi `apps/creator`, `publish` harus `.next` —
kalau ditulis lengkap, Netlify menempelkannya lagi dan mencari
`apps/creator/apps/creator/.next`, lalu gagal dengan `Your publish directory was not found`.

Kedua `netlify.toml` sengaja **tidak** memakai `ignore`. Sebelumnya ada `ignore` berbasis
`git diff` untuk mencegah rebuild antar-app, tapi perintah itu rapuh: pathspec tidak match,
`git diff --quiet` mengembalikan exit 0, dan Netlify menganggap tidak ada perubahan sehingga
**build dilewati selamanya**. Build ulang kedua site jauh lebih murah daripada deploy yang tidak
pernah jalan.

### Node version

Next 16 membutuhkan Node **≥ 20.9**. Repo menetapkan Node 22 lewat `.nvmrc` dan
`[build.environment] NODE_VERSION = "22"` di kedua `netlify.toml`. Tanpa ini, site lama yang masih
memakai default Node 18 akan gagal saat build.

### Penyebab umum gagal deploy

| Gejala | Penyebab | Perbaikan |
| --- | --- | --- |
| Deploy berstatus **skipped** dengan keterangan `Skipped due to account credit usage exceeded` | Kredit tim Netlify habis untuk siklus billing ini; production deploy dijeda | Upgrade tim atau tunggu siklus berikutnya — bukan masalah konfigurasi |
| Deploy skipped tanpa keterangan kredit | `ignore` command atau field **Ignore builds** di UI | `ignore` sudah dihapus dari repo; kosongkan field Ignore builds di UI |
| `Your publish directory was not found at .../apps/creator/apps/creator/.next` | `publish` ditulis lengkap padahal Base directory sudah `apps/creator` | Samakan: base root → `publish = apps/creator/.next`; base app → `publish = .next` |
| Build berjalan tapi tidak ada config yang terbaca | Base = root dan Package directory kosong, sehingga `apps/*/netlify.toml` tidak ditemukan | Isi **Package directory** dengan `apps/creator` / `apps/cms` |
| `Missing script: "build:creator"` | Build command memakai script root padahal base = folder app | Pakai `npm run build -w @rupakarsa/creator` hanya bila base = root |
| `Unsupported Node.js version` / error sintaks Next 16 | Node 18 default Netlify | Set `NODE_VERSION=22` (sudah diterapkan) |
| `Cannot find module '@rupakarsa/shared'` | Install dijalankan tanpa membaca workspaces | Pastikan Base directory tetap root |
