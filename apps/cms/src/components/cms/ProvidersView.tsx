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
  Trash2,
} from "lucide-react";
import { useState } from "react";

import {
  useAdminCharactersQuery,
  useAdminProvidersQuery,
  useCreateCharacterMutation,
  useCreateProviderMutation,
  useDeleteProviderMutation,
  useRefreshCharacterMutation,
  useSyncProviderModelsMutation,
  useTestProviderMutation,
  useUpdateProviderMutation,
} from "@rupakarsa/shared/hooks/use-admin";
import { formatDateTime } from "@rupakarsa/shared/lib/format";
import type { AiCharacterReference, AiProvider } from "@rupakarsa/shared/lib/types";
import { useUiStore } from "@rupakarsa/shared/stores/ui-store";
import { Button, Dialog, Field, Select, TextArea, TextInput } from "@rupakarsa/shared/ui";

const KIND_LABELS: Record<AiProvider["kind"], string> = {
  HIGGSFIELD: "Higgsfield",
  OPENAI_COMPATIBLE: "OpenAI-compatible",
};

const CHARACTER_STATUS_STYLES: Record<AiCharacterReference["status"], string> = {
  NOT_READY: "bg-canvas-2 text-ink/70",
  QUEUED: "bg-warning/10 text-warning",
  IN_PROGRESS: "bg-accent/10 text-accent-strong",
  COMPLETED: "bg-success/10 text-success",
  FAILED: "bg-danger/10 text-danger",
};

/**
 * Soul ID training for Higgsfield: one reusable character per set of 1–100 public images, polled
 * until the provider completes it, then selectable on a SOUL model in Models & tarif.
 */
