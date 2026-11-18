"use client";

import { Film, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import {
  useCreateFolderContextMutation,
  useDeleteFolderContextMutation,
  useFolderGenerationsQuery,
  useUpdateFolderContextMutation,
  useUploadReferenceMutation,
} from "@rupakarsa/shared/hooks/use-projects";
import { formatRelative } from "@rupakarsa/shared/lib/format";
import type { FolderContext, Generation } from "@rupakarsa/shared/lib/types";
import { useUiStore } from "@rupakarsa/shared/stores/ui-store";
import { Button, Select, TextArea, TextInput } from "@rupakarsa/shared/ui";

import { AssetDropzone } from "@/components/workspace/AssetDropzone";
import type { ReferenceFile } from "@/components/workspace/AssetDropzone";
import { GenerationMediaPreview } from "@/components/workspace/GenerationMediaPreview";

const SOURCE_LABEL: Record<FolderContext["source"], string> = {
  TEXT: "Teks",
  UPLOAD: "Upload",
  GENERATION: "Riwayat",
};

export interface PreContextPanelProps {
  folderId: string;
  contexts: FolderContext[];
  /** Folder history, so the scene chain can show the last finished scenes. */
  generations: Generation[];
  continueFromPrevious: boolean;
  onContinueChange: (value: boolean) => void;
  disabled?: boolean;
  /** The CMS-wired video analysis model accepts VIDEO. */
  allowVideoAnalysis: boolean;
  /** The CMS-wired image analysis model accepts IMAGE (history renders can be either type). */
  allowImageAnalysis: boolean;
}

/**
 * Project pre-context: durable notes and analysed media the plan model always sees, so a series of
 * renders keeps the same brand, continuity, and look without repeating it in every brief.
 */
export function PreContextPanel({
  folderId,
  contexts,
  generations,
  continueFromPrevious,
  onContinueChange,
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

  const [textLabel, setTextLabel] = useState("");
  const [textValue, setTextValue] = useState("");
  const [videoFile, setVideoFile] = useState<ReferenceFile | null>(null);
  const [historyId, setHistoryId] = useState("");
  const [busy, setBusy] = useState(false);

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

  // The chain always plays in scene order, whatever order the list endpoint returned.
  const scenes = [...generations]
    .filter((item) => item.status === "COMPLETED")
    .sort((a, b) => a.sequence - b.sequence)
    .slice(-5);

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

  return (
    <section className="card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="mono-label text-muted">Pre-context proyek</p>
          <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-ink">Konteks tetap</h2>
        </div>
        <span className="pill">{contexts.length} entri</span>
      </div>

      <div className="mt-4 rounded-xl border border-border bg-surface-2/40 p-3" data-testid="scene-chain">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="mono-label text-[9px] text-muted">Scene chain</p>
            <p className="mt-1 max-w-xs text-[10px] leading-relaxed text-muted">
              Scene sebelumnya dipakai sebagai acuan visual dan gaya. Matikan untuk memulai adegan
              baru.
            </p>
          </div>
          <label className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-white px-2.5 py-1 text-[10px] font-medium text-ink">
            <input
              type="checkbox"
              checked={continueFromPrevious}
              onChange={(event) => onContinueChange(event.target.checked)}
              disabled={disabled}
              className="size-3 accent-[#f04e23]"
            />
            Lanjutkan scene terakhir
          </label>
        </div>

        <ul className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {scenes.length === 0 ? (
            <li className="w-full rounded-lg border border-dashed border-border px-3 py-3 text-center text-[10px] text-muted">
              Belum ada scene selesai di folder ini.
            </li>
          ) : null}
          {scenes.map((scene) => {
            const url = scene.outputPurgedAt ? null : scene.outputUrl;
            return (
              <li key={scene.id} className="w-28 shrink-0">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-canvas-2">
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
                </div>
                <p className="mt-1 line-clamp-2 text-[9px] leading-tight text-muted">
                  {scene.plannedPrompt.slice(0, 80)}
                </p>
                <p className="text-[8px] text-muted/70">{formatRelative(scene.completedAt)}</p>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-4 rounded-xl border border-border bg-surface-2/40 p-3">
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
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border p-3">
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
              Setel <span className="font-medium text-ink">Analisis video</span> di CMS → Settings →
              AI.
            </p>
          ) : null}
        </div>

        <div className="rounded-xl border border-border p-3">
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
              <span className="font-medium text-ink">Analisis video</span> di CMS → Settings → AI.
            </p>
          ) : !allowVideoAnalysis ? (
            <p className="mt-1.5 text-[10px] leading-relaxed text-muted">
              Hasil video belum bisa dianalisis. Setel{" "}
              <span className="font-medium text-ink">Analisis video</span> di CMS → Settings → AI.
            </p>
          ) : !allowImageAnalysis ? (
            <p className="mt-1.5 text-[10px] leading-relaxed text-muted">
              Hasil gambar belum bisa dianalisis. Setel{" "}
              <span className="font-medium text-ink">Analisis gambar</span> di CMS → Settings → AI.
            </p>
          ) : null}
        </div>
      </div>

      <ul className="mt-4 flex flex-col gap-2">
        {contexts.length === 0 ? (
          <li className="rounded-xl border border-dashed border-border px-3 py-4 text-center text-[11px] text-muted">
            Belum ada konteks. Tambahkan catatan brand atau unggah video referensi.
          </li>
        ) : null}
        {contexts.map((context) => (
          <li
            key={context.id}
            className={`rounded-xl border px-3 py-2.5 ${
              context.isActive ? "border-border bg-white" : "border-dashed border-border bg-surface-2/30"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-1.5">
                {context.source === "GENERATION" ? (
                  <Film className="size-3 shrink-0 text-accent-2" aria-hidden />
                ) : null}
                <span className="truncate text-[11px] font-medium text-ink">{context.label}</span>
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
            <p className="mt-1 line-clamp-3 text-[10px] leading-relaxed text-muted">{context.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
