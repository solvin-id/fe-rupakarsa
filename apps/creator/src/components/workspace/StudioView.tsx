"use client";

import { ArrowLeft, Film, Image as ImageIcon, Layers, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { GradientArt } from "@rupakarsa/shared/brand";
import { usePublicConfigQuery, useSessionQuery } from "@rupakarsa/shared/hooks/use-session";
import {
  useCreatorModelsQuery,
  useDeleteGenerationMutation,
  useFolderGenerationsQuery,
  useFoldersQuery,
  useGenerateMutation,
  useGenerationQuery,
  usePlanMutation,
  useUploadReferenceMutation,
} from "@rupakarsa/shared/hooks/use-projects";
import { queryKeys } from "@rupakarsa/shared/lib/api/keys";
import { formatDateTime, formatRelative, formatTokens } from "@rupakarsa/shared/lib/format";
import { isVideoUrl } from "@rupakarsa/shared/lib/media";
import type { Generation, GenerationStatus, MediaType } from "@rupakarsa/shared/lib/types";
import { useUiStore } from "@rupakarsa/shared/stores/ui-store";
import { Button } from "@rupakarsa/shared/ui";
import { Dialog } from "@rupakarsa/shared/ui";

import { GeneratorPanel } from "@/components/workspace/GeneratorPanel";
import { HistoryPanel } from "@/components/workspace/HistoryPanel";
import { PlanCanvas } from "@/components/workspace/PlanCanvas";
import type { ReferenceFile } from "@/components/workspace/AssetDropzone";

const STATUS_LABEL: Record<GenerationStatus, string> = {
  QUEUED: "Queued",
  RENDERING: "Rendering",
  COMPLETED: "Completed",
  FAILED: "Failed",
};

export function StudioView({ folderId }: { folderId: string }) {
  const sessionQuery = useSessionQuery();
  const foldersQuery = useFoldersQuery();
  const generationsQuery = useFolderGenerationsQuery(folderId);
  const modelsQuery = useCreatorModelsQuery();
  const configQuery = usePublicConfigQuery();

  const planMutation = usePlanMutation();
  const generateMutation = useGenerateMutation();
  const uploadReference = useUploadReferenceMutation();
  const deleteGeneration = useDeleteGenerationMutation();
  const pushToast = useUiStore((state) => state.pushToast);
  const queryClient = useQueryClient();

  const [mediaType, setMediaType] = useState<MediaType>("VIDEO");
  const [modelId, setModelId] = useState("");
  const [durationSec, setDurationSec] = useState<number | undefined>(undefined);
  const [resolution, setResolution] = useState("");
  const [aspectRatio, setAspectRatio] = useState("");
  const [rawPrompt, setRawPrompt] = useState("");
  const [plannedPrompt, setPlannedPrompt] = useState("");
  const [direction, setDirection] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [planReady, setPlanReady] = useState(false);
  const [referenceFile, setReferenceFile] = useState<ReferenceFile | null>(null);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [activeGenerationId, setActiveGenerationId] = useState<string | null>(null);
  const [detailTarget, setDetailTarget] = useState<Generation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Generation | null>(null);

  const handledStatusRef = useRef<string | null>(null);

  const session = sessionQuery.data;
  const folder = (foldersQuery.data ?? []).find((item) => item.id === folderId) ?? null;
  const models = useMemo(() => modelsQuery.data ?? [], [modelsQuery.data]);
  const config = configQuery.data;

  const activeModels = useMemo(
    () => models.filter((item) => item.isActive && item.mediaType === mediaType),
    [models, mediaType],
  );
  const model = activeModels.find((item) => item.id === modelId) ?? activeModels[0] ?? null;

  const effectiveDuration = model?.allowedParams.durations?.includes(durationSec ?? -1)
    ? durationSec
    : model?.allowedParams.durations?.[0];
  const effectiveResolution =
    model && model.allowedParams.resolutions.includes(resolution)
      ? resolution
      : (model?.allowedParams.resolutions[0] ?? resolution);
  const effectiveAspect =
    model && model.allowedParams.aspectRatios.includes(aspectRatio)
      ? aspectRatio
      : (model?.allowedParams.aspectRatios[0] ?? aspectRatio);

  const folderGenerations = useMemo(() => {
    const rows = generationsQuery.data ?? [];
    return [...rows].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [generationsQuery.data]);

  const activeGenerationQuery = useGenerationQuery(activeGenerationId, {
    refetchInterval: activeGenerationId ? 1500 : false,
  });

  const activeGeneration = activeGenerationQuery.data ?? null;
  const activeStatus = activeGeneration?.status ?? null;
  const generating = Boolean(activeGenerationId);

  useEffect(() => {
    const current = activeGeneration;
    if (!current || !activeGenerationId) return;
    if (current.status !== "COMPLETED" && current.status !== "FAILED") return;
    if (handledStatusRef.current === `${current.id}:${current.status}`) return;
    handledStatusRef.current = `${current.id}:${current.status}`;

    setActiveGenerationId(null);
    void queryClient.invalidateQueries({ queryKey: queryKeys.generations(folderId) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.folders });
    void queryClient.invalidateQueries({ queryKey: queryKeys.session });
    pushToast(
      current.status === "COMPLETED" ? "success" : "error",
      current.status === "COMPLETED"
        ? "Render selesai. Hasil tersimpan di folder proyek."
        : "Render gagal. Token dikembalikan otomatis.",
    );
  }, [activeGeneration, activeGenerationId, folderId, pushToast, queryClient]);

  const planCost = useMemo(() => {
    const freePlanRemaining = session?.workspace.freePlanRemaining ?? 0;
    if (freePlanRemaining > 0) return { tokens: 0, usesFreeQuota: true };
    return { tokens: config?.pricing.planModeTokenCost ?? 1, usesFreeQuota: false };
  }, [session?.workspace.freePlanRemaining, config?.pricing.planModeTokenCost]);

  const balance = session?.workspace.tokenBalance ?? 0;
  const canGenerate = Boolean(plannedPrompt.trim() && model && !generating && balance >= (model?.tokenCost ?? 0));

  const videos = folderGenerations.filter((item) => item.mediaType === "VIDEO").length;
  const images = folderGenerations.filter((item) => item.mediaType === "IMAGE").length;
  const tokensUsed = folderGenerations.reduce((total, item) => total + item.tokensCharged, 0);

  function handleMediaTypeChange(next: MediaType): void {
    setMediaType(next);
    setModelId("");
    setDurationSec(undefined);
    setResolution("");
    setAspectRatio("");
    setPlanReady(false);
    setPlannedPrompt("");
  }

  function handleModelChange(id: string): void {
    setModelId(id);
    setDurationSec(undefined);
    setResolution("");
    setAspectRatio("");
    setPlanReady(false);
    setPlannedPrompt("");
  }

  function handlePlan(): void {
    if (!model) return;
    if (!rawPrompt.trim()) {
      pushToast("error", "Tulis brief terlebih dahulu.");
      return;
    }
    if (!planCost.usesFreeQuota && balance < planCost.tokens) {
      pushToast("error", "Saldo token tidak cukup untuk Plan Mode.");
      return;
    }

    planMutation.mutate(
      {
        modelId: model.id,
        rawPrompt,
        durationSec: model.mediaType === "VIDEO" ? effectiveDuration : undefined,
        resolution: effectiveResolution,
        aspectRatio: effectiveAspect,
        hasReference: Boolean(referenceFile),
      },
      {
        onSuccess: (data) => {
          setPlannedPrompt(data.blueprint.prompt);
          setDirection(data.blueprint.direction);
          setNegativePrompt(data.blueprint.negativePrompt);
          setPlanReady(true);
          pushToast(
            "success",
            data.cost.usesFreeQuota
              ? "Plan dibuat dengan kuota gratis."
              : "Plan dibuat. 1 token terpakai.",
          );
        },
        onError: (error) => pushToast("error", error.message),
      },
    );
  }

  async function handleGenerate(): Promise<void> {
    if (!model) return;
    if (!plannedPrompt.trim()) {
      pushToast("error", "Buat plan terlebih dahulu.");
      return;
    }
    if (balance < model.tokenCost) {
      pushToast("error", "Saldo token tidak cukup. Hubungi Superadmin untuk top-up.");
      return;
    }
    if (generating) return;

    try {
      let referenceImageUrl: string | null = null;
      if (referenceFile) {
        const uploaded = await uploadReference.mutateAsync(referenceFile.file);
        referenceImageUrl = uploaded.url;
      }

      const created = await generateMutation.mutateAsync({
        folderId,
        modelId: model.id,
        rawPrompt: rawPrompt.trim(),
        plannedPrompt: plannedPrompt.trim(),
        referenceImageUrl,
        selectedParams: {
          durationSec: model.mediaType === "VIDEO" ? effectiveDuration : undefined,
          resolution: effectiveResolution,
          aspectRatio: effectiveAspect,
        },
        simulateFailure,
      });

      handledStatusRef.current = null;
      setActiveGenerationId(created.generation.id);
    } catch (error) {
      pushToast("error", error instanceof Error ? error.message : "Render gagal dijalankan.");
    }
  }

  function handleRemix(generation: Generation): void {
    setMediaType(generation.mediaType);
    setModelId(generation.modelId ?? "");
    setDurationSec(generation.selectedParams.durationSec);
    setResolution(generation.selectedParams.resolution);
    setAspectRatio(generation.selectedParams.aspectRatio);
    setRawPrompt(generation.rawPrompt);
    setPlannedPrompt(generation.plannedPrompt);
    setDirection("");
    setNegativePrompt("");
    setPlanReady(true);
    setDetailTarget(null);
    document.getElementById("plan-canvas")?.scrollIntoView({ behavior: "smooth", block: "start" });
    pushToast("info", "Plan dimuat ulang ke canvas.");
  }

  function handleDownload(generation: Generation): void {
    if (!generation.outputUrl) {
      pushToast("error", "Hasil render belum tersedia.");
      return;
    }
    // The API answers `?download=1` with Content-Disposition: attachment, so a same-tab anchor
    // downloads the file without a popup or a navigation away from the studio.
    const link = document.createElement("a");
    link.href = `${generation.outputUrl}?download=1`;
    link.rel = "noopener";
    document.body.append(link);
    link.click();
    link.remove();
  }

  function handleDelete(): void {
    if (!deleteTarget) return;
    deleteGeneration.mutate(
      { generationId: deleteTarget.id, folderId },
      {
        onSuccess: () => {
          setDeleteTarget(null);
          setDetailTarget(null);
          pushToast("success", "Riwayat render dihapus.");
        },
        onError: (error) => pushToast("error", error.message),
      },
    );
  }

  if (foldersQuery.isPending || generationsQuery.isPending || modelsQuery.isPending) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <span className="size-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!folder) {
    return (
      <div className="mx-auto max-w-lg rounded-[1.75rem] border border-border bg-white p-8 text-center shadow-card">
        <Sparkles className="mx-auto size-7 text-accent" aria-hidden />
        <h1 className="mt-3 text-xl font-semibold text-ink">Folder tidak ditemukan</h1>
        <p className="mt-2 text-sm text-muted">
          Folder ini mungkin sudah dihapus atau bukan milik workspace Anda.
        </p>
        <Link href="/app/projects" className="mt-5 inline-block">
          <Button variant="primary">Kembali ke proyek</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <Link
        href="/app/projects"
        className="inline-flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Semua proyek
      </Link>

      <header className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="mono-label text-accent-strong">Studio workspace</span>
          <h1 className="display mt-2 text-[clamp(2rem,3.8vw,3.2rem)] text-ink">{folder.name}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{folder.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="pill">
            <Film className="size-3.5 text-accent" aria-hidden />
            {videos} video
          </span>
          <span className="pill">
            <ImageIcon className="size-3.5 text-accent-2" aria-hidden />
            {images} gambar
          </span>
          <span className="pill">
            <Layers className="size-3.5 text-accent-strong" aria-hidden />
            {formatTokens(tokensUsed)} token
          </span>
        </div>
      </header>

      <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <div className="xl:sticky xl:top-20 xl:self-start">
          <GeneratorPanel
            mediaType={mediaType}
            onMediaTypeChange={handleMediaTypeChange}
            models={activeModels}
            model={model}
            onModelChange={handleModelChange}
            durationSec={effectiveDuration}
            onDurationChange={setDurationSec}
            resolution={effectiveResolution}
            onResolutionChange={setResolution}
            aspectRatio={effectiveAspect}
            onAspectRatioChange={setAspectRatio}
            referenceFile={referenceFile}
            onReferenceChange={setReferenceFile}
            balance={balance}
            tokenValueRupiah={config?.pricing.tokenValueRupiah ?? 500}
            onError={(message) => pushToast("error", message)}
            disabled={generating}
          />
        </div>

        <div className="flex flex-col gap-4">
          <PlanCanvas
            rawPrompt={rawPrompt}
            onRawPromptChange={setRawPrompt}
            plannedPrompt={plannedPrompt}
            onPlannedPromptChange={setPlannedPrompt}
            direction={direction}
            negativePrompt={negativePrompt}
            onNegativePromptChange={setNegativePrompt}
            planState={planMutation.isPending ? "planning" : planReady ? "ready" : "idle"}
            onPlan={handlePlan}
            planCost={planCost}
            freePlanRemaining={session?.workspace.freePlanRemaining ?? 0}
            model={model}
            durationSec={effectiveDuration}
            resolution={effectiveResolution}
            aspectRatio={effectiveAspect}
            balance={balance}
            tokenValueRupiah={config?.pricing.tokenValueRupiah ?? 500}
            onGenerate={() => void handleGenerate()}
            generating={generating || uploadReference.isPending || generateMutation.isPending}
            simulateFailure={simulateFailure}
            onSimulateFailureChange={setSimulateFailure}
            canGenerate={canGenerate}
            activeStatus={activeStatus}
            showSimulation={config?.features.simulation ?? false}
          />

          <HistoryPanel
            generations={folderGenerations}
            activeJobId={activeGenerationId}
            onOpen={setDetailTarget}
            onDownload={handleDownload}
            onRemix={handleRemix}
            onDelete={setDeleteTarget}
          />
        </div>
      </div>

      <Dialog
        open={Boolean(detailTarget)}
        title="Detail generasi"
        description={
          detailTarget
            ? `${detailTarget.modelName} · ${STATUS_LABEL[detailTarget.status]} · ${formatRelative(detailTarget.createdAt)}`
            : undefined
        }
        onClose={() => setDetailTarget(null)}
        widthClassName="max-w-3xl"
        footer={
          detailTarget ? (
            <>
              <Button variant="ghost" onClick={() => setDetailTarget(null)}>
                Tutup
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleDownload(detailTarget)}
                disabled={detailTarget.status !== "COMPLETED" || !detailTarget.outputUrl}
              >
                Unduh hasil
              </Button>
              <Button variant="primary" onClick={() => handleRemix(detailTarget)}>
                Remix plan
              </Button>
            </>
          ) : null
        }
      >
        {detailTarget ? (
          <div className="flex flex-col gap-4">
            {detailTarget.status === "COMPLETED" && detailTarget.outputUrl ? (
              isVideoUrl(detailTarget.outputUrl) ? (
                <video
                  controls
                  src={detailTarget.outputUrl}
                  className="aspect-video w-full rounded-2xl bg-ink"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={detailTarget.outputUrl}
                  alt={detailTarget.modelName}
                  className="aspect-video w-full rounded-2xl border border-border object-cover"
                />
              )
            ) : detailTarget.status === "COMPLETED" ? (
              <GradientArt variant="sunset" className="aspect-video w-full" rounded="rounded-2xl">
                <div className="relative z-10 flex h-full items-center justify-center">
                  <span className="flex size-14 items-center justify-center rounded-full border border-white/30 bg-white/15 text-white backdrop-blur">
                    {detailTarget.mediaType === "VIDEO" ? (
                      <Film className="size-6" aria-hidden />
                    ) : (
                      <ImageIcon className="size-6" aria-hidden />
                    )}
                  </span>
                </div>
              </GradientArt>
            ) : (
              <div className="flex aspect-video items-center justify-center rounded-2xl border border-dashed border-border bg-surface-2/50 text-sm text-muted">
                {detailTarget.status === "FAILED"
                  ? detailTarget.errorMessage
                  : "Render masih berjalan. Hasil akan muncul di sini."}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { label: "Model", value: detailTarget.modelName },
                {
                  label: "Durasi",
                  value:
                    detailTarget.mediaType === "VIDEO"
                      ? `${detailTarget.selectedParams.durationSec ?? "—"}s`
                      : "Gambar",
                },
                { label: "Resolusi", value: detailTarget.selectedParams.resolution },
                { label: "Rasio", value: detailTarget.selectedParams.aspectRatio },
                { label: "Token", value: `${formatTokens(detailTarget.tokensCharged)} token` },
                { label: "Status", value: STATUS_LABEL[detailTarget.status] },
                { label: "Dibuat", value: formatDateTime(detailTarget.createdAt) },
                { label: "Selesai", value: formatDateTime(detailTarget.completedAt) },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-border bg-surface-2/50 px-3 py-2">
                  <p className="mono-label text-[8px] text-muted">{item.label}</p>
                  <p className="mt-0.5 truncate text-xs font-medium text-ink">{item.value}</p>
                </div>
              ))}
            </div>

            <div>
              <p className="mono-label text-muted">Raw prompt</p>
              <p className="mt-1.5 whitespace-pre-wrap rounded-xl border border-border bg-surface-2/50 p-3 text-xs leading-relaxed text-ink">
                {detailTarget.rawPrompt}
              </p>
            </div>

            <div>
              <p className="mono-label text-muted">Plan prompt</p>
              <p className="mt-1.5 whitespace-pre-wrap rounded-xl border border-accent-2/20 bg-accent-2-soft/40 p-3 font-mono text-[11px] leading-relaxed text-ink">
                {detailTarget.plannedPrompt}
              </p>
            </div>

            {detailTarget.referenceImageUrl ? (
              <p className="text-[11px] text-muted">
                Referensi: <span className="font-mono text-ink">{detailTarget.referenceImageUrl}</span>
              </p>
            ) : null}
          </div>
        ) : null}
      </Dialog>

      <Dialog
        open={Boolean(deleteTarget)}
        title="Hapus riwayat render?"
        description="Entri riwayat akan dihapus dari folder proyek."
        onClose={() => setDeleteTarget(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Batal
            </Button>
            <Button variant="danger" loading={deleteGeneration.isPending} onClick={handleDelete}>
              Hapus
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">
          <span className="font-medium text-ink">{deleteTarget?.modelName}</span> ·{" "}
          {deleteTarget ? formatRelative(deleteTarget.createdAt) : ""}
        </p>
      </Dialog>
    </div>
  );
}
