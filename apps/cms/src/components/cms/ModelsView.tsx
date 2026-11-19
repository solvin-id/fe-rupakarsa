"use client";

import { Film, Image as ImageIcon, Pencil, Plus, Settings2, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  useAdminCharactersQuery,
  useAdminModelsFilteredQuery,
  useAdminModelTemplatesQuery,
  useAdminProvidersQuery,
  useCreateModelMutation,
  useUpdateModelMutation,
} from "@rupakarsa/shared/hooks/use-admin";
import { formatTokens } from "@rupakarsa/shared/lib/format";
import type {
  AiModel,
  MediaCapability,
  ModelMediaType,
  ModelTemplate,
} from "@rupakarsa/shared/lib/types";
import { useUiStore } from "@rupakarsa/shared/stores/ui-store";
import { Button, Dialog, Field, Select, TextInput } from "@rupakarsa/shared/ui";

const CUSTOM_TEMPLATE = "__custom__";
const CAPABILITIES: MediaCapability[] = ["TEXT", "IMAGE", "VIDEO"];

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

/**
 * Blank keeps the workspace default (null). Zero is rejected by the API and means "unset" on old
 * rows, so it is reported as an unusable value here instead of silently compressing prompts to "".
 */
function parsePromptLimit(value: string): number | null | undefined {
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 32000) return undefined;
  return parsed;
}

/** Only SOUL models take a trained character as `custom_reference_id`. */
const SOUL_MODEL_CODES = ["soul-v2", "soul-standard"];

function toggleCapability(
  list: MediaCapability[],
  capability: MediaCapability,
): MediaCapability[] {
  return list.includes(capability)
    ? list.filter((item) => item !== capability)
    : [...list, capability];
}

function CapabilityChips({ capabilities }: { capabilities: MediaCapability[] }) {
  if (capabilities.length === 0) {
    return <span className="text-[10px] text-muted">—</span>;
  }
  return (
    <span className="flex flex-wrap gap-1">
      {capabilities.map((capability) => (
        <span
          key={capability}
          className="rounded-full bg-canvas-2 px-1.5 py-0.5 text-[9px] font-medium text-ink/70"
        >
          {capability}
        </span>
      ))}
    </span>
  );
}

function CapabilityPicker({
  label,
  value,
  onToggle,
}: {
  label: string;
  value: MediaCapability[];
  onToggle: (capability: MediaCapability) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="mono-label text-muted">{label}</span>
      <div className="flex flex-wrap gap-2">
        {CAPABILITIES.map((capability) => {
          const checked = value.includes(capability);
          return (
            <label
              key={capability}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-2.5 py-1.5 text-[11px] transition-colors ${
                checked
                  ? "border-accent/40 bg-accent-soft text-accent-strong"
                  : "border-border bg-white text-muted"
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(capability)}
                className="size-3.5 accent-[#d93e14]"
              />
              {capability}
            </label>
          );
        })}
      </div>
    </div>
  );
}

