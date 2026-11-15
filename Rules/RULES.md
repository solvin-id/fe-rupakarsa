# RULES ENGINEERING — GenVidApp (AI Video Generator)

> **STATUS DOKUMEN (2026-11-15):** ini kontrak era **GenVidApp demo** (v2.1, 2026-11-07) dan
> **bukan** sumber kebenaran untuk produk Rupakarsa saat ini. Acuan produk terkini adalah
> `Requirement/final_product_requirement_document_prd_rupakarsa.md` (v2.1).
>
> Yang **masih berlaku** untuk tim backend: aturan integrasi provider (kredensial
> `x-provider-credentials`, larangan menyimpan key di server, larangan log key/body), katalog model
> dan kapabilitas parameter, normalisasi status, serta batas body/timeout/rate limit.
>
> Yang **tidak berlaku**: struktur `Frontend/`, `Backend/`, `Testing/`, alur local file system, dan
> rute `/app/admin` di dokumen ini.

**Kontrak kerja wajib** untuk setiap model AI/engineer yang mengerjakan `Requirement/`. Baca sebelum menulis kode.

- **Sumber requirement:** `Requirement/final_product_requirement_document_prd_rupakarsa.md`
- **Acuan produk/UX:** Hailuo AI Video (`hailuoai.video`) dan Higgsfield (`higgsfield.ai`)
- **Versi:** v2.1 — 2026-11-07 (historis; lihat banner status di atas)
- **Perubahan utama v2.1:** katalog Kling diperbaiki sesuai console: **Kling 2.6 Pro** (`/kling-video/v2.6/pro/*`, aspect ratio + `sound` + `cfg_scale`) dan **Kling 2.5** (`/kling-video/v2.5-turbo/standard/image-to-video`); entri `kling-2.5-turbo-pro` dihapus.
- **Perubahan utama v2.0:** dukungan **Wan 3.0 Prime** (durasi 2–30, resolusi 480p–1080p, seed/audio/thinking) dan **Marketing Studio Image** (output gambar, preset katalog, enhance prompt); parameter dinamis per model; endpoint `GET /api/presets`; output gambar di riwayat.
- **Perubahan utama v1.9:** dukungan **MiniMax H3** (`minimax/h3/text-to-video`) dengan durasi 5–15, resolusi 2K, aspect ratio lengkap, dan `aigc_watermark`; `durationRange` untuk UI slider.
- **Perubahan utama v1.8:** dukungan **kredensial dari env** (`HF_CREDENTIALS`) sebagai mode lokal/demo opt-in (`ALLOW_ENV_CREDENTIALS`), tetap default BYOK.
- **Perubahan utama v1.7:** backend direfaktor ke OOP (`BaseProvider`, `ProviderRegistry`, `GenerationService`), kredensial **provider-agnostic** (`x-provider-credentials`), provider dinamis via `providers.config.json`, dan seluruh tes dipindah ke folder **`Testing/`**.
- **Perubahan utama v1.6:** backend dipisah ke folder **`Backend/`** (Hono + Node + TypeScript), kredensial Higgsfield memakai **Key ID + Secret**, katalog model + kapabilitas durasi/resolusi/rasio, upload gambar referensi ke file API provider, dan kontrak API baru.
- **Perubahan utama v1.5:** seluruh kode frontend dipindah ke folder **`Frontend/`**; root repo hanya berisi `Frontend/`, `Requirement/`, `Rules/`, `Movie/`, dan `netlify.toml`.
- **Perubahan utama v1.4:** API key tidak lagi terikat ke satu provider (Higgsfield/MiniMax/custom), pengaturan **provider + model** per provider, **asset library** dari folder `input/` (upload/pilih/hapus), dan modal Settings wajib solid (tidak transparan).
- **Perubahan utama v1.3:** model produk disederhanakan menjadi **single-prompt video generator** (tanpa scene/shot), **auth lokal (demo)**, **pengaturan API key & model** (bukan di awal), durasi tetap **3/5/10/15/30 detik**, pilihan **resolusi**, riwayat generasi, dan bahasa visual **futuristik–elegan**.

---

## 0. Cara Kerja Model AI

