"use client";

import {
  CheckCircle2,
  ExternalLink,
  KeyRound,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";

import { formatDateTime } from "@rupakarsa/shared/lib/format";
import type { AiProvider } from "@rupakarsa/shared/lib/types";
import { useAdminStore } from "@rupakarsa/shared/stores/admin-store";
import { useUiStore } from "@rupakarsa/shared/stores/ui-store";
import { Button, Dialog, Field, TextInput } from "@rupakarsa/shared/ui";

function maskKey(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length <= 8) return "••••••••";
  return `${trimmed.slice(0, 3)}••••••••${trimmed.slice(-4)}`;
}

export function ProvidersView() {
  const providers = useAdminStore((state) => state.providers);
  const updateProvider = useAdminStore((state) => state.updateProvider);
  const toggleProvider = useAdminStore((state) => state.toggleProvider);
  const createProvider = useAdminStore((state) => state.createProvider);
  const pushToast = useUiStore((state) => state.pushToast);

  const [editing, setEditing] = useState<AiProvider | null>(null);
  const [draftKey, setDraftKey] = useState("");
  const [testingCode, setTestingCode] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftCode, setDraftCode] = useState("");
  const [draftBaseUrl, setDraftBaseUrl] = useState("");
  const [draftNewKey, setDraftNewKey] = useState("");
  const [draftActive, setDraftActive] = useState(true);

  function openEdit(provider: AiProvider): void {
    setEditing(provider);
    setDraftKey("");
  }

  function handleSave(): void {
    if (!editing) return;
    if (draftKey.trim().length < 6) {
      pushToast("error", "API key minimal 6 karakter.");
      return;
    }
    updateProvider(editing.code, { apiKeyMasked: maskKey(draftKey) });
    setEditing(null);
    pushToast("success", `API key ${editing.name} diperbarui.`);
  }

  function handleTest(provider: AiProvider): void {
    setTestingCode(provider.code);
    window.setTimeout(() => {
      setTestingCode(null);
      pushToast("success", `Koneksi ${provider.name} berhasil (simulasi).`);
    }, 900);
  }

  function openCreate(): void {
    setDraftName("");
    setDraftCode("");
    setDraftBaseUrl("");
    setDraftNewKey("");
    setDraftActive(true);
    setCreateOpen(true);
  }

  function handleCreate(): void {
    if (draftName.trim().length < 2) {
      pushToast("error", "Nama provider minimal 2 karakter.");
      return;
    }
    if (draftCode.trim().length < 2) {
      pushToast("error", "Kode provider minimal 2 karakter.");
      return;
    }
    try {
      new URL(draftBaseUrl.trim());
    } catch {
      pushToast("error", "Base URL tidak valid. Contoh: https://api.provider.com/v1");
      return;
    }
    if (draftNewKey.trim().length < 6) {
      pushToast("error", "API key minimal 6 karakter.");
      return;
    }

    const provider = createProvider({
      name: draftName,
      code: draftCode,
      baseUrl: draftBaseUrl,
      apiKeyMasked: maskKey(draftNewKey),
      isActive: draftActive,
    });
    if (!provider) {
      pushToast("error", "Kode provider sudah dipakai.");
      return;
    }
    setCreateOpen(false);
    pushToast("success", `Provider ${provider.name} ditambahkan.`);
  }

  return (
    <div className="animate-fade-up">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="mono-label text-accent-strong">Integrasi</span>
          <h1 className="display mt-2 text-[clamp(2.2rem,4vw,3.4rem)] text-ink">Providers</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            Kelola API key Kenari AI, Higgsfield, dan Cloudflare R2. Hanya terlihat di surface CMS.
          </p>
        </div>
        <Button
          variant="primary"
          size="lg"
          icon={<Plus className="size-4" aria-hidden />}
          onClick={openCreate}
        >
          Tambah provider
        </Button>
      </header>

      <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-border bg-accent-soft/50 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent-strong" aria-hidden />
          <p className="text-xs leading-relaxed text-ink/70">
            <span className="font-medium text-ink">Key provider hanya dikelola lewat CMS.</span>{" "}
            Di demo FE ini nilai disamarkan dan disimpan lokal; enkripsi server menyusul di tahap
            backend.
          </p>
        </div>
        <span className="mono-label shrink-0 text-[9px] text-accent-strong">Encrypted at rest</span>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {providers.map((provider) => (
          <article key={provider.id} className="card p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-2xl bg-canvas-2 text-ink">
                  <KeyRound className="size-4" aria-hidden />
                </span>
                <div>
                  <h2 className="text-base font-semibold tracking-[-0.02em] text-ink">
                    {provider.name}
                  </h2>
                  <p className="mono-label text-[9px] text-muted">{provider.code}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => toggleProvider(provider.code)}
                aria-pressed={provider.isActive}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  provider.isActive ? "bg-success" : "bg-ink/15"
                }`}
                aria-label={`${provider.isActive ? "Nonaktifkan" : "Aktifkan"} ${provider.name}`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform ${
                    provider.isActive ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="mt-4 space-y-2.5">
              <div>
                <p className="mono-label text-[8px] text-muted">Base URL</p>
                <p className="mt-0.5 truncate font-mono text-[11px] text-ink">{provider.baseUrl}</p>
              </div>
              <div>
                <p className="mono-label text-[8px] text-muted">API key</p>
                <p className="mt-0.5 font-mono text-[11px] text-ink">{provider.apiKeyMasked}</p>
              </div>
              <div className="flex items-center justify-between text-[10px] text-muted">
                <span>Diperbarui {formatDateTime(provider.updatedAt)}</span>
                <span
                  className={`flex items-center gap-1 ${
                    provider.isActive ? "text-success" : "text-muted"
                  }`}
                >
                  <span
                    className={`size-1.5 rounded-full ${
                      provider.isActive ? "bg-success" : "bg-muted"
                    }`}
                  />
                  {provider.isActive ? "Aktif" : "Nonaktif"}
                </span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                loading={testingCode === provider.code}
                icon={
                  testingCode === provider.code ? (
                    <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  ) : (
                    <RefreshCw className="size-3.5" aria-hidden />
                  )
                }
                onClick={() => handleTest(provider)}
              >
                Test connection
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={<Pencil className="size-3.5" aria-hidden />}
                onClick={() => openEdit(provider)}
              >
                Edit key
              </Button>
              <a
                href={provider.baseUrl}
                target="_blank"
                rel="noreferrer"
                className="ml-auto inline-flex items-center gap-1 text-[10px] text-muted hover:text-ink"
              >
                Docs
                <ExternalLink className="size-3" aria-hidden />
              </a>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-2xl border border-border bg-white/60 px-4 py-3 text-[11px] leading-relaxed text-muted">
        <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden />
        <p>
          Kenari AI dipakai untuk Plan Mode (<span className="font-mono text-ink">deepseek-chat</span>
          ), Higgsfield untuk render video/gambar, dan Cloudflare R2 untuk penyimpanan aset.
        </p>
      </div>

      <Dialog
        open={Boolean(editing)}
        title={`Edit API key ${editing?.name ?? ""}`}
        description="Tempel key baru. Nilai lama akan diganti dan disamarkan di daftar."
        onClose={() => setEditing(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleSave}>
              Simpan key
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="API key" htmlFor="provider-key" hint="Minimal 6 karakter.">
            <TextInput
              id="provider-key"
              type="password"
              autoComplete="off"
              value={draftKey}
              onChange={(event) => setDraftKey(event.target.value)}
              placeholder="Tempel API key provider"
              autoFocus
            />
          </Field>
          <p className="rounded-xl border border-border bg-surface-2/60 px-3 py-2 text-[11px] leading-relaxed text-muted">
            Key saat ini: <span className="font-mono text-ink">{editing?.apiKeyMasked}</span>
          </p>
        </div>
      </Dialog>

      <Dialog
        open={createOpen}
        title="Tambah provider"
        description="Provider baru akan muncul di katalog CMS dan bisa dipakai untuk menambah model."
        onClose={() => setCreateOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleCreate}>
              Tambah provider
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="Nama provider" htmlFor="provider-name">
            <TextInput
              id="provider-name"
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              placeholder="Contoh: OpenAI"
              autoFocus
            />
          </Field>
          <Field
            label="Kode provider"
            htmlFor="provider-code"
            hint="Huruf besar, angka, dan underscore. Contoh: OPENAI."
          >
            <TextInput
              id="provider-code"
              value={draftCode}
              onChange={(event) =>
                setDraftCode(event.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_"))
              }
              placeholder="OPENAI"
            />
          </Field>
          <Field label="Base URL" htmlFor="provider-base-url">
            <TextInput
              id="provider-base-url"
              type="url"
              value={draftBaseUrl}
              onChange={(event) => setDraftBaseUrl(event.target.value)}
              placeholder="https://api.provider.com/v1"
            />
          </Field>
          <Field
            label="API key"
            htmlFor="provider-new-key"
            hint="Minimal 6 karakter. Nilai akan disamarkan di daftar."
          >
            <TextInput
              id="provider-new-key"
              type="password"
              autoComplete="off"
              value={draftNewKey}
              onChange={(event) => setDraftNewKey(event.target.value)}
              placeholder="Tempel API key provider"
            />
          </Field>
          <label className="flex items-start gap-3 rounded-xl border border-border bg-surface-2/60 px-3 py-3">
            <input
              type="checkbox"
              checked={draftActive}
              onChange={(event) => setDraftActive(event.target.checked)}
              className="mt-0.5 size-4 accent-[#d93e14]"
            />
            <span>
              <span className="block text-xs font-medium text-ink">Aktifkan provider</span>
              <span className="mt-0.5 block text-[10px] leading-relaxed text-muted">
                Provider aktif bisa dipakai untuk model dan render.
              </span>
            </span>
          </label>
        </div>
      </Dialog>
    </div>
  );
}
