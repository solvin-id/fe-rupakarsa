# FINAL PRODUCT REQUIREMENT DOCUMENT (PRD)
## RUPAKARSA — B2B AI Image & Video Production Workspace

* **Versi Dokumen:** 2.1 — disinkronkan dengan kondisi kode frontend per 2026-11-15
* **Status:** Frontend (Creator + CMS) berjalan dengan data mock; backend belum dibangun
* **Arsitektur Produk:** Multi-Tenant B2B SaaS (Image & Video Generator) dengan dua surface
* **Repo:** `fe-rupakarsa` (frontend) dan `rupakarsa-backend` (backend, ditahan)
* **Target Timeline:** 3 Bulan (Tim 2 Software Engineer)

---

## 0. Status Implementasi (per 2026-11-15)

Bagian ini adalah sumber kebenaran tentang apa yang sudah ada dan apa yang belum. Tim backend harus
memperlakukan frontend sebagai **kontrak perilaku**, bukan sekadar mockup.

### 0.1 Sudah berjalan di frontend (data mock)

| Area | Status | State saat ini |
| :--- | :--- | :--- |
| Landing page `/` | Selesai | Statis, editorial terang (cream/ink/oranye) |
| Login tunggal di Creator `/login` | Selesai | Cookie `rupakarsa_session` + akun seed |
| Request access publik `/request-access` | Selesai | Membuka `wa.me` dengan pesan terisi |
| Projects `/app/projects` | Selesai | `localStorage` per origin |
| Studio `/app/projects/[folderId]` (Plan → Implement) | Selesai (simulasi) | Store + `localStorage` |
| CMS: overview, tenants, users, providers, models, settings | Selesai | Seed + `localStorage` |
| Grant/revoke akses CMS | Selesai | `User.cmsAccess` + cookie `rupakarsa_cms_access` |
| Kantong token tenant + top-up + kuota Plan | Selesai | `Tenant.tokenBalance` / `freePlanRemaining` + cookie `rupakarsa_tenant_wallets` |
| Kontak admin (WhatsApp request access) | Selesai | Cookie `rupakarsa_admin_contact` |
| Dua aplikasi + paket bersama | Selesai | `apps/creator` (3000), `apps/cms` (3001), `packages/shared` |

### 0.2 Belum ada (tanggung jawab backend)

- Autentikasi nyata: password hash, session HttpOnly, logout, rotasi sesi.
- PostgreSQL dan seluruh skema di §7.
- Token ledger dengan `HOLD` / `COMMIT` / `REFUND` (§6.1).
- Antrean BullMQ + worker render.
- Integrasi Kenari AI (Plan Mode) dan Higgsfield (Implement Mode).
- Cloudflare R2 untuk aset referensi dan hasil render.
- Kontrak API di §8. **Frontend saat ini tidak memanggil API apa pun.**
- Kontak admin dan request access masih disimpan di browser (cookie), bukan di server.

### 0.3 Catatan repo

- FE `fe-rupakarsa`: npm workspaces, `apps/creator`, `apps/cms`, `packages/shared`.
- BE lama `rupakarsa-backend`: proxy Hono stateless (port 8787, 45 tes) yang belum dipanggil FE.
  Boleh dipakai sebagai referensi integrasi provider (kredensial `x-provider-credentials`,
  normalisasi status, upload presigned), tetapi bukan backend produk final.

---

## 1. Ringkasan Eksekutif & Visi Produk

**Rupakarsa** adalah platform produksi konten visual berbasis kecerdasan buatan (Gambar dan Video)
yang menggabungkan struktur manajemen berkas ala **Google Drive** dengan alur penyutradaraan
terstruktur (**Plan Mode ➔ Implement Mode**).

Berbeda dari antarmuka generator AI publik yang bersifat *stateless* (tanpa memori kesinambungan
sehingga menyebabkan tingginya tingkat kegagalan/inkonsistensi visual), Rupakarsa mewajibkan
pengguna bekerja di dalam **Folder Proyek**. Setiap aset referensi, riwayat generasi, dan konteks
cerita tersimpan rapi di dalam folder proyek masing-masing.