1. Baca requirement + rules ini.
2. Petakan task ke ID (`REQ-xx`) di §13.
3. Rencana singkat sebelum menulis kode.
4. Implementasi per modul kecil; jangan campur refactor besar.
5. Wajib lulus: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`.
6. Laporkan bagian yang hanya bisa diuji manual di Chromium (folder picker, tulis file).

Larangan umum: mengarang endpoint/field provider, menambah dependency tanpa catatan, menonaktifkan strict/lint/test, menyimpan API key di server.

---

## 1. Scope & Arsitektur

### 1.1 Produk

User menulis satu prompt, memilih **durasi** (3/5/10/15/30 detik), **resolusi** (480p/720p/1080p), **aspect ratio** (16:9/9:16/1:1), lalu generate satu video. Hasil disimpan ke folder lokal user dan tampil di riwayat.

Alur: **Auth → Hubungkan folder → Generator → Riwayat**.

### 1.2 FE vs BE

| Sisi | Tanggung jawab | Dilarang |
|---|---|---|
| **FE** (`Frontend/`, Next.js client) | Auth demo, pengaturan, form generate, polling, tulis video ke folder lokal, riwayat | Memanggil provider langsung; menyimpan data user di server |
| **BE** (`Backend/`, Hono + Node) | Proxy stateless provider-agnostic: validasi kapabilitas model, upload gambar, submit task, normalisasi status | Menyimpan key/file/task; database; menyentuh file system lokal |

- **Auth demo:** sesi disimpan di `localStorage` (tidak ada verifikasi server, tidak ada password tersimpan). Tampilkan catatan "mode demo".
- **Kredensial provider:** **generic**, mengikuti `credentialFields` dari provider. Disimpan di `localStorage` per provider dan dikirim sebagai header `x-provider-credentials` (JSON base64).
- **Provider:** daftar diambil dari `GET /api/providers`. FE merender field kredensial dan model secara dinamis; tidak ada provider yang di-hardcode di UI.
- **Model:** katalog per provider; FE hanya menampilkan durasi/resolusi/rasio yang didukung model.
- **Local-first:** `input/` (asset referensi), `output/` (video), `history.json` (metadata) di perangkat user.
- **Proxy wajib:** provider menolak origin browser (CORS), FE tidak boleh mencoba langsung.
- **Base URL backend:** `NEXT_PUBLIC_API_BASE_URL` (default `http://localhost:8787`).

### 1.3 Out of scope

Scene/shot/storyboard, template proyek, ekstraksi last frame, multi-user server, database, cloud sync, pembayaran/kredit, analytics.

---

## 2. Stack (NON-NEGOTIABLE)

| Layer | Teknologi |
|---|---|
| Framework | **Next.js App Router** + TypeScript strict |
| Styling | **Tailwind CSS v4** (token di `globals.css`), animasi CSS |
| Ikon | **lucide-react** |
| State | **Zustand** (auth, workspace, settings, generation, ui) |
| Validasi | **Zod** |
| Persistensi handle | **idb-keyval** |
| File lokal | **File System Access API** (Chromium, HTTPS) |
| API middleware | **Next.js Route Handler** (Node runtime, Netlify function) |
| Test | **Vitest + RTL** |
| Deploy | **Netlify** + `@netlify/plugin-nextjs` |

Dilarang: Vite/Pages Router, `any`, `@ts-ignore`, `axios`, database/ORM, auth server, library UI besar, memanggil provider dari browser.

---

## 3. Struktur Folder

```text
GenVidApp/
├── Frontend/                    # seluruh kode frontend (Next.js)
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx         # redirect ke /studio
│   │   │   ├── globals.css
│   │   │   ├── studio/page.tsx  # shell aplikasi
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   ├── ui/              # Button, Input, Dialog, Toast
│   │   │   ├── auth/            # AuthScreen
│   │   │   ├── onboarding/      # FolderGate
│   │   │   ├── generator/       # PromptComposer, AssetPicker, HistoryGrid
│   │   │   ├── settings/        # SettingsDialog
│   │   │   ├── layout/          # AppShell
│   │   │   └── studio/StudioApp.tsx
│   │   ├── lib/
│   │   │   ├── fs/              # support, handles, file-system, workspace, history, uploads, videos
│   │   │   ├── api/             # ApiClient (class), CredentialVault (class), polling
│   │   │   ├── schema/          # generation.ts, migrations.ts
│   │   │   ├── naming/names.ts
│   │   │   └── utils/           # base64, image, cn
│   │   └── stores/              # auth, assets, workspace, settings, providers, generation, ui
│   ├── package.json
│   └── tsconfig.json
├── Backend/                     # API proxy stateless (Hono + Node)
│   ├── src/
│   │   ├── index.ts             # bootstrap server
│   │   ├── app.ts               # Hono app + middleware
│   │   ├── config.ts
│   │   ├── core/                # contracts, errors, status
│   │   ├── http/                # credentials, logger, rate-limit, upstream-client (class)
│   │   ├── services/            # GenerationService (class)
│   │   ├── providers/
│   │   │   ├── types.ts
│   │   │   ├── base-provider.ts # abstract class BaseProvider
│   │   │   ├── provider-registry.ts # class ProviderRegistry
│   │   │   ├── higgsfield/      # definition + client class + provider class
│   │   │   └── generic/         # config schema + GenericRestProvider
│   │   └── routes/              # generate, providers, health
│   ├── providers.config.example.json
│   ├── package.json
│   └── tsconfig.json
├── Testing/                     # seluruh tes unit
│   ├── Frontend/
│   ├── Backend/
│   └── README.md
├── Requirement/                 # PRD (read-only)
├── Rules/                       # dokumen ini
├── Movie/                       # contoh workspace lokal (input/output/history.json)
└── netlify.toml                 # konfigurasi deploy frontend (base = Frontend)
```