export function ModelsView() {
  const allModelsQuery = useAdminModelsFilteredQuery({});
  const providersQuery = useAdminProvidersQuery();
  const charactersQuery = useAdminCharactersQuery();
  const createModel = useCreateModelMutation();
  const updateModel = useUpdateModelMutation();
  const updateModelFull = updateModel;
  const pushToast = useUiStore((state) => state.pushToast);

  const [filterProviderId, setFilterProviderId] = useState("");
  const [filterInput, setFilterInput] = useState("");
  const [filterOutput, setFilterOutput] = useState("");
  const [filterQuery, setFilterQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [onlyActive, setOnlyActive] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(filterQuery.trim()), 300);
    return () => clearTimeout(timer);
  }, [filterQuery]);

  const filters = useMemo(
    () => ({
      ...(filterProviderId ? { providerId: filterProviderId } : {}),
      ...(filterInput ? { input: filterInput as MediaCapability } : {}),
      ...(filterOutput ? { output: filterOutput as MediaCapability } : {}),
      ...(debouncedQuery ? { q: debouncedQuery } : {}),
      ...(onlyActive ? { active: true } : {}),
    }),
    [debouncedQuery, filterInput, filterOutput, filterProviderId, onlyActive],
  );

  const modelsQuery = useAdminModelsFilteredQuery(filters);

  const [editing, setEditing] = useState<AiModel | null>(null);
  const [draftDisplayName, setDraftDisplayName] = useState("");
  const [draftCost, setDraftCost] = useState("");
  const [draftMaxPrompt, setDraftMaxPrompt] = useState("");
  const [draftDurations, setDraftDurations] = useState("");
  const [draftResolutions, setDraftResolutions] = useState("");
  const [draftAspectRatios, setDraftAspectRatios] = useState("");
  const [draftInputCaps, setDraftInputCaps] = useState<MediaCapability[]>(["TEXT"]);
  const [draftOutputCaps, setDraftOutputCaps] = useState<MediaCapability[]>(["VIDEO"]);
  const [draftThinking, setDraftThinking] = useState(false);
  const [draftReference, setDraftReference] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [draftProviderId, setDraftProviderId] = useState("");
  const [draftTemplateCode, setDraftTemplateCode] = useState(CUSTOM_TEMPLATE);
  const [draftName, setDraftName] = useState("");
  const [draftCode, setDraftCode] = useState("");
  const [draftMediaType, setDraftMediaType] = useState<ModelMediaType>("VIDEO");
  const [draftNewCost, setDraftNewCost] = useState("0");
  const [draftNewMaxPrompt, setDraftNewMaxPrompt] = useState("");
  const [draftNewDurations, setDraftNewDurations] = useState("");
  const [draftNewResolutions, setDraftNewResolutions] = useState("");
  const [draftNewAspectRatios, setDraftNewAspectRatios] = useState("");
  const [draftNewInputCaps, setDraftNewInputCaps] = useState<MediaCapability[]>(["TEXT"]);
  const [draftNewOutputCaps, setDraftNewOutputCaps] = useState<MediaCapability[]>(["VIDEO"]);
  const [draftNewThinking, setDraftNewThinking] = useState(false);
  const [draftNewReference, setDraftNewReference] = useState("");
  const [draftActive, setDraftActive] = useState(true);

  const models = modelsQuery.data ?? [];
  const allModels = allModelsQuery.data ?? [];
  const providers = providersQuery.data ?? [];
  const completedCharacters = (charactersQuery.data ?? []).filter(
    (character) => character.status === "COMPLETED" && character.externalId !== null,
  );
  const selectedProvider = providers.find((provider) => provider.id === draftProviderId) ?? null;
  const templatesQuery = useAdminModelTemplatesQuery(selectedProvider?.code ?? "");
  const templates = templatesQuery.data ?? [];

  const activeCount = allModels.filter((model) => model.isActive).length;
  const videoCount = allModels.filter((model) => model.mediaType === "VIDEO").length;
  const imageCount = allModels.filter((model) => model.mediaType === "IMAGE").length;

  function providerName(providerId: string): string {
    return providers.find((provider) => provider.id === providerId)?.name ?? "—";
  }

  function openEdit(model: AiModel): void {
    setEditing(model);
    setDraftDisplayName(model.displayName);
    setDraftCost(String(model.tokenCost));
    setDraftMaxPrompt(model.maxPromptChars === null ? "" : String(model.maxPromptChars));
    setDraftDurations((model.allowedParams.durations ?? []).join(", "));
    setDraftResolutions(model.allowedParams.resolutions.join(", "));
    setDraftAspectRatios(model.allowedParams.aspectRatios.join(", "));
    setDraftInputCaps([...model.inputCapabilities]);
    setDraftOutputCaps([...model.outputCapabilities]);
    setDraftThinking(model.thinkingEnabled);
    setDraftReference(model.customReferenceId ?? "");
  }

  function handleSave(): void {
    if (!editing) return;
    if (draftDisplayName.trim().length < 2) {
      pushToast("error", "Nama model minimal 2 karakter.");
      return;
    }
    const cost = Number(draftCost);
    if (!Number.isFinite(cost) || cost < 0) {
      pushToast("error", "Tarif token harus angka 0 atau lebih.");
      return;
    }
    const isText = editing.mediaType === "TEXT";
    const resolutions = isText ? [] : parseStrings(draftResolutions);
    const aspectRatios = isText ? [] : parseStrings(draftAspectRatios);
    if (!isText && (resolutions.length === 0 || aspectRatios.length === 0)) {
      pushToast("error", "Resolusi dan rasio aspek tidak boleh kosong.");
      return;
    }
    if (draftOutputCaps.length === 0) {
      pushToast("error", "Kapabilitas output wajib diisi.");
      return;
    }
    const maxPromptChars = parsePromptLimit(draftMaxPrompt);
    if (maxPromptChars === undefined) {
      pushToast("error", "Batas karakter prompt harus 1–32000 atau dikosongkan.");
      return;
    }
    updateModelFull.mutate(
      {
        modelId: editing.id,
        displayName: draftDisplayName.trim(),
        tokenCost: Math.round(cost),
        maxPromptChars,
        allowedParams: {
          durations: editing.mediaType === "VIDEO" ? parseNumbers(draftDurations) : undefined,
          resolutions,
          aspectRatios,
        },
        inputCapabilities: draftInputCaps,
        outputCapabilities: draftOutputCaps,
        thinkingEnabled: draftThinking,
        customReferenceId: draftReference.length > 0 ? draftReference : null,
      },
      {
        onSuccess: () => {
          setEditing(null);
          pushToast("success", `Model ${draftDisplayName.trim()} diperbarui.`);
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
      setDraftNewMaxPrompt("");
      setDraftNewDurations("");
      setDraftNewResolutions("");
      setDraftNewAspectRatios("");
      setDraftNewInputCaps(["TEXT"]);
      setDraftNewOutputCaps(["VIDEO"]);
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
    setDraftNewInputCaps(["TEXT", "IMAGE"]);
    setDraftNewOutputCaps([template.mediaType]);
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

  function handleMediaTypeChange(value: ModelMediaType): void {
    setDraftMediaType(value);
    setDraftNewOutputCaps([value]);
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
    // Plan/analysis models render nothing, so they carry no resolution or aspect ratio.
    const isText = draftMediaType === "TEXT";
    const resolutions = isText ? [] : parseStrings(draftNewResolutions);
    const aspectRatios = isText ? [] : parseStrings(draftNewAspectRatios);
    if (!isText && (resolutions.length === 0 || aspectRatios.length === 0)) {
      pushToast("error", "Resolusi dan rasio aspek tidak boleh kosong.");
      return;
    }
    if (draftNewOutputCaps.length === 0) {
      pushToast("error", "Kapabilitas output wajib diisi.");
      return;
    }
    const durations = draftMediaType === "VIDEO" ? parseNumbers(draftNewDurations) : undefined;
    if (draftMediaType === "VIDEO" && (!durations || durations.length === 0)) {
      pushToast("error", "Model video membutuhkan minimal satu durasi.");
      return;
    }
    const maxPromptChars = parsePromptLimit(draftNewMaxPrompt);
    if (maxPromptChars === undefined) {
      pushToast("error", "Batas karakter prompt harus 1–32000 atau dikosongkan.");
      return;
    }

    createModel.mutate(
      {
        providerId: draftProviderId,
        code: draftCode.trim(),
        displayName: draftName.trim(),
        mediaType: draftMediaType,
        inputCapabilities: draftNewInputCaps,
        outputCapabilities: draftNewOutputCaps,
        allowedParams: { durations, resolutions, aspectRatios },
        tokenCost: Math.round(cost),
        maxPromptChars,
        thinkingEnabled: draftNewThinking,
        customReferenceId: draftNewReference.length > 0 ? draftNewReference : null,
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

  if (modelsQuery.isPending || allModelsQuery.isPending || providersQuery.isPending) {
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
            Aktivasi model dan atur tarif token. Filter berdasarkan provider dan kapabilitas input
            atau output.
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

      <div className="mt-4 rounded-[1.75rem] border border-border bg-white p-4">
        <div className="grid gap-3 lg:grid-cols-4">
          <Select
            aria-label="Filter provider"
            value={filterProviderId}
            onChange={setFilterProviderId}
            options={[
              { value: "", label: "Semua provider" },
              ...providers.map((provider) => ({
                value: provider.id,
                label: provider.name,
              })),
            ]}
          />
          <Select
            aria-label="Filter kapabilitas input"
            value={filterInput}
            onChange={setFilterInput}
            options={[
              { value: "", label: "Semua input" },
              ...CAPABILITIES.map((capability) => ({
                value: capability,
                label: `Input ${capability}`,
              })),
            ]}
          />
          <Select
            aria-label="Filter kapabilitas output"
            value={filterOutput}
            onChange={setFilterOutput}
            options={[
              { value: "", label: "Semua output" },
              ...CAPABILITIES.map((capability) => ({
                value: capability,
                label: `Output ${capability}`,
              })),
            ]}
          />
          <TextInput
            value={filterQuery}
            onChange={(event) => setFilterQuery(event.target.value)}
            placeholder="Cari nama atau kode model"
            aria-label="Cari model"
          />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <label className="inline-flex cursor-pointer items-center gap-2 text-[11px] text-muted">
            <input
              type="checkbox"
              checked={onlyActive}
              onChange={(event) => setOnlyActive(event.target.checked)}
              className="size-4 accent-[#d93e14]"
            />
            Hanya aktif
          </label>
          <span className="text-[10px] text-muted">{models.length} model</span>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-[1.75rem] border border-border bg-white">
        <div className="hidden grid-cols-[1.6fr_1.2fr_0.5fr_0.5fr_0.5fr_auto] gap-3 border-b border-border px-5 py-3 text-[10px] uppercase tracking-[0.14em] text-muted lg:grid">
          <span>Model</span>
          <span>Kapabilitas</span>
          <span>Sumber</span>
          <span>Tarif</span>
          <span>Status</span>
          <span />
        </div>

        {models.length === 0 ? (
          <p className="px-5 py-8 text-center text-xs text-muted">
            Tidak ada model yang cocok dengan filter.
          </p>
        ) : null}

        {models.map((model) => (
          <div
            key={model.id}
            className="grid gap-3 border-b border-border/60 px-5 py-4 last:border-b-0 lg:grid-cols-[1.6fr_1.2fr_0.5fr_0.5fr_0.5fr_auto] lg:items-center"
          >
            <div>
              <p className="text-sm font-medium text-ink">{model.displayName}</p>
              <p className="font-mono text-[10px] text-muted">
                {model.providerModelId || model.code}
              </p>
              <p className="text-[9px] text-muted/70">
                {providerName(model.providerId)} · {model.mediaType}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted">
              <CapabilityChips capabilities={model.inputCapabilities} />
              <span aria-hidden>→</span>
              <CapabilityChips capabilities={model.outputCapabilities} />
            </div>
            <span
              className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[9px] font-medium ${
                model.source === "SYNC"
                  ? "bg-accent-soft text-accent-strong"
                  : "bg-canvas-2 text-ink/70"
              }`}
            >
              {model.source}
            </span>
            <p className="text-sm font-semibold text-ink">{formatTokens(model.tokenCost)}</p>
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
          Tarif token langsung dipakai kalkulator di Creator. Kapabilitas input menentukan tipe
          lampiran yang boleh dikirim ke model ini.
        </p>
      </div>

      <Dialog
        open={Boolean(editing)}
        title={`Edit ${editing?.displayName ?? "model"}`}
        description="Atur nama, tarif token, parameter, dan kapabilitas model."
        onClose={() => setEditing(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Batal
            </Button>
            <Button variant="primary" loading={updateModelFull.isPending} onClick={handleSave}>
              Simpan perubahan
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="Nama tampilan" htmlFor="model-display-name">
            <TextInput
              id="model-display-name"
              value={draftDisplayName}
              onChange={(event) => setDraftDisplayName(event.target.value)}
            />
          </Field>
          <Field label="Kode model" htmlFor="model-code-readonly" hint="Kode model tidak diubah.">
            <TextInput id="model-code-readonly" value={editing?.code ?? ""} disabled readOnly />
          </Field>
          <Field label="Tarif token per render" htmlFor="model-cost">
            <TextInput
              id="model-cost"
              type="number"
              min={0}
              value={draftCost}
              onChange={(event) => setDraftCost(event.target.value)}
            />
          </Field>
          <Field
            label="Batas karakter prompt"
            htmlFor="model-max-prompt"
            hint="Kosongkan untuk memakai batas default. Prompt lebih panjang dimampatkan otomatis."
          >
            <TextInput
              id="model-max-prompt"
              type="number"
              min={1}
              max={32000}
              value={draftMaxPrompt}
              onChange={(event) => setDraftMaxPrompt(event.target.value)}
              placeholder="Default"
            />
          </Field>
          {editing && providerName(editing.providerId) === "Higgsfield" ? (
            <label className="flex items-center gap-2 rounded-xl border border-border bg-surface-2/40 px-3 py-2 text-[11px] text-ink">
              <input
                type="checkbox"
                checked={draftThinking}
                onChange={(event) => setDraftThinking(event.target.checked)}
                className="size-3.5 accent-[#f04e23]"
              />
              Deep thinking (Wan 3.0)
            </label>
          ) : null}
          {editing && SOUL_MODEL_CODES.includes(editing.code) ? (
            <Field
              label="Soul ID reference"
              htmlFor="model-soul-reference"
              hint="Pilih karakter yang sudah selesai dilatih di panel proyek (Pre-context)."
            >
              <Select
                id="model-soul-reference"
                value={draftReference}
                onChange={setDraftReference}
                options={[
                  { value: "", label: "Tanpa referensi" },
                  ...completedCharacters.map((character) => ({
                    value: character.externalId ?? "",
                    label: `${character.name} · ${character.modelVersion}`,
                  })),
                ]}
              />
            </Field>
          ) : null}
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
          {editing?.mediaType === "TEXT" ? null : (
            <>
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
            </>
          )}
          <CapabilityPicker
            label="Kapabilitas input"
            value={draftInputCaps}
            onToggle={(capability) =>
              setDraftInputCaps((current) => toggleCapability(current, capability))
            }
          />
          <CapabilityPicker
            label="Kapabilitas output"
            value={draftOutputCaps}
            onToggle={(capability) =>
              setDraftOutputCaps((current) => toggleCapability(current, capability))
            }
          />
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
                onChange={(value) => handleMediaTypeChange(value as ModelMediaType)}
                options={[
                  { value: "VIDEO", label: "VIDEO" },
                  { value: "IMAGE", label: "IMAGE" },
                  { value: "TEXT", label: "Teks (plan/analisis)" },
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

          <Field
            label="Batas karakter prompt"
            htmlFor="model-new-max-prompt"
            hint="Kosongkan untuk memakai batas default. Prompt lebih panjang dimampatkan otomatis."
          >
            <TextInput
              id="model-new-max-prompt"
              type="number"
              min={1}
              max={32000}
              value={draftNewMaxPrompt}
              onChange={(event) => setDraftNewMaxPrompt(event.target.value)}
              placeholder="Default"
            />
          </Field>

          {selectedProvider?.code === "HIGGSFIELD" ? (
            <label className="flex items-center gap-2 rounded-xl border border-border bg-surface-2/40 px-3 py-2 text-[11px] text-ink">
              <input
                type="checkbox"
                checked={draftNewThinking}
                onChange={(event) => setDraftNewThinking(event.target.checked)}
                className="size-3.5 accent-[#f04e23]"
              />
              Deep thinking (Wan 3.0)
            </label>
          ) : null}
          {SOUL_MODEL_CODES.includes(draftCode) ? (
            <Field
              label="Soul ID reference"
              htmlFor="model-new-soul-reference"
              hint="Pilih karakter yang sudah selesai dilatih di panel proyek (Pre-context)."
            >
              <Select
                id="model-new-soul-reference"
                value={draftNewReference}
                onChange={setDraftNewReference}
                options={[
                  { value: "", label: "Tanpa referensi" },
                  ...completedCharacters.map((character) => ({
                    value: character.externalId ?? "",
                    label: `${character.name} · ${character.modelVersion}`,
                  })),
                ]}
              />
            </Field>
          ) : null}

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

          {draftMediaType === "TEXT" ? null : (
            <>
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
            </>
          )}

          <CapabilityPicker
            label="Kapabilitas input"
            value={draftNewInputCaps}
            onToggle={(capability) =>
              setDraftNewInputCaps((current) => toggleCapability(current, capability))
            }
          />
          <CapabilityPicker
            label="Kapabilitas output"
            value={draftNewOutputCaps}
            onToggle={(capability) =>
              setDraftNewOutputCaps((current) => toggleCapability(current, capability))
            }
          />

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