function SoulIdTuningCard() {
  const pushToast = useUiStore((state) => state.pushToast);
  const charactersQuery = useAdminCharactersQuery();
  const createCharacter = useCreateCharacterMutation();
  const refreshCharacter = useRefreshCharacterMutation();

  const [name, setName] = useState("");
  const [modelVersion, setModelVersion] = useState<"v1" | "v2" | "cinema">("v1");
  const [urls, setUrls] = useState("");

  const characters = charactersQuery.data ?? [];

  function handleCreate(): void {
    const imageUrls = urls
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (name.trim().length === 0) {
      pushToast("error", "Nama karakter wajib diisi.");
      return;
    }
    if (imageUrls.length < 1 || imageUrls.length > 100) {
      pushToast("error", "Latih karakter dari 1–100 URL gambar.");
      return;
    }
    const invalid = imageUrls.find((url) => !/^https?:\/\//.test(url));
    if (invalid) {
      pushToast("error", `URL tidak valid: ${invalid}`);
      return;
    }

    createCharacter.mutate(
      { name: name.trim(), modelVersion, imageUrls },
      {
        onSuccess: () => {
          setName("");
          setUrls("");
          pushToast("success", "Training Soul ID dikirim. Cek status berkala.");
        },
        onError: (error) => pushToast("error", error.message),
      },
    );
  }

  function copyId(value: string): void {
    void navigator.clipboard.writeText(value).then(
      () => pushToast("success", "External id disalin."),
      () => pushToast("error", "Gagal menyalin."),
    );
  }

  return (
    <article className="card p-5 lg:col-span-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="mono-label text-muted">Higgsfield</p>
          <h2 className="mt-1 text-base font-semibold tracking-[-0.02em] text-ink">
            Soul ID tuning
          </h2>
          <p className="mt-1 max-w-2xl text-[11px] leading-relaxed text-muted">
            Latih karakter dari 1–100 foto. Setelah selesai, pilih referensi ini di Models &amp;
            tarif untuk model SOUL.
          </p>
        </div>
        <ShieldCheck className="size-4 text-accent-strong" aria-hidden />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,0.7fr)_minmax(0,0.3fr)]">
        <Field label="Nama karakter" htmlFor="soul-name">
          <TextInput
            id="soul-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Contoh: Mbok Srini"
          />
        </Field>
        <Field label="Versi model" htmlFor="soul-version">
          <Select
            id="soul-version"
            value={modelVersion}
            onChange={(value) => setModelVersion(value as "v1" | "v2" | "cinema")}
            options={[
              { value: "v1", label: "v1" },
              { value: "v2", label: "v2" },
              { value: "cinema", label: "cinema" },
            ]}
          />
        </Field>
      </div>

      <Field
        label="URL gambar (satu per baris)"
        htmlFor="soul-urls"
        hint="Gambar harus dapat diakses publik oleh Higgsfield."
      >
        <TextArea
          id="soul-urls"
          rows={3}
          value={urls}
          onChange={(event) => setUrls(event.target.value)}
          placeholder={"https://cdn.contoh.id/foto-1.jpg\nhttps://cdn.contoh.id/foto-2.jpg"}
          className="min-h-20 font-mono text-[11px]"
        />
      </Field>

      <div className="mt-2 flex justify-end">
        <Button variant="primary" size="sm" loading={createCharacter.isPending} onClick={handleCreate}>
          Latih Soul ID
        </Button>
      </div>

      <ul className="mt-4 flex flex-col gap-2">
        {characters.length === 0 ? (
          <li className="rounded-xl border border-dashed border-border px-3 py-4 text-center text-[11px] text-muted">
            Belum ada referensi karakter.
          </li>
        ) : null}
        {characters.map((character) => (
          <li
            key={character.id}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface-2/40 px-3 py-2.5"
          >
            {character.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={character.thumbnailUrl}
                alt={character.name}
                className="size-10 rounded-lg object-cover"
              />
            ) : (
              <span className="flex size-10 items-center justify-center rounded-lg bg-canvas-2 text-[9px] text-muted">
                ID
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-[11px] font-medium text-ink">
                {character.name}
                <span className="mono-label text-[8px] text-muted">{character.modelVersion}</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[8px] font-medium ${CHARACTER_STATUS_STYLES[character.status]}`}
                >
                  {character.status}
                </span>
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 font-mono text-[10px] text-muted">
                {character.externalId ?? "belum ada id"}
                {character.externalId ? (
                  <button
                    type="button"
                    onClick={() => copyId(character.externalId ?? "")}
                    className="rounded border border-border px-1 text-[8px] hover:text-ink"
                  >
                    Copy
                  </button>
                ) : null}
              </p>
              {character.failReason ? (
                <p className="mt-1 text-[10px] leading-relaxed text-danger">{character.failReason}</p>
              ) : null}
            </div>
            <Button
              variant="secondary"
              size="sm"
              loading={refreshCharacter.isPending && refreshCharacter.variables === character.id}
              onClick={() =>
                refreshCharacter.mutate(character.id, {
                  onError: (error) => pushToast("error", error.message),
                })
              }
            >
              Refresh status
            </Button>
          </li>
        ))}
      </ul>
    </article>
  );
}

export function ProvidersView() {
  const providersQuery = useAdminProvidersQuery();
  const createProvider = useCreateProviderMutation();
  const deleteProvider = useDeleteProviderMutation();
  const syncProvider = useSyncProviderModelsMutation();
  const testProvider = useTestProviderMutation();
  const updateProvider = useUpdateProviderMutation();
  const pushToast = useUiStore((state) => state.pushToast);

  const [editing, setEditing] = useState<AiProvider | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftBaseUrl, setDraftBaseUrl] = useState("");
  const [draftModelsPath, setDraftModelsPath] = useState("/models");
  const [draftSupportsVideo, setDraftSupportsVideo] = useState(false);
  const [draftKey, setDraftKey] = useState("");
  const [testingId, setTestingId] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AiProvider | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [draftNewName, setDraftNewName] = useState("");
  const [draftNewCode, setDraftNewCode] = useState("");
  const [draftNewBaseUrl, setDraftNewBaseUrl] = useState("");
  const [draftNewModelsPath, setDraftNewModelsPath] = useState("/models");
  const [draftNewKey, setDraftNewKey] = useState("");
  const [draftNewSupportsVideo, setDraftNewSupportsVideo] = useState(false);
  const [draftActive, setDraftActive] = useState(true);

  const providers = providersQuery.data ?? [];

  function openEdit(provider: AiProvider): void {
    setEditing(provider);
    setDraftName(provider.name);
    setDraftBaseUrl(provider.baseUrl);
    setDraftModelsPath(provider.modelsPath);
    setDraftSupportsVideo(provider.supportsVideoInput);
    setDraftKey("");
  }

  function handleSave(): void {
    if (!editing) return;
    if (draftName.trim().length < 2) {
      pushToast("error", "Nama provider minimal 2 karakter.");
      return;
    }
    const modelsPath = draftModelsPath.trim();
    if (!modelsPath.startsWith("/")) {
      pushToast("error", "Models path harus diawali /. Contoh: /models");
      return;
    }
    const apiKey = draftKey.trim();
    if (apiKey.length > 0 && apiKey.length < 6) {
      pushToast("error", "API key minimal 6 karakter.");
      return;
    }
    if (editing.kind === "HIGGSFIELD" && apiKey.length > 0 && !apiKey.includes(":")) {
      pushToast("error", "Format API key Higgsfield: key_id:key_secret.");
      return;
    }
    if (!editing.isFixed) {
      try {
        new URL(draftBaseUrl.trim());
      } catch {
        pushToast("error", "Base URL tidak valid. Contoh: https://api.provider.com/v1");
        return;
      }
    }
    updateProvider.mutate(
      {
        providerId: editing.id,
        name: draftName.trim(),
        baseUrl: editing.isFixed ? undefined : draftBaseUrl.trim(),
        modelsPath,
        supportsVideoInput: draftSupportsVideo,
        apiKey: apiKey.length > 0 ? apiKey : undefined,
      },
      {
        onSuccess: () => {
          setEditing(null);
          pushToast("success", `Provider ${draftName.trim()} diperbarui.`);
        },
        onError: (error) => pushToast("error", error.message),
      },
    );
  }

  function handleTest(provider: AiProvider): void {
    setTestingId(provider.id);
    testProvider.mutate(provider.id, {
      onSuccess: (result) => {
        pushToast(result.ok ? "success" : "error", result.message);
      },
      onError: (error) => pushToast("error", error.message),
      onSettled: () => setTestingId(null),
    });
  }

  function handleSync(provider: AiProvider): void {
    setSyncingId(provider.id);
    syncProvider.mutate(provider.id, {
      onSuccess: (result) => {
        pushToast(
          "success",
          `Model ${result.added} ditambah, ${result.updated} diperbarui.`,
        );
      },
      onError: (error) => pushToast("error", error.message),
      onSettled: () => setSyncingId(null),
    });
  }

  function handleToggle(provider: AiProvider): void {
    updateProvider.mutate(
      { providerId: provider.id, isActive: !provider.isActive },
      {
        onError: (error) => pushToast("error", error.message),
      },
    );
  }

  function handleDelete(): void {
    if (!deleteTarget) return;
    const name = deleteTarget.name;
    deleteProvider.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null);
        pushToast("success", `Provider ${name} dihapus.`);
      },
      onError: (error) => pushToast("error", error.message),
    });
  }

  function openCreate(): void {
    setDraftNewName("");
    setDraftNewCode("");
    setDraftNewBaseUrl("");
    setDraftNewModelsPath("/models");
    setDraftNewKey("");
    setDraftNewSupportsVideo(false);
    setDraftActive(true);
    setCreateOpen(true);
  }

  function handleCreate(): void {
    if (draftNewName.trim().length < 2) {
      pushToast("error", "Nama provider minimal 2 karakter.");
      return;
    }
    if (draftNewCode.trim().length < 2) {
      pushToast("error", "Kode provider minimal 2 karakter.");
      return;
    }
    try {
      new URL(draftNewBaseUrl.trim());
    } catch {
      pushToast("error", "Base URL tidak valid. Contoh: https://api.provider.com/v1");
      return;
    }
    const modelsPath = draftNewModelsPath.trim();
    if (!modelsPath.startsWith("/")) {
      pushToast("error", "Models path harus diawali /. Contoh: /models");
      return;
    }
    if (draftNewKey.trim().length < 6) {
      pushToast("error", "API key minimal 6 karakter.");
      return;
    }

    createProvider.mutate(
      {
        name: draftNewName.trim(),
        code: draftNewCode.trim(),
        baseUrl: draftNewBaseUrl.trim(),
        modelsPath,
        apiKey: draftNewKey.trim(),
        supportsVideoInput: draftNewSupportsVideo,
        isActive: draftActive,
      },
      {
        onSuccess: (provider) => {
          setCreateOpen(false);
          pushToast("success", `Provider ${provider.name} ditambahkan.`);
        },
        onError: (error) => pushToast("error", error.message),
      },
    );
  }

  if (providersQuery.isPending) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <span className="size-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="mono-label text-accent-strong">Integrasi</span>
          <h1 className="display mt-2 text-[clamp(2.2rem,4vw,3.4rem)] text-ink">Providers</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            Kelola provider model OpenAI-compatible dan Higgsfield. Sync katalog model langsung
            dari provider, lalu atur tarifnya di menu Models.
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
            Server menyimpan key terenkripsi AES-256-GCM dan hanya mengirim nilai tersamarkan.
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
                  <h2 className="flex items-center gap-2 text-base font-semibold tracking-[-0.02em] text-ink">
                    {provider.name}
                    <span className="rounded-full bg-canvas-2 px-2 py-0.5 text-[9px] font-medium text-ink/70">
                      {KIND_LABELS[provider.kind]}
                    </span>
                    {provider.isFixed ? (
                      <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[9px] font-medium text-accent-strong">
                        Tetap
                      </span>
                    ) : null}
                  </h2>
                  <p className="mono-label text-[9px] text-muted">{provider.code}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleToggle(provider)}
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
                <p className="mt-0.5 font-mono text-[11px] text-ink">
                  {provider.apiKeyMasked || "Belum diatur"}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="mono-label text-[8px] text-muted">Models path</p>
                  <p className="mt-0.5 truncate font-mono text-[11px] text-ink">
                    {provider.modelsPath}
                  </p>
                </div>
                <div>
                  <p className="mono-label text-[8px] text-muted">Video input</p>
                  <p className="mt-0.5 text-[11px] text-ink">
                    {provider.supportsVideoInput ? "Didukung" : "Tidak didukung"}
                  </p>
                </div>
              </div>
              <div>
                <p className="mono-label text-[8px] text-muted">Sync terakhir</p>
                <p className="mt-0.5 text-[11px] text-ink">
                  {provider.lastSyncedAt
                    ? formatDateTime(provider.lastSyncedAt)
                    : "Belum pernah sync"}
                </p>
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

            {provider.syncError ? (
              <p className="mt-3 rounded-xl border border-danger/25 bg-danger/10 px-3 py-2 text-[10px] leading-relaxed text-danger">
                Sync gagal: {provider.syncError}
              </p>
            ) : null}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                loading={syncingId === provider.id}
                icon={
                  syncingId === provider.id ? (
                    <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  ) : (
                    <RefreshCw className="size-3.5" aria-hidden />
                  )
                }
                onClick={() => handleSync(provider)}
              >
                Sync model
              </Button>
              <Button
                variant="secondary"
                size="sm"
                loading={testingId === provider.id}
                icon={
                  testingId === provider.id ? (
                    <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  ) : (
                    <ShieldCheck className="size-3.5" aria-hidden />
                  )
                }
                onClick={() => handleTest(provider)}
              >
                Test koneksi
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={<Pencil className="size-3.5" aria-hidden />}
                onClick={() => openEdit(provider)}
              >
                Edit
              </Button>
              {provider.isFixed ? null : (
                <Button
                  variant="danger"
                  size="sm"
                  icon={<Trash2 className="size-3.5" aria-hidden />}
                  onClick={() => setDeleteTarget(provider)}
                >
                  Hapus
                </Button>
              )}
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
        {providers.some((provider) => provider.code === "HIGGSFIELD") ? <SoulIdTuningCard /> : null}
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-2xl border border-border bg-white/60 px-4 py-3 text-[11px] leading-relaxed text-muted">
        <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden />
        <p>
          Provider OpenAI-compatible dipakai untuk model plan, analisis lampiran, dan render gambar.
          Higgsfield adalah provider tetap untuk render video. Sync model tidak mengubah tarif token
          yang sudah diatur operator.
        </p>
      </div>

      <Dialog
        open={Boolean(editing)}
        title={`Edit ${editing?.name ?? "provider"}`}
        description="Perbarui koneksi provider. Biarkan API key kosong untuk mempertahankan key tersimpan."
        onClose={() => setEditing(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Batal
            </Button>
            <Button variant="primary" loading={updateProvider.isPending} onClick={handleSave}>
              Simpan perubahan
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="Nama provider" htmlFor="provider-name-edit">
            <TextInput
              id="provider-name-edit"
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              placeholder="Contoh: OpenAI"
              autoFocus
            />
          </Field>
          <Field
            label="Kode provider"
            htmlFor="provider-code-edit"
            hint="Kode provider tidak dapat diubah setelah dibuat."
          >
            <TextInput id="provider-code-edit" value={editing?.code ?? ""} disabled readOnly />
          </Field>
          <Field
            label="Base URL"
            htmlFor="provider-base-url-edit"
            hint={
              editing?.isFixed
                ? "Provider tetap dikelola sistem, base URL tidak dapat diubah."
                : undefined
            }
          >
            <TextInput
              id="provider-base-url-edit"
              type="url"
              value={draftBaseUrl}
              disabled={editing?.isFixed ?? false}
              onChange={(event) => setDraftBaseUrl(event.target.value)}
              placeholder="https://api.provider.com/v1"
            />
          </Field>
          <Field label="Models path" htmlFor="provider-models-path-edit">
            <TextInput
              id="provider-models-path-edit"
              value={draftModelsPath}
              onChange={(event) => setDraftModelsPath(event.target.value)}
              placeholder="/models"
            />
          </Field>
          <Field
            label="API key"
            htmlFor="provider-key"
            hint={
              editing?.kind === "HIGGSFIELD"
                ? "Format Higgsfield: key_id:key_secret. Minimal 6 karakter."
                : "Minimal 6 karakter."
            }
          >
            <TextInput
              id="provider-key"
              type="password"
              autoComplete="off"
              value={draftKey}
              onChange={(event) => setDraftKey(event.target.value)}
              placeholder="Tempel API key provider"
            />
          </Field>
          <p className="rounded-xl border border-border bg-surface-2/60 px-3 py-2 text-[11px] leading-relaxed text-muted">
            Key saat ini:{" "}
            <span className="font-mono text-ink">{editing?.apiKeyMasked || "Belum diatur"}</span>
          </p>
          <label className="flex items-start gap-3 rounded-xl border border-border bg-surface-2/60 px-3 py-3">
            <input
              type="checkbox"
              checked={draftSupportsVideo}
              onChange={(event) => setDraftSupportsVideo(event.target.checked)}
              className="mt-0.5 size-4 accent-[#d93e14]"
            />
            <span>
              <span className="block text-xs font-medium text-ink">Mendukung input video</span>
              <span className="mt-0.5 block text-[10px] leading-relaxed text-muted">
                Aktifkan bila model provider ini bisa menerima lampiran video.
              </span>
            </span>
          </label>
        </div>
      </Dialog>

      <Dialog
        open={createOpen}
        title="Tambah provider"
        description="Provider OpenAI-compatible baru. Provider Higgsfield dikelola sistem."
        onClose={() => setCreateOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" loading={createProvider.isPending} onClick={handleCreate}>
              Tambah provider
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="Nama provider" htmlFor="provider-name">
            <TextInput
              id="provider-name"
              value={draftNewName}
              onChange={(event) => setDraftNewName(event.target.value)}
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
              value={draftNewCode}
              onChange={(event) =>
                setDraftNewCode(event.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_"))
              }
              placeholder="OPENAI"
            />
          </Field>
          <Field label="Base URL" htmlFor="provider-base-url">
            <TextInput
              id="provider-base-url"
              type="url"
              value={draftNewBaseUrl}
              onChange={(event) => setDraftNewBaseUrl(event.target.value)}
              placeholder="https://api.provider.com/v1"
            />
          </Field>
          <Field
            label="Models path"
            htmlFor="provider-models-path"
            hint="Path katalog model pada base URL. Default /models."
          >
            <TextInput
              id="provider-models-path"
              value={draftNewModelsPath}
              onChange={(event) => setDraftNewModelsPath(event.target.value)}
              placeholder="/models"
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
              checked={draftNewSupportsVideo}
              onChange={(event) => setDraftNewSupportsVideo(event.target.checked)}
              className="mt-0.5 size-4 accent-[#d93e14]"
            />
            <span>
              <span className="block text-xs font-medium text-ink">Mendukung input video</span>
              <span className="mt-0.5 block text-[10px] leading-relaxed text-muted">
                Aktifkan bila provider bisa menerima lampiran video pada model vision.
              </span>
            </span>
          </label>
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

      <Dialog
        open={Boolean(deleteTarget)}
        title={`Hapus ${deleteTarget?.name ?? "provider"}`}
        description="Provider dan seluruh modelnya akan dihapus. Tindakan ini tidak dapat dibatalkan."
        onClose={() => setDeleteTarget(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Batal
            </Button>
            <Button variant="danger" loading={deleteProvider.isPending} onClick={handleDelete}>
              Hapus provider
            </Button>
          </>
        }
      >
        <p className="text-xs leading-relaxed text-muted">
          Provider yang modelnya punya riwayat render tidak dapat dihapus. Nonaktifkan provider bila
          ingin menyimpan riwayat tetap utuh.
        </p>
      </Dialog>
    </div>
  );
}
