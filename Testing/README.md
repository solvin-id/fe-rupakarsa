# Testing

Folder ini menampung tes unit frontend, terpisah dari kode produksi.

```
Testing/
└── Shared/    # tes paket @rupakarsa/shared (auth, token, plan, store, cookie) — jsdom
```

Tes backend berada di repo terpisah (`rupakarsa-backend/tests/`).

## Menjalankan

```bash
# dari root repo FE
npm test
```

`vitest.config.ts` di root mengarahkan `include` ke `Testing/Shared/**/*.test.ts` dan alias
`@rupakarsa/shared` ke `packages/shared/src`.

## Cakupan

- `auth.test.ts` — aturan akses Creator vs CMS (`hasCmsAccess`, `authorizeSignIn`), helper role workspace.
- `tokens.test.ts` — tarif token, kuota Plan Mode, kapasitas render.
- `plan.test.ts` — struktur Plan Blueprint video/gambar.
- `stores.test.ts` — sesi per workspace, saldo/plan per workspace, grant/revoke akses CMS, provisi akun, CRUD folder.
- `workspaces.test.ts` — registry workspace: create, join request, approve/reject, role, remove, leave, delete.
- `cookies.test.ts` — round-trip cookie akun, registry workspace (chunked), dan pointer sesi.
- `contact.test.ts` — normalisasi nomor WhatsApp admin dan pembentukan link `wa.me`.

## Aturan

- Tes tidak boleh memanggil provider sungguhan.
- Jangan menaruh fixture biner besar; gunakan data URL pendek atau mock.