Aturan: `lib/fs/**` client-only; kode provider hanya di `Backend/src/providers/**`; route tidak boleh tahu detail provider. File > 300 baris dipecah.

---

## 4. Konvensi

- File komponen `PascalCase.tsx`; non-komponen `kebab-case.ts`; fungsi `camelCase`; tipe `PascalCase`; konstanta `SCREAMING_SNAKE_CASE`.
- Dilarang `any`; parse data eksternal dengan Zod; `import type`; return type eksplisit untuk fungsi publik `lib/**`.
- Client Component hanya jika butuh state/effect/event/FS. Tidak ada `window` di module scope.
- Cleanup wajib: abort, object URL, timer.
- Komentar hanya untuk constraint yang tidak terlihat dari kode.
- Route handler: `runtime = "nodejs"`, validasi Zod, `AbortSignal.timeout`, tanpa log key/body.

---

## 5. Kontrak Data (FROZEN)

### 5.1 `localStorage`

| Key | Isi |
|---|---|
| `genvid.session` | `{ name, email, signedInAt }` |
| `genvid.provider` | id provider aktif |
| `genvid.credentials.<providerId>` | JSON kredensial sesuai `credentialFields` |
| `genvid.modelId.<providerId>` | model default per provider |

### 5.2 `workspace_config.json` (root folder)

```jsonc
{
  "schemaVersion": 5,
  "workspaceName": "AI Studio",
  "createdAt": "2026-11-06T08:00:00.000Z",
  "updatedAt": "2026-11-06T08:00:00.000Z"
}
```

### 5.3 `history.json` (root folder)

```jsonc
{
  "schemaVersion": 1,
  "items": [
    {
      "id": "gen_01J...",
      "prompt": "A cinematic shot of ...",
      "durationSec": 5,                    // 3 | 5 | 10 | 15 | 30
      "resolution": "1080p",               // "480p" | "720p" | "1080p"
      "aspectRatio": "16:9",               // "16:9" | "9:16" | "1:1"
      "modelId": "higgsfield-default",
      "provider": "higgsfield",
      "referenceFileName": "ref_20261106_153000.jpg", // null bila tanpa gambar
      "fileName": "vid_20261106_153012_a1b2.mp4",     // dialokasikan saat item dibuat
      "status": "running",                 // "running" | "succeeded" | "failed"
      "taskId": "task_abc123",
      "errorCode": null,
      "errorMessage": null,
      "createdAt": "2026-11-06T08:05:00.000Z",
      "completedAt": null
    }
  ],
  "createdAt": "2026-11-06T08:00:00.000Z",
  "updatedAt": "2026-11-06T08:10:00.000Z"
}
```

Aturan: tidak ada base64/blob di JSON; `fileName` relatif; timestamp ISO UTC; ID `gen_` + `crypto.randomUUID()`; file yang hilang ditandai di UI (derived), bukan diubah di JSON.

### 5.4 Enum tetap

```ts
PROVIDERS = ["higgsfield", "minimax", "custom"]
DURATIONS = [3, 5, 10, 15, 30]
RESOLUTIONS = ["480p", "720p", "1080p"]
ASPECT_RATIOS = ["16:9", "9:16", "1:1"]
MODELS = {
  higgsfield: ["higgsfield-default", "higgsfield-pro", "higgsfield-turbo"],
  minimax: ["minimax-hailuo-02", "minimax-video-01"],
  custom: ["custom-model"],   // atau ID manual
}
```

Menambah nilai enum = perubahan kontrak → perbarui dokumen ini.

---

## 6. Aturan File System (CLIENT-ONLY)

- Deteksi `showDirectoryPicker`; browser tidak didukung → layar unsupported.
- Handle root di IndexedDB; `queryPermission`/`requestPermission` dari gesture user; handle stale → pilih folder ulang.
- `initializeWorkspace(root)` membuat `input/`, `output/`, `workspace_config.json`, `history.json` (idempoten).
- Semua tulis lewat antrean (`enqueueWrite`) + single-flight; `createWritable()` sudah atomik saat `close()`.
- Nama file kanonik:
  - referensi: `ref_YYYYMMDD_HHMMSS.<ext>` (unik, suffix `_2` bila bentrok)
  - video: `vid_YYYYMMDD_HHMMSS_<rand4>.mp4`
- Upload referensi: PNG/JPG/WEBP ≤ 20 MB. Video hasil ≤ 500 MB.
- Object URL wajib di-revoke.
- Error dinormalisasi ke `AppError` (`FS_*`), pesan Indonesia.

---

## 7. Backend API (folder `Backend/`)

Stack: **Hono + Node 20 + TypeScript strict + Zod + Vitest**. Stateless, tanpa database, tanpa penyimpanan file/task.

### 7.1 Endpoint