### Cakupan Strategis Fase MVP:
1. **Multi-Tenant dengan CMS internal:** isolasi data berbasis `tenant_id` sejak awal pada level
   database dan API. CMS internal Rupakarsa (untuk Superadmin) sudah dibangun sebagai aplikasi
   terpisah dan mencakup tenant, user, akses CMS, provider, model, tarif, dan kontak admin.
   CMS self-service untuk admin tenant belum masuk MVP; akun tenant didaftarkan oleh Superadmin.
2. **Dual-Mode Prompt Workflow (`Plan Mode` ➔ `Implement Mode`):** menggunakan model
   **DeepSeek-V3** melalui provider **Kenari AI** untuk menerjemahkan ide mentah, gambar acuan, dan
   spesifikasi teknis menjadi *prompt* sinematik terstruktur sebelum dieksekusi ke engine generator
   (API **Higgsfield**).
3. **Transparansi & Keamanan Transaksi Token:** sistem menampilkan kalkulasi biaya **Token** secara
   *real-time* sebelum pengguna mengeksekusi render, didukung mekanisme *Hold & Auto-Refund*
   apabila terjadi kegagalan sistem pada pihak penyedia API.

---

## 2. Arsitektur Infrastruktur & Stack Teknologi

Sistem dirancang dengan arsitektur *stateless-worker* dan *managed AI APIs* agar ringan dijalankan
di VPS standar namun mampu menangani proses render video berat secara asinkron:

| Layer Sistem | Teknologi / Provider | Spesifikasi & Peran Teknis |
| :--- | :--- | :--- |
| **Frontend Web** | Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, Zustand | Dua aplikasi: `apps/creator` (port 3000) dan `apps/cms` (port 3001), berbagi `packages/shared` (tema, UI, tipe, store). |
| **Backend & Orchestrator** | Node.js (Hono / NestJS) atau Python (FastAPI) | Manajemen autentikasi, RBAC, kalkulator token, API router, dan penanganan *webhook*. |
| **Database & Queue** | PostgreSQL + Redis (BullMQ) | Menyimpan tenant, user, folder, riwayat generasi, buku besar token (*ledger*), dan antrean *job*. |
| **Server Hosting** | **VPS Hostinger (KVM 2)** | 2 vCPU, 8 GB RAM, 100 GB NVMe (Rp 151.900/bulan di luar PPN). |
| **Plan Mode LLM** | **Kenari AI (`deepseek-chat` / DeepSeek-V3)** | Optimasi *prompt*, *reprompt*, dan penyelarasan konteks adegan (alokasi Rp 50.000/bulan). |
| **Video & Image Engine** | **Higgsfield API** *(model utama: Wan Qwen)* | Eksekusi render video (5s / 10s) dan gambar referensi (kurs top-up $1 = Rp 18.900). |
| **Object Storage** | **Cloudflare R2** | Penyimpanan permanen aset referensi dan hasil render MP4/PNG (*zero egress fee*). |

### 2.1 Pembagian Surface

| Surface | Folder | Port dev | Isi |
| :--- | :--- | :--- | :--- |
| **Creator** | `apps/creator` | 3000 | Landing, login, request access, daftar proyek, studio Plan → Implement. |
| **CMS** | `apps/cms` | 3001 | Overview, tenants, users & akses, providers, models & tarif, settings. |
| **Shared** | `packages/shared` | — | Design system, tipe domain, seed, auth/access, store, cookie helper. |

**Sesi tunggal.** Login hanya ada di Creator. Halaman login CMS mengarahkan ke login Creator. Satu
kali sign-in menulis cookie `rupakarsa_session` yang dibagi antar-app pada host yang sama
(produksi: `NEXT_PUBLIC_SESSION_COOKIE_DOMAIN=.rupakarsa.id`). Pengguna dengan akses CMS dapat
berpindah surface tanpa logout melalui *surface switcher*.

---

## 3. Model Bisnis, Konversi Token & Unit Economics

