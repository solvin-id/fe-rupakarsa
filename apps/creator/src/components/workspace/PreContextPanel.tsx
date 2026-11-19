"use client";

import { Check, Film, Layers, Plus, RefreshCw, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  useCreateFolderContextMutation,
  useDeleteFolderContextMutation,
  useFolderGenerationsQuery,
  useRefreshCharacterMutation,
  useTrainCharacterMutation,
  useUpdateFolderCharacterMutation,
  useUpdateFolderContextMutation,
  useUploadReferenceMutation,
  useWorkspaceCharactersQuery,
} from "@rupakarsa/shared/hooks/use-projects";
import { formatRelative } from "@rupakarsa/shared/lib/format";
import type {
  AiCharacterReference,
  FolderContext,
  Generation,
} from "@rupakarsa/shared/lib/types";
import { useUiStore } from "@rupakarsa/shared/stores/ui-store";
import { Button, Select, TextArea, TextInput } from "@rupakarsa/shared/ui";

import {
  AssetDropzone,
  validateReferenceFile,
} from "@/components/workspace/AssetDropzone";
import type { ReferenceFile } from "@/components/workspace/AssetDropzone";
import { GenerationMediaPreview } from "@/components/workspace/GenerationMediaPreview";

const SOURCE_LABEL: Record<FolderContext["source"], string> = {
  TEXT: "Teks",
  UPLOAD: "Upload",
  GENERATION: "Riwayat",
};

const SOUL_VERSIONS: Array<{ value: string; label: string }> = [
  { value: "v1", label: "v1" },
  { value: "v2", label: "v2" },
  { value: "cinema", label: "cinema" },
];

const MAX_SOUL_IMAGES = 10;

const CHARACTER_STATUS_STYLES: Record<AiCharacterReference["status"], string> = {
  NOT_READY: "bg-canvas-2 text-ink/70",
  QUEUED: "bg-warning/10 text-warning",
  IN_PROGRESS: "bg-accent/10 text-accent-strong",
  COMPLETED: "bg-success/10 text-success",
  FAILED: "bg-danger/10 text-danger",
};

export interface PreContextPanelProps {
  folderId: string;
  contexts: FolderContext[];
  /** Folder history, so the scene chain can show the finished scenes. */
  generations: Generation[];
  /** Completed scenes the user picked to drive continuity, oldest first. */
  chainSceneIds: string[];
  onChainChange: (ids: string[]) => void;
  maxChainScenes: number;
  /** Soul ID selected for this project, or null for the render model's default. */
  characterReferenceId: string | null;
  canManageCharacters: boolean;
  disabled?: boolean;
  /** The CMS-wired video analysis model accepts VIDEO. */
  allowVideoAnalysis: boolean;
  /** The CMS-wired image analysis model accepts IMAGE (history renders can be either type). */
  allowImageAnalysis: boolean;
}

/**
 * Project pre-context: durable notes and analysed media the plan model always sees, plus the
 * selected scene chain and the project's Soul ID, so a series of renders keeps one film's identity.
 */