| Method | Path | Auth |
|---|---|---|
| `GET` | `/api/health` | tidak perlu |
| `GET` | `/api/providers` | tidak perlu |
| `GET` | `/api/presets` | `x-provider-credentials` |
| `POST` | `/api/generate` | `x-provider-credentials` |

### 7.2 Kredensial (provider-agnostic)

- Header: `x-provider-credentials` berisi **JSON base64**.
- Isi mengikuti `credentialFields` provider, misalnya `{ "keyId": "...", "keySecret": "..." }` atau `{ "apiKey": "..." }`.
- `CredentialsCodec` men-decode dan memvalidasi field wajib; provider mengubahnya menjadi header upstream yang sesuai.
- Higgsfield: `Authorization: Key <KEY_ID>:<KEY_SECRET>`.
- Tidak ada fallback key di server/env. Secret tidak pernah di-log.

#### Mode env (opsional, lokal/demo)

- `ALLOW_ENV_CREDENTIALS=true` + `HF_CREDENTIALS=<keyId>:<keySecret>` di `Backend/.env.local`/`.env`.
- Hanya dipakai jika: flag aktif, request **tidak** mengirim header, dan provider `higgsfield`.
- Header selalu menang (BYOK).
- Default `false`; dilarang di deployment publik karena key menjadi milik server.
- Provider definition menandai `serverCredentials: true` agar FE tidak memaksa input kredensial.

### 7.3 Provider & katalog model

`GET /api/providers` → `{ providers: ProviderDefinition[] }`:

```
id, label, description,
credentialFields: [{ key, label, secret, required, placeholder? }],
models: [{ id, label, description, tier, costHint,
           durations, defaultDurationSec,
           resolutions, defaultResolution,
           aspectRatios, defaultAspectRatio,
           resolutionConfigurable, aspectRatioConfigurable,
           supportsText, supportsImage, supportsNegativePrompt, notes }]
```

FE merender field kredensial dan pilihan model dari respons ini; tidak ada provider/model yang di-hardcode di UI.

Provider bawaan: **Higgsfield** (`kling-2.6-pro`, `kling-2.5-turbo-standard`, `minimax-hailuo-2.3`, `minimax-h3`, `wan-3.0-prime`, `marketing-studio-image`).

- `kling-2.6-pro`: durasi 5/10, aspect `16:9/9:16/1:1`, `sound` on/off, `cfg_scale` 0–1; endpoint `/kling-video/v2.6/pro/text-to-video` dan `/image-to-video`.
- `kling-2.5-turbo-standard` (label Kling 2.5): image-to-video saja, endpoint `/kling-video/v2.5-turbo/standard/image-to-video`.
- `minimax-h3`: durasi 5–15, 2K, aspect `auto/adaptive/21:9/16:9/4:3/1:1/3:4/9:16`, `aigc_watermark=false`.
- `wan-3.0-prime`: durasi 2–30, resolusi `480p/720p/1080p`, aspect `adaptive/16:9/4:3/1:1/3:4/9:16`, parameter `seed`, `generate_audio`, `enable_thinking`.
- `marketing-studio-image`: **output gambar**, resolusi `1k/2k/4k`, aspect `auto/1:1/3:2/2:3/4:3/3:4/16:9/9:16/21:9`, parameter `enhance_prompt` + `preset_id` (dari `GET /api/presets`).

Provider lain ditambahkan lewat `providers.config.json` (`GenericRestProvider`).

### 7.4 `POST /api/generate` — GENERATE

```jsonc
{
  "action": "GENERATE",
  "provider": "higgsfield",
  "modelId": "kling-2.6-pro",
  "prompt": "…",
  "negativePrompt": "",
  "durationSec": 5,
  "resolution": "1080p",
  "aspectRatio": "16:9",
  "options": { "seed": 123, "generate_audio": true, "enable_thinking": false },
  "image": { "dataUrl": "data:image/jpeg;base64,…" }   // opsional
}
```

`options` divalidasi terhadap `parameters` model (boolean/number/select/preset). FE merender kontrol sesuai model yang dipilih; model tanpa durasi (image) tidak menampilkan durasi.

Respons `202`: `{ taskId, modelId, mode, outputType, applied: { durationSec, resolution, aspectRatio } }`.

Untuk `minimax-h3`, body provider: `{ prompt, duration, resolution: "2K", aspect_ratio, aigc_watermark: false }`.
Untuk `wan-3.0-prime`: `{ prompt, duration, resolution, aspect_ratio, seed?, generate_audio, enable_thinking }`.
Untuk `marketing-studio-image`: `{ prompt, resolution, aspect_ratio, enhance_prompt, preset_id?, image_urls? }`; enhanced mode wajib preset + satu gambar.

Alur gambar referensi (Higgsfield): data URL → `POST /files/generate-upload-url` → `PUT` ke presigned URL dengan `upload_headers` → `public_url` → dikirim sebagai `image_url` (video) atau `image_urls[]` (image).

### 7.5 `POST /api/generate` — CHECK_STATUS

```jsonc
{ "action": "CHECK_STATUS", "provider": "higgsfield", "modelId": "kling-2.6-pro", "taskId": "…" }
```