### 3.1 Nilai Dasar & Skema Top-Up B2B
* **Nilai Tukar Dasar:** `1 Token = Rp 500`
* **Paket Standar Tenant:** top-up **Rp 2.000.000** = **4.000 Token** + **bonus 250x Plan Mode**
  (selanjutnya dikenakan `1 Token` per *Plan Mode / Reprompt*).
* **Token dimiliki tenant, bukan user.** Semua user dalam tenant memakai kantong yang sama. Top-up
  dan kuota Plan diatur di `CMS → Tenants`.

### 3.2 Kebijakan Pembagian Dana (80% Pool AI / 20% Perusahaan)
Setiap transaksi top-up **Rp 2.000.000** dipisahkan secara internal ke dalam dua pos:
1. **80% Pool Eksekusi AI (`Rp 1.600.000`):**
   * **Rp 1.550.000** untuk saldo API **Higgsfield** (modal Wan Qwen 10s = `$0,60 – $0,72` atau
     `Rp 11.340 – Rp 13.608` per video).
   * **Rp 50.000** untuk saldo **Kenari AI (`deepseek-chat`)** — kapasitas **~2.700+ Plan Mode**
     (~Rp 18 per permintaan).
2. **20% Hak Perusahaan (`Rp 400.000`):**
   * Menutup biaya **VPS Hostinger (Rp 151.900/bulan)** sejak tenant pertama masuk, menyisakan
     **laba bersih Rp 248.100** pada tenant ke-1 dan **Rp 400.000 bersih** per tenant berikutnya.

### 3.3 Tabel Konfigurasi Tarif Token (Default Superadmin)

| Fitur / Model AI | Spesifikasi | Tarif ke Tenant | Setara Rupiah | Modal API Maksimum | Kapasitas dari 4.000 Token |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Wan Qwen (Video)** | Durasi **10 Detik** | **35 Token** | Rp 17.500 | Rp 13.608 *($0,72)* | **114 Video 10s** *(sisa 10 token)* |
| **Wan Qwen (Video)** | Durasi **5 Detik** | **18 Token** | Rp 9.000 | Rp 6.804 *($0,36)* | **222 Video 5s** *(sisa 4 token)* |
| **Generate Gambar** | *Character Anchor* | **2 Token** | Rp 1.000 | ~Rp 150 – Rp 350 | **2.000 Gambar** |
| **Plan Mode / Reprompt** | DeepSeek-V3 (Kenari) | **Gratis 250x**, lalu **1 Token** | Rp 0 / Rp 500 | ~Rp 18 / request | **250x Gratis** + hingga 4.000x |

*(Catatan: dalam pola produksi campuran B2B — misalnya 80 video 10s + 60 video 5s + 40 gambar +
290x Plan Mode — tenant memperoleh total **140 video** dan 40 aset gambar dari satu top-up
Rp 2.000.000.)*

---

## 4. Peran Pengguna & Hak Akses (RBAC)

Hak akses ditentukan oleh **role** dan **flag `cmsAccess`** yang terpisah. Role `USER` adalah
default; akses CMS adalah grant per akun, bukan role terpisah. `SUPERADMIN` selalu punya akses CMS.

| Modul & Kemampuan | `USER` | `USER` + `cmsAccess` | `SUPERADMIN` |
| :--- | :---: | :---: | :---: |
| Landing, login, request access | ✅ | ✅ | ✅ |
| Membuat/ubah/hapus folder proyek | ✅ | ✅ | ✅ |
| Plan Mode, edit Plan Blueprint | ✅ | ✅ | ✅ |
| Implement Mode, unduh hasil | ✅ | ✅ | ✅ |
| Masuk surface CMS | ❌ | ✅ | ✅ |
| Overview & statistik platform | ❌ | ✅ | ✅ |
| Kelola tenant, top-up, kuota Plan | ❌ | ✅ | ✅ |
| Grant/revoke akses CMS akun lain | ❌ | ✅ | ✅ |
| Kelola provider & model/tarif | ❌ | ✅ | ✅ |
| Atur kontak admin (WhatsApp/email) | ❌ | ✅ | ✅ |