export function PreContextPanel({
  folderId,
  contexts,
  generations,
  chainSceneIds,
  onChainChange,
  maxChainScenes,
  characterReferenceId,
  canManageCharacters,
  disabled = false,
  allowVideoAnalysis,
  allowImageAnalysis,
}: PreContextPanelProps) {
  const pushToast = useUiStore((state) => state.pushToast);
  const createContext = useCreateFolderContextMutation(folderId);
  const updateContext = useUpdateFolderContextMutation(folderId);
  const deleteContext = useDeleteFolderContextMutation(folderId);
  const uploadReference = useUploadReferenceMutation();
  const generationsQuery = useFolderGenerationsQuery(folderId);

  const charactersQuery = useWorkspaceCharactersQuery();
  const updateFolderCharacter = useUpdateFolderCharacterMutation(folderId);
  const trainCharacter = useTrainCharacterMutation();
  const refreshCharacter = useRefreshCharacterMutation();

  const [textLabel, setTextLabel] = useState("");
  const [textValue, setTextValue] = useState("");
  const [videoFile, setVideoFile] = useState<ReferenceFile | null>(null);
  const [historyId, setHistoryId] = useState("");
  const [busy, setBusy] = useState(false);

  const [soulOpen, setSoulOpen] = useState(false);
  const [soulName, setSoulName] = useState("");
  const [soulVersion, setSoulVersion] = useState("v1");
  const [soulFiles, setSoulFiles] = useState<File[]>([]);
  const [soulBusy, setSoulBusy] = useState(false);

  const soulPreviews = useMemo(
    () => soulFiles.map((file) => URL.createObjectURL(file)),
    [soulFiles],
  );
  useEffect(() => {
    return () => {
      for (const url of soulPreviews) URL.revokeObjectURL(url);
    };
  }, [soulPreviews]);

  /** A history row is only analyzable when its own media type has a wired analysis model. */
  const historyRows = (generationsQuery.data ?? [])
    .filter((item) => item.status === "COMPLETED")
    .slice(0, 20);
  const historyOptions = historyRows.map((item) => ({
    value: item.id,
    label: `${item.modelName} · ${item.mediaType === "VIDEO" ? "Video" : "Gambar"} · ${formatRelative(item.createdAt)}`,
    disabled: item.mediaType === "VIDEO" ? !allowVideoAnalysis : !allowImageAnalysis,
  }));
  const analyzableHistory = historyOptions.filter((option) => !option.disabled);
  const selectedHistory = historyRows.find((item) => item.id === historyId) ?? null;
  const selectedAnalyzable = selectedHistory
    ? selectedHistory.mediaType === "VIDEO"
      ? allowVideoAnalysis
      : allowImageAnalysis
    : false;

  const characters = charactersQuery.data ?? [];
  const activeCharacter = characters.find((item) => item.id === characterReferenceId) ?? null;
  const characterOptions = [
    { value: "", label: "Tanpa referensi" },
    ...characters.map((item) => ({
      value: item.id,
      label: `${item.name} · ${item.modelVersion} · ${item.status}`,
      disabled: item.status !== "COMPLETED",
    })),
  ];

  // The chain always plays in scene order, whatever order the list endpoint returned.
  const scenes = [...generations]
    .filter((item) => item.status === "COMPLETED")
    .sort((a, b) => a.sequence - b.sequence)
    .slice(-12);

  function addText(): void {
    const text = textValue.trim();
    if (text.length === 0) {
      pushToast("error", "Tulis catatan konteks terlebih dahulu.");
      return;
    }
    createContext.mutate(
      { source: "TEXT", label: textLabel.trim() || "Catatan", text },
      {
        onSuccess: () => {
          setTextValue("");
          setTextLabel("");
          pushToast("success", "Konteks ditambahkan.");
        },
        onError: (error) => pushToast("error", error.message),
      },
    );
  }

  async function addVideo(): Promise<void> {
    if (!videoFile) return;
    setBusy(true);
    try {
      const uploaded = await uploadReference.mutateAsync(videoFile.file);
      createContext.mutate(
        { source: "UPLOAD", label: videoFile.name, mediaAssetId: uploaded.id },
        {
          onSuccess: () => {
            setVideoFile(null);
            pushToast("success", "Video dianalisis dan ditambahkan sebagai konteks.");
          },
          onError: (error) => pushToast("error", error.message),
        },
      );
    } catch (error) {
      pushToast("error", error instanceof Error ? error.message : "Unggahan gagal.");
    } finally {
      setBusy(false);
    }
  }

  function addFromHistory(): void {
    if (historyId.length === 0) {
      pushToast("error", "Pilih hasil render terlebih dahulu.");
      return;
    }
    createContext.mutate(
      { source: "GENERATION", label: "Riwayat render", generationId: historyId },
      {
        onSuccess: () => {
          setHistoryId("");
          pushToast("success", "Riwayat render dianalisis dan ditambahkan.");
        },
        onError: (error) => pushToast("error", error.message),
      },
    );
  }

  function toggleScene(sceneId: string): void {
    if (chainSceneIds.includes(sceneId)) {
      onChainChange(chainSceneIds.filter((id) => id !== sceneId));
      return;
    }
    if (chainSceneIds.length >= maxChainScenes) {
      pushToast("error", `Maksimal ${maxChainScenes} scene untuk chain.`);
      return;
    }
    onChainChange([...chainSceneIds, sceneId]);
  }

  function pickSoulFiles(picked: FileList | null): void {
    if (!picked) return;
    const next = [...soulFiles];
    for (const file of Array.from(picked)) {
      if (next.length >= MAX_SOUL_IMAGES) {
        pushToast("error", `Maksimal ${MAX_SOUL_IMAGES} gambar latihan.`);
        break;
      }
      const check = validateReferenceFile(file, "image");
      if (!check.ok) {
        pushToast("error", check.message);
        continue;
      }
      next.push(file);
    }
    setSoulFiles(next);
  }

  async function trainSoul(): Promise<void> {
    if (soulName.trim().length === 0) {
      pushToast("error", "Nama karakter wajib diisi.");
      return;
    }
    if (soulFiles.length === 0) {
      pushToast("error", "Pilih minimal satu gambar latihan.");
      return;
    }
    setSoulBusy(true);
    try {
      const imageAssetIds: string[] = [];
      for (const file of soulFiles) {
        const uploaded = await uploadReference.mutateAsync(file);
        imageAssetIds.push(uploaded.id);
      }
      await trainCharacter.mutateAsync({
        name: soulName.trim(),
        modelVersion: soulVersion as "v1" | "v2" | "cinema",
        imageAssetIds,
      });
      setSoulName("");
      setSoulFiles([]);
      pushToast("success", "Training Soul ID dikirim. Cek status berkala.");
    } catch (error) {
      pushToast("error", error instanceof Error ? error.message : "Training Soul ID gagal.");
    } finally {
      setSoulBusy(false);
    }
  }

  return (
    <section className="card p-4 sm:p-5" data-testid="pre-context">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="mono-label text-muted">Pre-context proyek</p>
          <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-ink">Konteks tetap</h2>
          <p className="mt-1 text-[10px] leading-relaxed text-muted">
            Konteks ini dipakai otomatis di setiap render proyek ini.
          </p>
        </div>
        <span className="pill">{contexts.length} entri</span>
      </div>

      <div className="mt-4 flex flex-col divide-y divide-border/60 rounded-2xl border border-border bg-white">
        <section className="p-3" data-testid="scene-chain">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Layers className="size-3.5 text-accent-2" aria-hidden />
              <p className="mono-label text-[9px] text-muted">Scene chain</p>
              <span className="rounded-full bg-canvas-2 px-1.5 py-0.5 font-mono text-[9px] text-ink">
                {chainSceneIds.length}/{maxChainScenes}
              </span>
            </div>
            <p className="text-[10px] text-muted">Pilih maks. {maxChainScenes} scene</p>
          </div>

          {scenes.length === 0 ? (
            <p className="mt-2 rounded-lg border border-dashed border-border px-3 py-3 text-center text-[10px] text-muted">
              Belum ada scene selesai di folder ini.
            </p>
          ) : (
            <ul className="mt-2 flex gap-2 overflow-x-auto pb-1">
              {scenes.map((scene) => {
                const url = scene.outputPurgedAt ? null : scene.outputUrl;
                const selected = chainSceneIds.includes(scene.id);
                return (
                  <li key={scene.id} className="shrink-0">
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => toggleScene(scene.id)}
                      aria-pressed={selected}
                      aria-label={`Scene ${scene.sequence}`}
                      className={`w-24 shrink-0 text-left ${selected ? "" : "opacity-60 hover:opacity-100"}`}
                    >
                      <div
                        className={`relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-canvas-2 ${
                          selected ? "ring-2 ring-accent" : ""
                        }`}
                      >
                        {url ? (
                          <GenerationMediaPreview
                            url={url}
                            mediaType={scene.mediaType}
                            mime={scene.outputMime}
                            label={`Scene ${scene.sequence}`}
                            className="size-full object-cover"
                          />
                        ) : (
                          <span className="flex size-full items-center justify-center text-[9px] text-muted">
                            Tanpa hasil
                          </span>
                        )}
                        <span className="absolute left-1 top-1 rounded-full bg-ink/80 px-1.5 py-0.5 font-mono text-[9px] text-canvas">
                          #{scene.sequence}
                        </span>
                        {selected ? (
                          <span className="absolute right-1 top-1 rounded-full bg-accent p-0.5 text-white">
                            <Check className="size-3" aria-hidden />
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 line-clamp-2 text-[9px] leading-tight text-muted">
                        {scene.plannedPrompt.slice(0, 80)}
                      </p>
                      <p className="text-[8px] text-muted/70">{formatRelative(scene.completedAt)}</p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="p-3" data-testid="soul-id">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1.5">
              <Sparkles className="size-3.5 text-accent-2" aria-hidden />
              <p className="mono-label text-[9px] text-muted">Soul ID</p>
              <span className="truncate text-[11px] font-medium text-ink">
                {activeCharacter?.name ?? "Belum dipilih"}
              </span>
              {activeCharacter ? (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[8px] font-medium ${CHARACTER_STATUS_STYLES[activeCharacter.status]}`}
                >
                  {activeCharacter.status}
                </span>
              ) : null}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSoulOpen((open) => !open)}>
              {soulOpen ? "Tutup" : "Kelola"}
            </Button>
          </div>

          {soulOpen ? (
            <div className="mt-2 flex flex-col gap-3">
              <label className="flex flex-col gap-1">
                <span className="mono-label text-[9px] text-muted">Soul ID proyek</span>
                <Select
                  value={characterReferenceId ?? ""}
                  onChange={(value) =>
                    updateFolderCharacter.mutate(value || null, {
                      onSuccess: () => pushToast("success", "Soul ID proyek disimpan."),
                      onError: (error) => pushToast("error", error.message),
                    })
                  }
                  options={characterOptions}
                  disabled={disabled || updateFolderCharacter.isPending}
                  aria-label="Soul ID proyek"
                />
              </label>

              {canManageCharacters ? (
                <div className="rounded-lg border border-border p-2.5">
                  <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.4fr)]">
                    <TextInput
                      value={soulName}
                      onChange={(event) => setSoulName(event.target.value)}
                      placeholder="Nama karakter"
                      disabled={disabled || soulBusy}
                      aria-label="Nama karakter"
                    />
                    <Select
                      value={soulVersion}
                      onChange={setSoulVersion}
                      options={SOUL_VERSIONS}
                      disabled={disabled || soulBusy}
                      aria-label="Versi model Soul ID"
                    />
                  </div>
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    disabled={disabled || soulBusy}
                    onChange={(event) => {
                      pickSoulFiles(event.target.files);
                      event.target.value = "";
                    }}
                    className="mt-2 w-full text-[10px] text-muted file:mr-2 file:rounded-full file:border-0 file:bg-canvas-2 file:px-2 file:py-1 file:text-[10px] file:text-ink"
                    aria-label="Gambar latihan Soul ID"
                  />
                  {soulFiles.length > 0 ? (
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {soulFiles.map((file, index) => (
                        <li key={`${file.name}-${index}`} className="relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={soulPreviews[index]}
                            alt={file.name}
                            className="size-10 rounded-lg object-cover"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setSoulFiles((current) => current.filter((_, item) => item !== index))
                            }
                            aria-label={`Hapus ${file.name}`}
                            className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-ink text-[8px] text-canvas"
                          >
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-2 w-full"
                    disabled={disabled || soulBusy}
                    loading={soulBusy}
                    onClick={() => void trainSoul()}
                  >
                    Latih Soul ID
                  </Button>
                </div>
              ) : (
                <p className="text-[10px] text-muted">
                  Hanya admin workspace yang dapat melatih Soul ID.
                </p>
              )}

              <ul className="flex flex-col gap-1.5">
                {characters.length === 0 ? (
                  <li className="rounded-lg border border-dashed border-border px-3 py-2 text-center text-[10px] text-muted">
                    Belum ada referensi karakter.
                  </li>
                ) : null}
                {characters.map((character) => (
                  <li
                    key={character.id}
                    className="flex items-center gap-2 rounded-lg border border-border px-2 py-1.5"
                  >
                    {character.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={character.thumbnailUrl}
                        alt={character.name}
                        className="size-7 rounded object-cover"
                      />
                    ) : (
                      <span className="flex size-7 items-center justify-center rounded bg-canvas-2 text-[8px] text-muted">
                        ID
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 truncate text-[10px] font-medium text-ink">
                        {character.name}
                        <span className="mono-label shrink-0 text-[8px] text-muted">
                          {character.modelVersion}
                        </span>
                        <span
                          className={`shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-medium ${CHARACTER_STATUS_STYLES[character.status]}`}
                        >
                          {character.status}
                        </span>
                      </p>
                      {character.failReason ? (
                        <p className="text-[10px] leading-tight text-danger">
                          {character.failReason}
                        </p>
                      ) : null}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      loading={
                        refreshCharacter.isPending && refreshCharacter.variables === character.id
                      }
                      disabled={disabled}
                      onClick={() =>
                        refreshCharacter.mutate(character.id, {
                          onError: (error) => pushToast("error", error.message),
                        })
                      }
                    >
                      <RefreshCw className="size-3" aria-hidden />
                      Refresh
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        <section className="p-3">
          <div className="grid gap-2 sm:grid-cols-[minmax(0,0.4fr)_minmax(0,1fr)]">
            <TextInput
              value={textLabel}
              onChange={(event) => setTextLabel(event.target.value)}
              placeholder="Label (mis. Brand)"
              disabled={disabled}
              aria-label="Label konteks"
            />
            <TextArea
              value={textValue}
              onChange={(event) => setTextValue(event.target.value)}
              rows={2}
              placeholder="Catatan yang harus selalu dipatuhi model plan…"
              className="min-h-16 bg-white text-[12px]"
              disabled={disabled}
              aria-label="Teks konteks"
            />
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[10px] text-muted">Gratis, tidak memakai token.</p>
            <Button
              variant="secondary"
              size="sm"
              disabled={disabled || createContext.isPending}
              icon={<Plus className="size-3.5" aria-hidden />}
              onClick={addText}
            >
              Tambah teks
            </Button>
          </div>
        </section>

        <section className="p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="mono-label text-[9px] text-muted">Upload video</p>
              <div className="mt-2">
                <AssetDropzone
                  file={videoFile}
                  onChange={setVideoFile}
                  accept="video"
                  disabled={disabled || !allowVideoAnalysis || busy}
                  onError={(message) => pushToast("error", message)}
                />
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="mt-2 w-full"
                disabled={disabled || !allowVideoAnalysis || !videoFile || busy}
                loading={busy}
                onClick={() => void addVideo()}
              >
                Analisis video
              </Button>
              {!allowVideoAnalysis ? (
                <p className="mt-1.5 text-[10px] leading-relaxed text-muted">
                  Setel <span className="font-medium text-ink">Analisis video</span> di CMS →
                  Settings → AI.
                </p>
              ) : null}
            </div>

            <div>
              <p className="mono-label text-[9px] text-muted">Ambil dari riwayat</p>
              <Select
                className="mt-2"
                value={historyId}
                onChange={setHistoryId}
                disabled={disabled || analyzableHistory.length === 0}
                placeholder={
                  historyOptions.length === 0
                    ? "Belum ada render selesai"
                    : analyzableHistory.length === 0
                      ? "Tidak ada render yang bisa dianalisis"
                      : "Pilih render"
                }
                options={historyOptions}
              />
              <Button
                variant="secondary"
                size="sm"
                className="mt-2 w-full"
                disabled={disabled || !selectedAnalyzable}
                onClick={addFromHistory}
              >
                Analisis riwayat
              </Button>
              {!allowVideoAnalysis && !allowImageAnalysis ? (
                <p className="mt-1.5 text-[10px] leading-relaxed text-muted">
                  Setel model <span className="font-medium text-ink">Analisis gambar</span> dan{" "}
                  <span className="font-medium text-ink">Analisis video</span> di CMS → Settings →
                  AI.
                </p>
              ) : !allowVideoAnalysis ? (
                <p className="mt-1.5 text-[10px] leading-relaxed text-muted">
                  Hasil video belum bisa dianalisis. Setel{" "}
                  <span className="font-medium text-ink">Analisis video</span> di CMS → Settings →
                  AI.
                </p>
              ) : !allowImageAnalysis ? (
                <p className="mt-1.5 text-[10px] leading-relaxed text-muted">
                  Hasil gambar belum bisa dianalisis. Setel{" "}
                  <span className="font-medium text-ink">Analisis gambar</span> di CMS → Settings →
                  AI.
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <section className="p-3">
          <ul className="flex flex-col gap-2">
            {contexts.length === 0 ? (
              <li className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-[11px] text-muted">
                Belum ada konteks. Tambahkan catatan brand atau unggah video referensi.
              </li>
            ) : null}
            {contexts.map((context) => (
              <li
                key={context.id}
                className={`rounded-lg border px-3 py-2.5 ${
                  context.isActive
                    ? "border-border bg-white"
                    : "border-dashed border-border bg-surface-2/30"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-1.5">
                    {context.source === "GENERATION" ? (
                      <Film className="size-3 shrink-0 text-accent-2" aria-hidden />
                    ) : null}
                    <span className="truncate text-[11px] font-medium text-ink">
                      {context.label}
                    </span>
                    <span className="mono-label shrink-0 text-[8px] text-muted">
                      {SOURCE_LABEL[context.source]}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      disabled={disabled || updateContext.isPending}
                      onClick={() =>
                        updateContext.mutate({ contextId: context.id, isActive: !context.isActive })
                      }
                      className="rounded-full border border-border px-2 py-0.5 text-[9px] font-medium text-muted transition-colors hover:text-ink disabled:opacity-40"
                    >
                      {context.isActive ? "Aktif" : "Nonaktif"}
                    </button>
                    <button
                      type="button"
                      disabled={disabled || deleteContext.isPending}
                      onClick={() => deleteContext.mutate(context.id)}
                      aria-label={`Hapus ${context.label}`}
                      className="flex size-6 items-center justify-center rounded-full text-muted transition-colors hover:bg-danger/5 hover:text-danger disabled:opacity-40"
                    >
                      <Trash2 className="size-3" aria-hidden />
                    </button>
                  </span>
                </div>
                <p className="mt-1 line-clamp-3 text-[10px] leading-relaxed text-muted">
                  {context.text}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </section>
  );
}