Respons: `{ status: "pending"|"running"|"succeeded"|"failed", progress, videoUrl?, imageUrl?, expiresAt?, reason? }`.

Mapping Higgsfield: `queued`→pending, `in_progress`→running, `completed`→succeeded (`video.url` atau `images[0].url`), `failed`/`nsfw`/`canceled`→failed. Provider generik memakai `statusMap` pada config.

### 7.5a `GET /api/presets`

Query `provider`, `cursor`; memakai kredensial yang sama. Meneruskan `GET /marketing-studio/image/presets` dan mengembalikan `{ items: [{ id, type, name }], cursor, total? }`. Hanya provider yang mengimplementasikan `listPresets` (Higgsfield).

### 7.6 Batas OOP

- `BaseProvider` (abstract): validasi kapabilitas model + template `resolve()`; subclass hanya mengisi endpoint, submit, status, upload.
- `ProviderRegistry`: lookup provider berdasarkan id; route tidak tahu detail provider.
- `GenerationService`: orkestrasi validasi kredensial → upload → submit.
- `UpstreamClient`: timeout, parsing JSON, pemetaan error HTTP.
- `CredentialsCodec`, `Logger`, `RateLimiter`: utilitas berbasis class.
- `GenericRestProvider`: provider REST generik dari konfigurasi JSON.

### 7.7 Error

`{ error: { code, message, requestId, details? } }` dengan code: `INVALID_PAYLOAD`, `MISSING_CREDENTIALS`, `CREDENTIALS_INVALID`, `PROVIDER_UNSUPPORTED`, `UPSTREAM_AUTH`, `UPSTREAM_RATE_LIMIT`, `UPSTREAM_TIMEOUT`, `UPSTREAM_ERROR`, `TASK_NOT_FOUND`, `MODEL_UNSUPPORTED`, `DURATION_UNSUPPORTED`, `RESOLUTION_UNSUPPORTED`, `ASPECT_RATIO_UNSUPPORTED`, `IMAGE_REQUIRED`, `IMAGE_NOT_SUPPORTED`, `IMAGE_TOO_LARGE`, `IMAGE_UNSUPPORTED_TYPE`, `UPLOAD_FAILED`, `RATE_LIMITED`, `PAYLOAD_TOO_LARGE`, `INTERNAL`.

### 7.8 Middleware & batasan

- Request ID (`x-request-id`) + structured log tanpa body/kredensial.
- CORS allowlist dari `ALLOWED_ORIGINS`.
- Body limit 8 MB; timeout upstream 15 s; upload 30 s.
- Rate limit in-memory 60 request/menit/IP.
- Retensi output provider 7 hari → FE wajib mengunduh ke `output/` segera setelah `succeeded`.

Polling di FE: 3 s → 5 s setelah 60 s, batas 15 menit, abort saat unmount, `taskId` disimpan di history agar bisa dicek ulang.

---

## 8. UI/UX & Bahasa Visual

### 8.1 Prinsip

**Futuristik, animatif, tetapi elegant.** Bukan neon berlebihan: latar gelap dalam, aksen gradient cyan→violet→pink, glassmorphism halus, ruang lega, tipografi tegas, animasi lambat dan bertujuan.

- Palet: canvas `#06080f`, surface `rgba(255,255,255,0.04)`, border `rgba(255,255,255,0.08)`, accent cyan `#22d3ee`, violet `#8b5cf6`, pink `#f472b6`.
- Efek: aurora blur, grid halus, glow pada tombol utama, gradient text untuk headline.
- Animasi: `fade-up` masuk bertahap, drift aurora 18–24 s, hover lift/glow. Hormati `prefers-reduced-motion`.
- Jangan animasi yang mengganggu input atau mengurangi kontras.

### 8.2 Layar wajib

1. **Auth** — Masuk/Daftar (email + password, nama saat daftar), catatan mode demo.
2. **Hubungkan Folder** — penjelasan `input/` & `output/`, tombol pilih folder, reconnect.
3. **Generator** — hero + prompt composer + kontrol durasi/resolusi/aspect + **asset library** + tombol generate + progres.
4. **Riwayat** — grid kartu video, status, aksi buka/hapus.
5. **Pengaturan Provider & Model AI** — provider, field kredensial dinamis, model per provider, folder kerja, sign out.
6. **Unsupported Browser**.

### 8.2a Asset library (input/)

- Sumber tunggal: file gambar di `<root>/input/` (PNG/JPG/JPEG/WEBP ≤ 20 MB).
- Aksi: **upload aset baru** (ditulis ke `input/`), **pilih aset yang sudah ada**, **hapus aset**.
- Picker menampilkan thumbnail dari file lokal (object URL), status terpilih jelas, dan empty state dengan CTA upload.
- Aset terpilih dipakai sebagai satu-satunya referensi gambar saat generate; tidak ada upload ulang ke provider selain base64 saat request.
- Object URL wajib di-revoke saat reload/hapus/unmount.