Catatan:
* Semua user dalam satu tenant menarik token dari **kantong tenant**, bukan saldo pribadi.
* Akun nonaktif (`isActive = false`) tidak bisa login, dan tenant nonaktif memblokir seluruh
  user-nya di Creator.
* Superadmin selalu memiliki akses CMS dan tidak dapat mencabutnya dari dirinya sendiri.

---

## 5. Spesifikasi Fungsional Frontend & Alur Pengguna

### 5.1 Peta Rute Aplikasi (Sitemap)

**Creator (`apps/creator`, port 3000)**
```text
/                       Landing page (editorial terang, ref. pin.it/134xpLadW)
├── /login              Login tunggal (tanpa public sign-up)
├── /request-access     Form publik pengajuan akses/kerja sama → WhatsApp admin
└── /app                Workspace terproteksi
     ├── /app/projects               Dashboard folder proyek + saldo tenant
     ├── /app/projects/[folderId]    Studio: generator, Plan Canvas, riwayat
     └── /studio                     Redirect ke /app/projects
```

**CMS (`apps/cms`, port 3001)**
```text
/login        Redirect ke login Creator
/overview     Ringkasan platform
/tenants      Daftar tenant, tambah tenant, top-up token & kuota Plan
/users        User, tenant, saldo tenant, grant/revoke akses CMS
/providers    Provider AI + tambah provider
/models       Model AI & tarif + tambah model per provider
/settings     Kontak admin (nama, WhatsApp, email)
```

### 5.2 Detail Fitur per Halaman

1. **Landing (`/`) dan Login (`/login`)**
   * Estetika editorial terang: cream `#f3f0e8`, ink `#141311`, aksen oranye `#f04e23`,
     tipografi Instrument Sans / Instrument Serif / JetBrains Mono.
   * Login hanya menerima akun yang sudah terdaftar. Tidak ada opsi CMS di halaman login.
   * Tombol **Butuh akses?** mengarah ke `/request-access`.
   * Session menyimpan `user`, `tenant` (termasuk `tokenBalance` dan `freePlanRemaining`), dan
     `signedInAt`.

2. **Request Access (`/request-access`, publik)**
   * Form: nama, tenant/perusahaan, email, WhatsApp, kebutuhan.
   * Validasi form: nama dan tenant ≥ 2 karakter, email valid, WhatsApp ≥ 8 digit. Nomor admin
     yang disimpan di CMS dibatasi 8–15 digit.
   * Saat dikirim, browser membuka `https://wa.me/<nomor-admin>?text=<pesan terisi>`.
   * Nomor admin diambil dari Settings CMS. Jika belum diisi, submit dinonaktifkan dan halaman
     menampilkan email admin sebagai jalur cadangan.
   * Pesan yang dikirim memuat seluruh isian form dalam format baris `Label: nilai`.

3. **Drive Dashboard (`/app/projects`)**
   * Menampilkan tenant aktif, saldo token tenant, kuota Plan tersisa, dan tombol
     **+ Folder Proyek Baru**.
   * Grid/List view; kartu folder memuat jumlah video/gambar, pemakaian token, dan aksi
     buka/rename/hapus.
   * Data folder terisolasi per tenant dan per user pada level tampilan.

4. **Studio (`/app/projects/[folderId]`)**
   * **Generator Setup:** tab Video/Gambar, dropdown model dari katalog, form parameter dinamis
     (durasi, resolusi, rasio aspek) sesuai kapabilitas model, serta unggah gambar referensi
     (`.jpg`, `.jpeg`, `.png`, `.webp`).
   * **Plan Mode:** pengguna menulis *raw prompt* lalu menekan **Buat Plan**. Hasil berupa
     *Plan Blueprint* yang dapat diedit. Mengonsumsi kuota gratis tenant lebih dulu, lalu 1 token.
   * **Implement Mode:** kartu rincian biaya token menampilkan tarif model, saldo tenant, dan
     proyeksi sisa saldo. Tombol **Generate** terkunci bila saldo tidak cukup.
   * **Riwayat folder:** status `Queued → Rendering → Completed/Failed`, unduh hasil, detail
     metadata, dan **Gunakan Ulang Plan (Remix)**. Kegagalan mengembalikan token.

