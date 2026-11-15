# Requirement

Dokumen acuan produk untuk tim frontend dan backend.

| Dokumen | Status | Keterangan |
| :--- | :--- | :--- |
| `final_product_requirement_document_prd_rupakarsa.md` | **Aktif (v2.1)** | Sumber kebenaran produk: arsitektur dua surface, RBAC + `cmsAccess`, kantong token tenant, skema database, kontrak API, dan status implementasi. |
| `requirement_demo_web_generator_ai.md` | **Arsip — tidak disertakan** | Spesifikasi prototipe lama (local-first File System Access, `netlify/functions`). Bertentangan dengan produk saat ini; disimpan di `_rupakarsa-archive/` di luar repo. |

## Cara membaca PRD

- **§0 Status Implementasi** — apa yang sudah jalan di FE (mock) dan apa yang belum (backend).
- **§4 RBAC** — `USER`, `USER + cmsAccess`, `SUPERADMIN`.
- **§7 Skema Database** — token ada di `tenants`, bukan `users`; `users.cms_access`.
- **§8 Kontrak API** — endpoint yang harus dibangun backend.

Dokumen aturan engineering lama ada di `Rules/RULES.md`; bagian integrasi provider di sana masih
relevan, bagian struktur folder dan alur local-file-system tidak.