### 8.2b Modal & permukaan

- Modal **tidak transparan**: latar solid gelap (`#0b0f18`), border halus, backdrop blur pada overlay.
- Konten modal scrollable dengan header/footer sticky; tombol tutup berikon dan berlabel.
- Z-index modal di atas aurora/grid dekoratif.

### 8.3 Accessibility

- Semua kontrol punya label/`aria-label`; focus ring terlihat; dialog `Esc` menutup.
- Kontras AA pada teks; status tidak hanya warna.
- Tombol disabled + alasan (tooltip/hint).
- Hormati `prefers-reduced-motion`.

### 8.4 Copywriting

Bahasa Indonesia, ringkas, imperatif. Error tidak menampilkan detail mentah/provider.

---

## 9. Keamanan

- API key hanya di `localStorage`; dikirim ke proxy same-origin via header; tidak pernah di-log/URL/cookie.
- Server tanpa fallback key; tidak menyimpan apa pun.
- Sanitasi nama file; tolak path traversal; hanya ekstensi yang diizinkan.
- `/api/media` (bila diaktifkan) wajib allowlist host HTTPS (anti-SSRF).
- CSP: `default-src 'self'`; `img-src 'self' data: blob:`; `media-src 'self' blob: https://<cdn-provider>`; `connect-src 'self' https://<cdn-provider>`.
- Dilarang `dangerouslySetInnerHTML`.

---

## 10. Performa

- Base64 hanya saat generate; kompres > 4 MB (maks 1920 px, JPEG 0.9); body ≤ 6 MB.
- Streaming video ke disk; batas 500 MB; revoke object URL.
- Riwayat > 50 item: render bertahap/lazy; video hanya dimuat saat dialog dibuka.
- Autosave history terkoalesensi (500–800 ms).
- Route handler tidak menahan > 10 detik.

---

## 11. Testing

- Unit: schema/enum, naming file, migrasi, helper history (append/update), polling/backoff, normalisasi error.
- Server (fase BE): handler dengan `fetch` dimock (sukses, 401, 429, timeout, payload invalid).
- Manual checklist (Chromium): pilih folder, generate (proxy dimock/stub), file muncul di `output/`, riwayat bertahan setelah reload.
- Dilarang memanggil provider sungguhan.

---

## 12. Definition of Done

- [ ] Perilaku sesuai REQ terkait.
- [ ] Batas FE/BE dipatuhi.
- [ ] Tidak melanggar §15.
- [ ] lint, typecheck, test, build lulus.
- [ ] Kontrak data/API dipatuhi; perubahan skema + migrasi + dokumen.
- [ ] State UI lengkap (idle, loading, error, empty, disabled, progress).
- [ ] Error ramah, tanpa kebocoran key/detail provider.
- [ ] Cleanup resource.
- [ ] Aksesibilitas dasar + reduced-motion.

---

## 13. Traceability

| ID | Requirement PRD | Status di v1.3 |
|---|---|---|
| REQ-01 | API key & folder | **Diubah:** auth + folder; API key pindah ke Settings |
| REQ-02 | Auto-create `input/` & `output/` | Ya |
| REQ-03 | Sub-folder proyek + `project_state.json` | **Dihapus:** satu workspace, `history.json` |
| REQ-04 | Simpan aset + deskripsi | **Diubah:** asset library dari `input/` (upload/pilih/hapus) |
| REQ-05 | Refresh aset dari disk | **Ya:** asset library memuat ulang isi `input/` |
| REQ-06 | Auto-save storyboard | **Diubah:** auto-save `history.json` |
| REQ-07 | Ekstraksi last frame | **Dihapus** |
| REQ-08 | Base64 + final prompt | Prompt user langsung + base64 referensi |
| REQ-09 | Request & polling | Ya |
| REQ-10 | Auto-write `.mp4` + player | Ya |
| REQ-11 | Berbagi folder fisik | Ya (input/output/history.json) |
| NEW-01 | Auth lokal demo | `stores/auth-store.ts` |
| NEW-02 | Durasi 3/5/10/15/30 | `PromptComposer` |
| NEW-03 | Resolusi 480p/720p/1080p | `PromptComposer` |
| NEW-04 | Settings provider + API key + model | `SettingsDialog` |
| NEW-05 | Riwayat generasi | `HistoryGrid` + `history.json` |
| NEW-06 | Visual futuristik-elegan | `globals.css` + `AppShell` |
| NEW-07 | Asset library dari `input/` | `AssetPicker` + `assets-store` |
| NEW-08 | Kredensial provider generik | `CredentialVault` + `x-provider-credentials` |
| NEW-09 | Provider dinamis (tanpa hardcode) | `BaseProvider` + `ProviderRegistry` + `providers.config.json` |
| NEW-10 | Tes terpusat | folder `Testing/Frontend` & `Testing/Backend` |

---

## 14. Dependency