5. **CMS**
   * **Overview:** jumlah tenant, user, provider, model, dan total token platform.
   * **Tenants:** tabel tenant (user, token, plan, status); dialog **Tambah tenant** (nama, slug,
     token awal, plan awal, aktif); dialog **Top up** (token + plan).
   * **Users & akses:** tabel user dengan tenant dan saldo tenant; tombol **Beri akses** /
     **Cabut akses** CMS; tautan ke Tenants untuk top-up.
   * **Providers:** kartu provider + **Tambah provider**; toggle aktif/nonaktif.
   * **Models & tarif:** tabel model dengan provider, media type, tarif token, parameter; dialog
     **Tambah model** yang memilih provider lalu template model (atau Kustom).
   * **Settings:** nama admin, nomor WhatsApp, email; validasi nomor 8–15 digit; preview link
     `wa.me`; simpan ke konfigurasi yang dibaca halaman request access.

---

## 6. Spesifikasi Backend, Sistem Antrean & Buku Besar Token

### 6.1 Alur Transaksi Token (*Hold, Commit, & Auto-Refund*)
Token berada di **tenant**. Setiap transaksi wajib mencatat aktor (`user_id`) dan pemilik dana
(`tenant_id`).

1. **Validasi & Hold:** saat pengguna menekan *Implement*, backend memeriksa
   `tenant.token_balance >= required_tokens`, memotong saldo tenant secara atomik, dan mencatat
   entri `HOLD` pada `token_ledger` dengan `tenant_id` dan `user_id`.
2. **Eksekusi Worker:** *job* dimasukkan ke antrean Redis (BullMQ) lalu dikirim ke API Higgsfield.
3. **Penyelesaian (`COMMIT` / `REFUND`):**
   * Sukses dan berkas tersimpan di R2 → entri menjadi `COMMIT`, status `COMPLETED`.
   * Gagal (5xx / timeout / content policy) → entri `REFUND`, token kembali penuh ke saldo tenant,
     status `FAILED (Token Dikembalikan)`.

### 6.2 Logika Kuota Gratis *Plan Mode*
* Kuota gratis melekat pada **tenant**: `tenants.free_plan_remaining` (diisi `250` saat top-up
  paket Rp 2.000.000).
* `POST /api/v1/generations/plan`:
  * Jika `free_plan_remaining > 0` → kurangi 1, biaya token `0`.
  * Jika `free_plan_remaining = 0` → potong `tenant.token_balance` sebesar tarif Plan Mode
    (default `1 Token`).
* Pemakaian kuota dan token tetap dicatat per `user_id` agar bisa diaudit.

---

## 7. Skema Database Inti (PostgreSQL)

