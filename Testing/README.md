# Testing

Folder ini menampung tes unit frontend, terpisah dari kode produksi.

```
Testing/
└── Shared/    # tes paket @rupakarsa/shared (API client, token, media, WhatsApp, kartu generasi) — jsdom
```

Tes backend berada di repo terpisah (`rupakarsa-backend/tests/`).

## Menjalankan

```bash
# dari root repo FE
npm test
```

`vitest.config.ts` di root mengarahkan `include` ke `Testing/Shared/**/*.test.{ts,tsx}`, mengalias
`@rupakarsa/shared` ke `packages/shared/src`, dan `@/` ke `apps/creator/src`.

## Cakupan

- `api-client.test.ts` — `apiRequest`: cookie `include`, header JSON pada POST, 204 → `undefined`,
  `{ error: { message } }` → `ApiError`, kegagalan jaringan → status 0.
- `tokens.test.ts` — tarif token model, kapasitas render, dan format Rupiah berbasis rate.
- `media.test.ts` — `isVideoUrl` untuk hasil render video vs gambar.
- `whatsapp.test.ts` — normalisasi nomor WhatsApp admin dan pembentukan link `wa.me`.
- `generation-card.test.tsx` — kartu riwayat merender poster asli saat `outputUrl` ada, dan
  fallback gradient saat belum ada hasil.

## Aturan

- Tes tidak boleh memanggil provider atau API sungguhan; `fetch` selalu di-stub.
- Jangan menaruh fixture biner besar; gunakan data pendek atau URL palsu.