`next`, `react`, `react-dom`, `typescript`, `tailwindcss`, `lucide-react`, `zustand`, `zod`, `idb-keyval`, `clsx` (opsional).
Dev: `eslint`, `eslint-config-next`, `prettier`, `vitest`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `jsdom`, `vite-tsconfig-paths`.
Tambahan di luar daftar wajib alasan + persetujuan. Dilarang: `axios`, `moment`, `lodash` penuh, library UI besar, auth/DB/ORM.

---

## 15. Larangan

1. ❌ Scene/shot/storyboard/template proyek di UI baru.
2. ❌ Memanggil provider langsung dari browser.
3. ❌ API key di server/env/log; fallback key.
4. ❌ Menyimpan file/task user di server.
5. ❌ Database, auth server, cloud sync, analytics.
6. ❌ `any`, `@ts-ignore`, JS tanpa tipe.
7. ❌ File System API dari server/SSR/module scope.
8. ❌ Impor silang `lib/fs` ↔ `app/api`.
9. ❌ Base64 di `history.json`.
10. ❌ Nama file tanpa sanitasi / path traversal.
11. ❌ Menimpa video/riwayat tanpa konfirmasi.
12. ❌ Polling di server; route handler > 10 s.
13. ❌ Log key/body/prompt penuh.
14. ❌ Error mentah provider ke user.
15. ❌ Detail provider di luar adapter.
16. ❌ Animasi tanpa `prefers-reduced-motion`.
17. ❌ `dangerouslySetInnerHTML`.
18. ❌ Menambah dependency tanpa persetujuan.
19. ❌ Menghapus tes/lint agar CI hijau.
20. ❌ Mengubah `Requirement/`.

---

## 16. ADR

### ADR-001 — Produk disederhanakan ke single-shot generator (v1.3)
- **Konteks:** storyboard per scene terlalu spesifik; acuan Hailuo/Higgsfield adalah prompt → video.
- **Keputusan:** satu prompt, durasi tetap, resolusi, aspect ratio; tanpa scene/shot/template.
- **Konsekuensi:** skema `project_state.json` diganti `history.json`; modul storyboard/template dihapus.

### ADR-002 — Auth demo lokal
- **Konteks:** belum ada backend auth; user meminta alur auth, bukan input API di awal.
- **Keputusan:** sesi disimpan di `localStorage`, tanpa verifikasi server, dengan catatan eksplisit di UI.
- **Konsekuensi:** bukan keamanan produksi; API key tetap di Settings dan hanya dikirim ke proxy.

### ADR-003 — API middleware tetap stateless
- **Konteks:** provider menolak origin browser (CORS).
- **Keputusan:** satu Route Handler `/api/generate` untuk `GENERATE`/`CHECK_STATUS`; tanpa penyimpanan.
- **Konsekuensi:** deploy butuh runtime server (Netlify plugin), bukan static export.

### ADR-004 — Settings, bukan onboarding API key
- **Keputusan:** API key & model diatur di dialog Settings kapan saja; onboarding hanya auth + folder.
- **Konsekuensi:** user bisa mengganti model/key tanpa mengulang setup.

### ADR-005 — Provider-agnostic (v1.4)
- **Konteks:** requirement awal menyebut Higgsfield, tetapi user akan memakai provider lain.
- **Keputusan:** key disimpan per provider (`higgsfield`/`minimax`/`custom`), header proxy menjadi `x-provider-key`, label UI tidak menyebut merek provider tertentu pada elemen generik.
- **Konsekuensi:** adapter provider di BE wajib memetakan `provider` → endpoint/field; UI tetap netral.

### ADR-006 — Asset library berbasis folder `input/`
- **Konteks:** sebelumnya hanya upload satu gambar per generate, file tersimpan tanpa bisa dipilih ulang.
- **Keputusan:** `input/` menjadi sumber aset; UI menampilkan library, upload menambah file baru, pilih/hapus tanpa duplikasi.
- **Konsekuensi:** refresh aset dari disk kembali in-scope; object URL harus dikelola.

### ADR-007 — Backend dipisah ke folder `Backend/` (v1.6)
- **Konteks:** proxy harus stateless, mudah diuji, dan tidak terikat pada runtime Next.js; kredensial provider berupa pasangan ID+Secret.
- **Keputusan:** service Hono + Node + TypeScript strict dengan lapisan `core → providers → routes`, katalog model sebagai sumber kebenaran kapabilitas, dan adapter Higgsfield terisolasi.
- **Konsekuensi:** FE memanggil `NEXT_PUBLIC_API_BASE_URL`; deploy backend terpisah; CORS allowlist wajib; model/ durasi/ resolusi divalidasi di backend, bukan hanya UI.