```sql
-- 1. Tenants — pemilik kantong token
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    token_balance INTEGER NOT NULL DEFAULT 0 CHECK (token_balance >= 0),
    free_plan_remaining INTEGER NOT NULL DEFAULT 0 CHECK (free_plan_remaining >= 0),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Users — pre-registered oleh Superadmin
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('USER', 'SUPERADMIN')) DEFAULT 'USER',
    cms_access BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Project Folders (konsep Google Drive)
CREATE TABLE folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. AI Providers & API Keys (dikelola via CMS)
CREATE TABLE ai_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL, -- 'KENARI_AI', 'HIGGSFIELD'
    name VARCHAR(100) NOT NULL,
    base_url TEXT NOT NULL,
    api_key_encrypted TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 5. AI Models & Tarif Token (dikelola via CMS)
CREATE TABLE ai_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID REFERENCES ai_providers(id),
    code VARCHAR(100) UNIQUE NOT NULL, -- 'wan-qwen-10s', 'wan-qwen-5s', 'flux-image'
    display_name VARCHAR(150) NOT NULL,
    media_type VARCHAR(10) CHECK (media_type IN ('IMAGE', 'VIDEO')) NOT NULL,
    allowed_params JSONB NOT NULL,
    token_cost INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- 6. Generations & History (Plan -> Implement)
CREATE TABLE generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    model_id UUID REFERENCES ai_models(id),
    media_type VARCHAR(10) CHECK (media_type IN ('IMAGE', 'VIDEO')) NOT NULL,
    raw_prompt TEXT NOT NULL,
    planned_prompt TEXT NOT NULL,
    reference_image_url TEXT,
    selected_params JSONB NOT NULL,
    tokens_charged INTEGER NOT NULL,
    status VARCHAR(20) CHECK (status IN ('QUEUED', 'RENDERING', 'COMPLETED', 'FAILED')) DEFAULT 'QUEUED',
    external_job_id VARCHAR(150),
    output_url TEXT,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- 7. Token Ledger — audit top-up, pemakaian, refund (level tenant + aktor)
CREATE TABLE token_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) NOT NULL,
    user_id UUID REFERENCES users(id),
    generation_id UUID REFERENCES generations(id) NULL,
    tx_type VARCHAR(20) CHECK (tx_type IN ('TOPUP', 'HOLD', 'COMMIT', 'REFUND', 'ADJUSTMENT')) NOT NULL,
    amount INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 8. App Settings — kontak admin untuk request access
CREATE TABLE app_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW()
);
-- contoh: key='admin_contact', value={"name":"Tim Rupakarsa","whatsapp":"628...","email":"halo@rupakarsa.id"}
```

---

## 8. Kontrak API Utama (REST Endpoints)

Semua endpoint di bawah ini **belum diimplementasikan**. Frontend saat ini tidak memanggil API;
kontrak ini menjadi acuan backend.

| Method & Endpoint | Akses | Fungsi Utama |
| :--- | :---: | :--- |
| `POST /api/v1/auth/login` | Publik | Autentikasi email/password; mengembalikan sesi + profil user + tenant + saldo tenant. |
| `POST /api/v1/auth/logout` | User | Menghapus sesi. |
| `GET /api/v1/me` | User | Profil, `cmsAccess`, tenant, `tokenBalance`, `freePlanRemaining`. |
| `GET /api/v1/folders` | User | Daftar folder proyek milik tenant/user. |
| `POST /api/v1/folders` | User | Membuat folder proyek. |
| `POST /api/v1/uploads/reference-image` | User | Unggah gambar referensi ke Cloudflare R2. |
| `POST /api/v1/generations/plan` | User | Plan Mode via Kenari AI; konsumsi kuota tenant lalu token. |
| `POST /api/v1/generations/estimate` | User | Estimasi token berdasarkan model + parameter. |
| `POST /api/v1/generations/implement` | User | Hold token tenant, masukkan job BullMQ, render Higgsfield. |
| `GET /api/v1/folders/:id/generations` | User | Riwayat generasi + status terkini. |
| `GET /api/v1/admin/overview` | CMS | Statistik tenant, user, provider, model, token. |
| `GET /api/v1/admin/tenants` | CMS | Daftar tenant + saldo. |
| `POST /api/v1/admin/tenants` | CMS | Tambah tenant (nama, slug, token awal, plan awal). |
| `PATCH /api/v1/admin/tenants/:id` | CMS | Aktif/nonaktif tenant. |
| `POST /api/v1/admin/tenants/:id/topup` | CMS | Tambah token + kuota Plan ke tenant. |
| `GET /api/v1/admin/users` | CMS | Daftar user + tenant + saldo tenant. |
| `POST /api/v1/admin/users` | CMS | Daftarkan user baru. |
| `PATCH /api/v1/admin/users/:id/cms-access` | CMS | Grant/revoke akses CMS. |
| `GET /api/v1/admin/providers` | CMS | Daftar provider. |
| `POST /api/v1/admin/providers` | CMS | Tambah provider. |
| `PATCH /api/v1/admin/providers/:id` | CMS | Aktif/nonaktif provider. |
| `GET /api/v1/admin/models` | CMS | Daftar model + tarif. |
| `POST /api/v1/admin/models` | CMS | Tambah model per provider. |
| `PATCH /api/v1/admin/models/:id` | CMS | Aktif/nonaktif model. |
| `GET /api/v1/admin/settings/contact` | CMS | Baca kontak admin. |
| `PUT /api/v1/admin/settings/contact` | CMS | Simpan kontak admin. |
| `GET /api/v1/public/contact` | Publik | Kontak admin untuk halaman request access. |
| `POST /api/v1/public/access-requests` | Publik | (Opsional) Simpan pengajuan akses sebelum diarahkan ke WhatsApp. |

