"use client";

import { Film, Image as ImageIcon, Pencil, Plus, Settings2, Sparkles } from "lucide-react";
import { useState } from "react";

import {
  useAdminModelTemplatesQuery,
  useAdminModelsQuery,
  useAdminProvidersQuery,
  useCreateModelMutation,
  useUpdateModelMutation,
} from "@rupakarsa/shared/hooks/use-admin";
import { formatTokens } from "@rupakarsa/shared/lib/format";
import type { AiModel, MediaType, ModelTemplate } from "@rupakarsa/shared/lib/types";
import { useUiStore } from "@rupakarsa/shared/stores/ui-store";
import { Button, Dialog, Field, Select, TextInput } from "@rupakarsa/shared/ui";

const CUSTOM_TEMPLATE = "__custom__";

function parseNumbers(value: string): number[] {
  return value
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item) && item > 0);
}

function parseStrings(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function ModelsView() {
  const modelsQuery = useAdminModelsQuery();
  const providersQuery = useAdminProvidersQuery();
  const createModel = useCreateModelMutation();
  const updateModel = useUpdateModelMutation();
  const pushToast = useUiStore((state) => state.pushToast);

  const [editing, setEditing] = useState<AiModel | null>(null);
  const [draftCost, setDraftCost] = useState("");
  const [draftDurations, setDraftDurations] = useState("");
  const [draftResolutions, setDraftResolutions] = useState("");
  const [draftAspectRatios, setDraftAspectRatios] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [draftProviderId, setDraftProviderId] = useState("");
  const [draftTemplateCode, setDraftTemplateCode] = useState(CUSTOM_TEMPLATE);
  const [draftName, setDraftName] = useState("");
  const [draftCode, setDraftCode] = useState("");
  const [draftMediaType, setDraftMediaType] = useState<MediaType>("VIDEO");
  const [draftNewCost, setDraftNewCost] = useState("0");
  const [draftNewDurations, setDraftNewDurations] = useState("");
  const [draftNewResolutions, setDraftNewResolutions] = useState("");
  const [draftNewAspectRatios, setDraftNewAspectRatios] = useState("");
  const [draftActive, setDraftActive] = useState(true);

  const models = modelsQuery.data ?? [];
  const providers = providersQuery.data ?? [];
  const selectedProvider = providers.find((provider) => provider.id === draftProviderId) ?? null;
  const templatesQuery = useAdminModelTemplatesQuery(selectedProvider?.code ?? "");
  const templates = templatesQuery.data ?? [];

  const activeCount = models.filter((model) => model.isActive).length;
  const videoCount = models.filter((model) => model.mediaType === "VIDEO").length;
  const imageCount = models.filter((model) => model.mediaType === "IMAGE").length;

  function providerName(providerId: string): string {
    return providers.find((provider) => provider.id === providerId)?.name ?? "—";
  }

  function openEdit(model: AiModel): void {
    setEditing(model);
    setDraftCost(String(model.tokenCost));
    setDraftDurations((model.allowedParams.durations ?? []).join(", "));
    setDraftResolutions(model.allowedParams.resolutions.join(", "));
    setDraftAspectRatios(model.allowedParams.aspectRatios.join(", "));
  }

  function handleSave(): void {
    if (!editing) return;
    const cost = Number(draftCost);
    if (!Number.isFinite(cost) || cost < 0) {
      pushToast("error", "Tarif token harus angka 0 atau lebih.");
      return;
    }
    const resolutions = parseStrings(draftResolutions);
    const aspectRatios = parseStrings(draftAspectRatios);
    if (resolutions.length === 0 || aspectRatios.length === 0) {
      pushToast("error", "Resolusi dan rasio aspek tidak boleh kosong.");
      return;
    }
    updateModel.mutate(
      {
        modelId: editing.id,
        tokenCost: Math.round(cost),
        allowedParams: {
          durations: editing.mediaType === "VIDEO" ? parseNumbers(draftDurations) : undefined,
          resolutions,
          aspectRatios,
        },
      },
      {
        onSuccess: () => {
          setEditing(null);
          pushToast("success", `Tarif ${editing.displayName} diperbarui.`);
        },
        onError: (error) => pushToast("error", error.message),
      },
    );
  }

  function applyTemplate(template: ModelTemplate | null): void {
    if (!template) {
      setDraftTemplateCode(CUSTOM_TEMPLATE);
      setDraftName("");
      setDraftCode("");
      setDraftMediaType("VIDEO");
      setDraftNewCost("0");
      setDraftNewDurations("");
      setDraftNewResolutions("");
      setDraftNewAspectRatios("");
      return;
    }
    setDraftTemplateCode(template.code);
    setDraftName(template.displayName);
    setDraftCode(template.code);
    setDraftMediaType(template.mediaType);
    setDraftNewCost(String(template.tokenCost));
    setDraftNewDurations((template.allowedParams.durations ?? []).join(", "));
    setDraftNewResolutions(template.allowedParams.resolutions.join(", "));
    setDraftNewAspectRatios(template.allowedParams.aspectRatios.join(", "));
  }

  function openCreate(): void {
    if (providers.length === 0) {
      pushToast("error", "Tambahkan provider terlebih dahulu.");
      return;
    }
    const first = providers[0];
    if (!first) return;

    setDraftProviderId(first.id);
    applyTemplate(null);
    setDraftActive(true);
    setCreateOpen(true);
  }

  function handleProviderChange(providerId: string): void {
    setDraftProviderId(providerId);
    applyTemplate(null);
  }

  function handleTemplateChange(code: string): void {
    if (code === CUSTOM_TEMPLATE) {
      applyTemplate(null);
      return;
    }
    applyTemplate(templates.find((template) => template.code === code) ?? null);
  }

  function handleCreate(): void {
    if (!draftProviderId) {
      pushToast("error", "Pilih provider terlebih dahulu.");
      return;
    }
    if (draftName.trim().length < 2) {
      pushToast("error", "Nama model minimal 2 karakter.");
      return;
    }
    if (draftCode.trim().length < 2) {
      pushToast("error", "Kode model minimal 2 karakter.");
      return;
    }
    const cost = Number(draftNewCost);
    if (!Number.isFinite(cost) || cost < 0) {
      pushToast("error", "Tarif token harus angka 0 atau lebih.");
      return;
    }
    const resolutions = parseStrings(draftNewResolutions);
    const aspectRatios = parseStrings(draftNewAspectRatios);
    if (resolutions.length === 0 || aspectRatios.length === 0) {
      pushToast("error", "Resolusi dan rasio aspek tidak boleh kosong.");
      return;
    }
    const durations = draftMediaType === "VIDEO" ? parseNumbers(draftNewDurations) : undefined;
    if (draftMediaType === "VIDEO" && (!durations || durations.length === 0)) {
      pushToast("error", "Model video membutuhkan minimal satu durasi.");
      return;
    }

    createModel.mutate(
      {
        providerId: draftProviderId,
        code: draftCode.trim(),
        displayName: draftName.trim(),
        mediaType: draftMediaType,
        allowedParams: { durations, resolutions, aspectRatios },
        tokenCost: Math.round(cost),
        isActive: draftActive,
      },
      {
        onSuccess: (model) => {
          setCreateOpen(false);
          pushToast("success", `Model ${model.displayName} ditambahkan.`);
        },
        onError: (error) => pushToast("error", error.message),
      },
    );
  }

  function handleToggle(model: AiModel): void {
    updateModel.mutate(
      { modelId: model.id, isActive: !model.isActive },
      { onError: (error) => pushToast("error", error.message) },
    );
  }

  if (modelsQuery.isPending || providersQuery.isPending) {
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
          <span className="mono-label text-accent-strong">Katalog &amp; tarif</span>
          <h1 className="display mt-2 text-[clamp(2.2rem,4vw,3.4rem)] text-ink">
            Models &amp; tarif
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            Aktivasi model dan atur tarif token. Tambah model sesuai katalog provider.
          </p>
        </div>
        <Button
          variant="primary"
          size="lg"
          icon={<Plus className="size-4" aria-hidden />}
          onClick={openCreate}
        >
          Tambah model
        </Button>
      </header>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          { label: "Model aktif", value: activeCount, icon: Sparkles },
          { label: "Model video", value: videoCount, icon: Film },
          { label: "Model gambar", value: imageCount, icon: ImageIcon },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="flex items-center gap-3 rounded-2xl border border-border bg-white/70 px-4 py-3.5"
            >
              <span className="flex size-9 items-center justify-center rounded-xl bg-canvas-2 text-ink">
                <Icon className="size-4" aria-hidden />
              </span>
              <div>
                <p className="text-lg font-semibold tracking-[-0.03em] text-ink">{item.value}</p>
                <p className="text-[10px] text-muted">{item.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 overflow-hidden rounded-[1.75rem] border border-border bg-white">
        <div className="hidden grid-cols-[1.5fr_0.6fr_0.6fr_1.4fr_0.5fr_auto] gap-3 border-b border-border px-5 py-3 text-[10px] uppercase tracking-[0.14em] text-muted lg:grid">
          <span>Model</span>
          <span>Tipe</span>
          <span>Tarif</span>
          <span>Parameter</span>
          <span>Status</span>
          <span />
        </div>

        {models.map((model) => (
          <div
            key={model.id}
            className="grid gap-3 border-b border-border/60 px-5 py-4 last:border-b-0 lg:grid-cols-[1.5fr_0.6fr_0.6fr_1.4fr_0.5fr_auto] lg:items-center"
          >
            <div>
              <p className="text-sm font-medium text-ink">{model.displayName}</p>
              <p className="font-mono text-[10px] text-muted">{model.code}</p>
              <p className="text-[9px] text-muted/70">{providerName(model.providerId)}</p>
            </div>
            <span
              className={`inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ${
                model.mediaType === "VIDEO"
                  ? "bg-accent-soft text-accent-strong"
                  : "bg-accent-2-soft text-accent-2"
              }`}
            >
              {model.mediaType === "VIDEO" ? (
                <Film className="size-3" aria-hidden />
              ) : (
                <ImageIcon className="size-3" aria-hidden />
              )}
              {model.mediaType}
            </span>
            <p className="text-sm font-semibold text-ink">{formatTokens(model.tokenCost)}</p>
            <div className="text-[10px] leading-relaxed text-muted">
              <p>
                Durasi:{" "}
                <span className="text-ink">
                  {model.allowedParams.durations?.map((item) => `${item}s`).join(", ") ?? "—"}
                </span>
              </p>
              <p>
                Resolusi: <span className="text-ink">{model.allowedParams.resolutions.join(", ")}</span>
              </p>
              <p>
                Rasio: <span className="text-ink">{model.allowedParams.aspectRatios.join(", ")}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle(model)}
              aria-pressed={model.isActive}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                model.isActive ? "bg-success" : "bg-ink/15"
              }`}
              aria-label={`${model.isActive ? "Nonaktifkan" : "Aktifkan"} ${model.displayName}`}
            >
              <span
                className={`absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform ${
                  model.isActive ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
            <Button
              variant="ghost"
              size="sm"
              icon={<Pencil className="size-3.5" aria-hidden />}
              onClick={() => openEdit(model)}
            >
              Edit
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-2xl border border-border bg-white/60 px-4 py-3 text-[11px] leading-relaxed text-muted">
        <Settings2 className="mt-0.5 size-3.5 shrink-0 text-accent" aria-hidden />
        <p>
          Tarif token langsung dipakai kalkulator di Creator. Plan Mode gratis 250× per top-up,
          setelah itu 1 token per plan atau reprompt.
        </p>
      </div>

      <Dialog
        open={Boolean(editing)}
        title={`Edit ${editing?.displayName ?? "model"}`}
        description="Atur tarif token dan parameter yang diizinkan untuk model ini."
        onClose={() => setEditing(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Batal
            </Button>
            <Button variant="primary" loading={updateModel.isPending} onClick={handleSave}>
              Simpan perubahan
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="Tarif token per render" htmlFor="model-cost">
            <TextInput
              id="model-cost"
              type="number"
              min={0}
              value={draftCost}
              onChange={(event) => setDraftCost(event.target.value)}
            />
          </Field>
          {editing?.mediaType === "VIDEO" ? (
            <Field
              label="Durasi (detik)"
              htmlFor="model-durations"
              hint="Pisahkan dengan koma, contoh: 5, 10."
            >
              <TextInput
                id="model-durations"
                value={draftDurations}
                onChange={(event) => setDraftDurations(event.target.value)}
              />
            </Field>
          ) : null}
          <Field
            label="Resolusi"
            htmlFor="model-resolutions"
            hint="Pisahkan dengan koma, contoh: 720p, 1080p."
          >
            <TextInput
              id="model-resolutions"
              value={draftResolutions}
              onChange={(event) => setDraftResolutions(event.target.value)}
            />
          </Field>
          <Field
            label="Rasio aspek"
            htmlFor="model-aspects"
            hint="Pisahkan dengan koma, contoh: 16:9, 9:16, 1:1."
          >
            <TextInput
              id="model-aspects"
              value={draftAspectRatios}
              onChange={(event) => setDraftAspectRatios(event.target.value)}
            />
          </Field>
        </div>
      </Dialog>

      <Dialog
        open={createOpen}
        title="Tambah model"
        description="Pilih provider, lalu pilih model yang tersedia atau isi kustom."
        onClose={() => setCreateOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" loading={createModel.isPending} onClick={handleCreate}>
              Tambah model
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="Provider" htmlFor="model-provider">
            <Select
              id="model-provider"
              value={draftProviderId}
              onChange={handleProviderChange}
              options={providers.map((provider) => ({
                value: provider.id,
                label: `${provider.name} · ${provider.code}`,
              }))}
            />
          </Field>

          <Field
            label="Model tersedia"
            htmlFor="model-template"
            hint={
              templatesQuery.isPending
                ? "Memuat template provider…"
                : templates.length === 0
                  ? "Provider ini belum punya template model media. Isi kustom di bawah."
                  : "Pilih template untuk mengisi otomatis, atau Kustom."
            }
          >
            <Select
              id="model-template"
              value={draftTemplateCode}
              onChange={handleTemplateChange}
              options={[
                { value: CUSTOM_TEMPLATE, label: "Kustom" },
                ...templates.map((template) => ({
                  value: template.code,
                  label: `${template.displayName} · ${template.code}`,
                })),
              ]}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nama tampilan" htmlFor="model-name">
              <TextInput
                id="model-name"
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                placeholder="Contoh: Wan Qwen 10s"
              />
            </Field>
            <Field label="Kode model" htmlFor="model-code">
              <TextInput
                id="model-code"
                value={draftCode}
                onChange={(event) =>
                  setDraftCode(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))
                }
                placeholder="wan-qwen-10s"
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tipe media" htmlFor="model-media">
              <Select
                id="model-media"
                value={draftMediaType}
                onChange={(value) => setDraftMediaType(value as MediaType)}
                options={[
                  { value: "VIDEO", label: "VIDEO" },
                  { value: "IMAGE", label: "IMAGE" },
                ]}
              />
            </Field>
            <Field label="Tarif token" htmlFor="model-new-cost">
              <TextInput
                id="model-new-cost"
                type="number"
                min={0}
                value={draftNewCost}
                onChange={(event) => setDraftNewCost(event.target.value)}
              />
            </Field>
          </div>

          {draftMediaType === "VIDEO" ? (
            <Field
              label="Durasi (detik)"
              htmlFor="model-new-durations"
              hint="Pisahkan dengan koma, contoh: 5, 10."
            >
              <TextInput
                id="model-new-durations"
                value={draftNewDurations}
                onChange={(event) => setDraftNewDurations(event.target.value)}
              />
            </Field>
          ) : null}

          <Field
            label="Resolusi"
            htmlFor="model-new-resolutions"
            hint="Pisahkan dengan koma, contoh: 720p, 1080p."
          >
            <TextInput
              id="model-new-resolutions"
              value={draftNewResolutions}
              onChange={(event) => setDraftNewResolutions(event.target.value)}
            />
          </Field>

          <Field
            label="Rasio aspek"
            htmlFor="model-new-aspects"
            hint="Pisahkan dengan koma, contoh: 16:9, 9:16, 1:1."
          >
            <TextInput
              id="model-new-aspects"
              value={draftNewAspectRatios}
              onChange={(event) => setDraftNewAspectRatios(event.target.value)}
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
              <span className="block text-xs font-medium text-ink">Aktifkan model</span>
              <span className="mt-0.5 block text-[10px] leading-relaxed text-muted">
                Model aktif muncul di katalog Creator.
              </span>
            </span>
          </label>
        </div>
      </Dialog>
    </div>
  );
}