### ADR-008 — OOP & provider dinamis (v1.7)
- **Konteks:** penambahan provider baru tidak boleh mengubah route/UI; kode harus mudah diuji dan dirawat.
- **Keputusan:** backend memakai `BaseProvider` (abstract), `ProviderRegistry`, `GenerationService`, `UpstreamClient`; frontend memakai `ApiClient` + `CredentialVault` class dan store provider dinamis. Kredensial dikirim sebagai JSON base64 di `x-provider-credentials`. Provider non-Higgsfield ditambahkan lewat `providers.config.json` tanpa menyentuh route.
- **Konsekuensi:** UI merender field kredensial/model dari `GET /api/providers`; semua tes dipindah ke `Testing/`; provider baru hanya perlu config atau subclass `BaseProvider`.

### ADR-009 — Kredensial env opt-in (v1.8)
- **Konteks:** untuk pengujian lokal cepat, user ingin memakai `HF_CREDENTIALS` seperti contoh SDK Higgsfield tanpa mengisi UI.
- **Keputusan:** backend memuat `.env.local`/`.env` via `dotenv`; jika `ALLOW_ENV_CREDENTIALS=true` dan request tanpa header, provider `higgsfield` memakai `HF_CREDENTIALS`. Default mati; header selalu menang; provider definition menandai `serverCredentials`.
- **Konsekuensi:** mode ini khusus lokal/demo, tidak untuk deployment publik; FE menampilkan catatan “dikelola backend” dan tidak memaksa input kredensial.

---

## 17. Deployment

- **Frontend:** Netlify, `base = "Frontend"`, `@netlify/plugin-nextjs`, Node 20+. Tanpa `output: 'export'`.
- **Backend:** service Node terpisah (Railway/Render/Fly/VM) atau Netlify Function dengan adapter Hono. Jalankan `npm run build && npm start`.
- FE: set `NEXT_PUBLIC_API_BASE_URL` ke URL backend.
- BE: set `ALLOWED_ORIGINS` ke origin frontend (pisahkan dengan koma).
- Tanpa env rahasia provider (BYOK). Opsional: `PORT`, `MAX_BODY_BYTES`, `UPSTREAM_TIMEOUT_MS`, `UPLOAD_TIMEOUT_MS`, `RATE_LIMIT_*`, `PROVIDERS_CONFIG_PATH`.
- Mode lokal: `ALLOW_ENV_CREDENTIALS=true` + `HF_CREDENTIALS=<id>:<secret>` (jangan di produksi publik).
- HTTPS wajib untuk File System Access API.
- Perintah lokal: `cd Frontend && npm run dev` (3000) dan `cd Backend && npm run dev` (8787).

---

## 18. Changelog

| Versi | Tanggal | Perubahan |
|---|---|---|
| v1.0 | 2026-11-06 | Dokumen awal (storyboard + proxy). |
| v1.1 | 2026-11-06 | Percobaan tanpa API (dibatalkan). |
| v1.2 | 2026-11-06 | API middleware + local-first + template. |
| v1.3 | 2026-11-06 | Single-prompt generator, auth demo, settings API/model, durasi & resolusi, riwayat, visual futuristik; storyboard/template/last-frame dihapus. |
| v1.4 | 2026-11-07 | Provider-agnostic API key (`x-provider-key`), provider + model di Settings, asset library dari `input/`, modal solid, `workspace_config` v5. |
| v1.5 | 2026-11-07 | Kode frontend dipindah ke `Frontend/`; root hanya berisi `Frontend/`, `Requirement/`, `Rules/`, `Movie/`, dan `netlify.toml`; file generated & helper tak terpakai dihapus. |
| v1.6 | 2026-11-07 | Backend baru di `Backend/` (Hono): kredensial Key ID+Secret, katalog model + kapabilitas, upload gambar referensi, proxy generate/status, rate limit, CORS, structured log, 33 unit test. |
| v1.7 | 2026-11-07 | Refactor OOP (BaseProvider/ProviderRegistry/GenerationService/UpstreamClient), kredensial generik `x-provider-credentials`, provider dinamis via `providers.config.json`, UI merender field/model dari `/api/providers`, tes dipindah ke `Testing/`. |
| v1.8 | 2026-11-07 | Mode kredensial env opt-in: `HF_CREDENTIALS` + `ALLOW_ENV_CREDENTIALS` (default mati), `serverCredentials` di provider definition, `dotenv` loading, UI menandai kredensial dikelola backend. |
| v1.9 | 2026-11-07 | MiniMax H3 (`minimax/h3/text-to-video`): durasi 5–15 (`durationRange`), resolusi 2K, aspect ratio lengkap, `aigc_watermark=false`; request mapping per model di HiggsfieldProvider. |
| v2.0 | 2026-11-07 | Wan 3.0 Prime (durasi 2–30, seed/audio/thinking) dan Marketing Studio Image (output gambar, preset, enhance prompt); parameter dinamis per model; `/api/presets`; output gambar di riwayat (`.png`). |
| v2.1 | 2026-11-07 | Katalog Kling disesuaikan dengan console: Kling 2.6 Pro (v2.6 pro, aspect/sound/cfg_scale) dan Kling 2.5 (standard image-to-video); Kling 2.5 Turbo Pro dihapus. |