Catatan keamanan: endpoint CMS wajib memeriksa `role = SUPERADMIN` **atau** `cms_access = true`.
Endpoint tenant wajib memfilter dengan `tenant_id` dari sesi, bukan dari body request.

---

## 9. Peta Jalan Pengembangan (3 Bulan — 2 Engineer)

Pembagian peran:
* **Engineer 1 (Backend, Queue & AI Integration):** VPS, PostgreSQL, BullMQ, token ledger,
  integrasi Kenari AI & Higgsfield, Cloudflare R2.
* **Engineer 2 (Frontend & UI/UX):** penyempurnaan landing, drive, studio, CMS, dan integrasi API.

### Jadwal Implementasi per Termin
* **Bulan 1 — Pondasi, Auth & Plan Mode:**
  * Setup VPS Hostinger KVM 2, PostgreSQL, Redis, R2.
  * Auth nyata, sesi HttpOnly, RBAC + `cms_access`, isolasi `tenant_id`.
  * Menghubungkan landing/login/request-access dan CMS read-only ke API.
  * Plan Mode terintegrasi Kenari AI + kuota tenant.
* **Bulan 2 — Higgsfield, Token Ledger & Implement Mode:**
  * Ledger `HOLD`/`COMMIT`/`REFUND` di level tenant.
  * Antrean BullMQ ke Higgsfield (Wan Qwen 5s/10s, image generator) + simpan ke R2.
  * Riwayat folder, unduh, remix, polling status.
* **Bulan 3 — CMS penuh, pengujian & peluncuran:**
  * CMS CRUD tenant/user/provider/model/tarif/kontak admin.
  * Stress test render paralel dan skenario auto-refund.
  * Onboarding tenant pertama dan serah terima.

---

## 10. Kriteria Penerimaan Akhir (Final MVP Acceptance Criteria)

- [ ] **Keamanan Akses:** pengguna tanpa akun tidak dapat membuka `/app`; CMS hanya bisa dibuka
      oleh `SUPERADMIN` atau akun dengan `cms_access = true`.
- [ ] **Isolasi Tenant:** user hanya dapat melihat folder, aset, dan riwayat milik tenant-nya.
- [ ] **Kantong Token Tenant:** semua user dalam tenant memakai satu `token_balance`; top-up dan
      kuota Plan mengubah saldo tenant dan langsung terlihat oleh seluruh user tenant.
- [ ] **Alur Drive:** pengguna wajib membuat atau memilih Folder Proyek sebelum mengakses generator.
- [ ] **Validasi Aset:** unggahan referensi menolak selain `.jpg`, `.jpeg`, `.png`, `.webp`.
- [ ] **Plan Mode Akurat:** memanggil `deepseek-chat` via Kenari AI, menampilkan blueprint yang
      dapat diedit, dan memotong `free_plan_remaining` tenant sebelum membebankan 1 token.
- [ ] **Transparansi & Perlindungan Token:** estimasi (35 token Wan Qwen 10s, 18 token 5s,
      2 token gambar) tampil sebelum Generate, dan `REFUND` otomatis saat render gagal.
- [ ] **Kendali Superadmin:** dapat mengubah API key, tarif model, menambah tenant/user, memberi
      akses CMS, dan mengatur kontak admin tanpa mengubah kode.
- [ ] **Request Access:** calon tenant dapat mengirim pengajuan dari `/request-access` dan pesannya
      masuk ke WhatsApp admin yang diatur di CMS Settings.
- [ ] **Sesi Tunggal:** satu login berlaku untuk Creator dan CMS; perpindahan surface tidak
      memerlukan login ulang.
