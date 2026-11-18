"use client";

import { ArrowLeft, Film, Image as ImageIcon, Layers, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { GradientArt } from "@rupakarsa/shared/brand";
import { usePublicConfigQuery, useSessionQuery } from "@rupakarsa/shared/hooks/use-session";
import {
  useCreatorModelsQuery,
  useDeleteGenerationMutation,
  useFolderContextsQuery,
  useFolderGenerationsQuery,
  useFoldersQuery,
  useGenerateMutation,
  useGenerationQuery,
  usePlanMutation,
  useUploadReferenceMutation,
} from "@rupakarsa/shared/hooks/use-projects";
import { queryKeys } from "@rupakarsa/shared/lib/api/keys";
import { formatDateTime, formatRelative, formatTokens } from "@rupakarsa/shared/lib/format";
import { mediaGates } from "@rupakarsa/shared/lib/inputs";
import { pickModel } from "@rupakarsa/shared/lib/models";
import { effectivePromptLimit } from "@rupakarsa/shared/lib/prompt";
import type { Generation, GenerationStatus, MediaCapability, MediaType } from "@rupakarsa/shared/lib/types";
import { useUiStore } from "@rupakarsa/shared/stores/ui-store";
import { Button } from "@rupakarsa/shared/ui";
import { Dialog } from "@rupakarsa/shared/ui";

import { GeneratorPanel } from "@/components/workspace/GeneratorPanel";
import { GenerationMediaPreview } from "@/components/workspace/GenerationMediaPreview";
import { HistoryPanel } from "@/components/workspace/HistoryPanel";
import { PlanCanvas } from "@/components/workspace/PlanCanvas";
import { PreContextPanel } from "@/components/workspace/PreContextPanel";
import { useMorphToBell } from "@/components/workspace/useMorphToBell";
import type { ReferenceFile } from "@/components/workspace/AssetDropzone";

const STATUS_LABEL: Record<GenerationStatus, string> = {
  QUEUED: "Queued",
  RENDERING: "Rendering",
  COMPLETED: "Completed",
  FAILED: "Failed",
};

const PLAN_MODE_KEY = "rupakarsa.planMode";
const CONTINUE_SCENE_KEY = "rupakarsa.continueScene";

function readPlanMode(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(PLAN_MODE_KEY) !== "false";
}

function readContinueScene(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(CONTINUE_SCENE_KEY) !== "false";
}

export function StudioView({ folderId }: { folderId: string }) {
  const sessionQuery = useSessionQuery();
  const foldersQuery = useFoldersQuery();
  const generationsQuery = useFolderGenerationsQuery(folderId);
  const modelsQuery = useCreatorModelsQuery();
  const configQuery = usePublicConfigQuery();
  const contextsQuery = useFolderContextsQuery(folderId);

  const planMutation = usePlanMutation();
  const generateMutation = useGenerateMutation();
  const uploadReference = useUploadReferenceMutation();
  const deleteGeneration = useDeleteGenerationMutation();
  const pushToast = useUiStore((state) => state.pushToast);
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const deepLinkGenerationId = searchParams.get("generation");

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
  const [planMode, setPlanMode] = useState<boolean>(readPlanMode);
  const [continueFromPrevious, setContinueFromPrevious] = useState<boolean>(readContinueScene);
  const [attachments, setAttachments] = useState<ReferenceFile[]>([]);
  const [analysisText, setAnalysisText] = useState("");
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [activeGenerationId, setActiveGenerationId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Generation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Generation | null>(null);
  const [completedFlash, setCompletedFlash] = useState(false);

  const handledStatusRef = useRef<string | null>(null);
  const uploadedKeysRef = useRef<Map<File, string>>(new Map());

  const session = sessionQuery.data;
  const folder = (foldersQuery.data ?? []).find((item) => item.id === folderId) ?? null;
  const models = useMemo(() => modelsQuery.data ?? [], [modelsQuery.data]);
  const config = configQuery.data;

  const planModelCapabilities: MediaCapability[] = config?.planModel?.inputCapabilities ?? [];
  const gates = mediaGates(config, planMode);
  const allowImageAnalysis = gates.analysisImage;
  const allowVideoAnalysis = gates.analysisVideo;
  const allowImage = gates.attachmentImage;
  const allowVideo = gates.attachmentVideo;
  const planModelMissing = config ? config.planModel === null : false;

  const activeModels = useMemo(
    () => models.filter((item) => item.isActive && item.mediaType === mediaType),
    [models, mediaType],
  );
  const model = pickModel(models, mediaType, modelId);

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
    if (current.status === "COMPLETED") setCompletedFlash(true);
    void queryClient.invalidateQueries({ queryKey: queryKeys.generations(folderId) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.folders });
    void queryClient.invalidateQueries({ queryKey: queryKeys.session });
    void queryClient.invalidateQueries({ queryKey: queryKeys.storage });
    pushToast(
      current.status === "COMPLETED" ? "success" : "error",
      current.status === "COMPLETED"
        ? "Render selesai. Hasil tersimpan di folder proyek."
        : "Render gagal. Token dikembalikan otomatis.",
    );
  }, [activeGeneration, activeGenerationId, folderId, pushToast, queryClient]);

  /** The 100% state is a two-second confirmation, never a permanent second progress bar. */
  useEffect(() => {
    if (!completedFlash) return;
    const timer = setTimeout(() => setCompletedFlash(false), 2000);
    return () => clearTimeout(timer);
  }, [completedFlash]);

  /**
   * The bell links to `/app/projects/<folder>?generation=<id>`. The query is the source of truth
   * while it is present, so the dialog opens without a state write inside an effect; closing it
   * rewrites the URL.
   */
  const detailTarget =
    detail ??
    (deepLinkGenerationId
      ? (folderGenerations.find((row) => row.id === deepLinkGenerationId) ?? null)
      : null);

  /** Closing always drops the query too, so the dialog cannot reopen from the URL. */
  function closeDetail(): void {
    setDetail(null);
    if (deepLinkGenerationId) router.replace(`/app/projects/${folderId}`);
  }

  useMorphToBell(
    activeGeneration && generating
      ? { id: activeGeneration.id, label: activeGeneration.modelName }
      : null,
  );

  const planCost = useMemo(() => {
    const freePlanRemaining = session?.workspace.freePlanRemaining ?? 0;
    if (freePlanRemaining > 0) return { tokens: 0, usesFreeQuota: true };
    return { tokens: config?.pricing.planModeTokenCost ?? 1, usesFreeQuota: false };
  }, [session?.workspace.freePlanRemaining, config?.pricing.planModeTokenCost]);

  const balance = session?.workspace.tokenBalance ?? 0;
  const hasPrompt = planMode ? plannedPrompt.trim().length > 0 : rawPrompt.trim().length > 0;
  const canGenerate = Boolean(hasPrompt && model && !generating && balance >= (model?.tokenCost ?? 0));

  const promptLimitChars = config?.limits.planPromptMaxChars ?? 2000;
  const renderPromptLimit = effectivePromptLimit(model, config?.limits.finalPromptMaxChars ?? 4000);
  const compressing = generateMutation.isPending || planMutation.isPending;

  const videos = folderGenerations.filter((item) => item.mediaType === "VIDEO").length;
  const images = folderGenerations.filter((item) => item.mediaType === "IMAGE").length;
  const tokensUsed = folderGenerations.reduce((total, item) => total + item.tokensCharged, 0);
  const contexts = contextsQuery.data ?? [];
  const contextIds = contexts.filter((item) => item.isActive).map((item) => item.id);

  function allowedAttachment(item: ReferenceFile): boolean {
    return item.kind === "VIDEO" ? allowVideo : allowImage;
  }

  function resetDraft(): void {
    setPlanReady(false);
    setPlannedPrompt("");
    setAnalysisText("");
  }

  function handleMediaTypeChange(next: MediaType): void {
    setMediaType(next);
    setModelId("");
    setDurationSec(undefined);
    setResolution("");
    setAspectRatio("");
    resetDraft();
  }

  function handleModelChange(id: string): void {
    setModelId(id);
    setDurationSec(undefined);
    setResolution("");
    setAspectRatio("");
    resetDraft();
  }

  function handleContinueChange(next: boolean): void {
    setContinueFromPrevious(next);
    window.localStorage.setItem(CONTINUE_SCENE_KEY, String(next));
  }

  function handlePlanModeChange(next: boolean): void {
    setPlanMode(next);
    window.localStorage.setItem(PLAN_MODE_KEY, String(next));
    resetDraft();
  }

  function handleAttachmentsChange(next: ReferenceFile[]): void {
    setAttachments(next.filter(allowedAttachment));
  }

  async function uploadAll(): Promise<{ keys: string[]; ids: string[] }> {
    const keys: string[] = [];
    const ids: string[] = [];
    for (const item of attachments) {
      const cached = uploadedKeysRef.current.get(item.file);
      if (cached) {
        keys.push(cached);
        continue;
      }
      const uploaded = await uploadReference.mutateAsync(item.file);
      uploadedKeysRef.current.set(item.file, uploaded.key);
      keys.push(uploaded.key);
      ids.push(uploaded.id);
    }
    return { keys, ids };
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

    void (async () => {
      try {
        const { keys } = await uploadAll();
        planMutation.mutate(
          {
            folderId,
            modelId: model.id,
            rawPrompt,
            durationSec: model.mediaType === "VIDEO" ? effectiveDuration : undefined,
            resolution: effectiveResolution,
            aspectRatio: effectiveAspect,
            attachmentKeys: keys,
            contextIds,
            continueFromPrevious,
          },
          {
            onSuccess: (data) => {
              setPlannedPrompt(data.blueprint.prompt);
              setDirection(data.blueprint.direction);
              setNegativePrompt(data.blueprint.negativePrompt);
              setAnalysisText(
                data.analysis.attachments.map((entry) => entry.text).join("\n\n"),
              );
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
      } catch (error) {
        pushToast("error", error instanceof Error ? error.message : "Unggahan lampiran gagal.");
      }
    })();
  }

  async function handleGenerate(): Promise<void> {
    if (!model) return;
    if (planMode && !plannedPrompt.trim()) {
      pushToast("error", "Buat plan terlebih dahulu.");
      return;
    }
    if (!planMode && !rawPrompt.trim()) {
      pushToast("error", "Tulis brief terlebih dahulu.");
      return;
    }
    if (balance < model.tokenCost) {
      pushToast("error", "Saldo token tidak cukup. Hubungi Superadmin untuk top-up.");
      return;
    }
    if (generating) return;

    try {
      const { keys } = await uploadAll();
      const created = await generateMutation.mutateAsync({
        folderId,
        modelId: model.id,
        rawPrompt: rawPrompt.trim(),
        planMode,
        finalPrompt: planMode ? plannedPrompt.trim() : null,
        attachmentKeys: keys,
        contextIds,
        continueFromPrevious,
        selectedParams: {
          durationSec: model.mediaType === "VIDEO" ? effectiveDuration : undefined,
          resolution: effectiveResolution,
          aspectRatio: effectiveAspect,
        },
      });

      handledStatusRef.current = null;
      setCompletedFlash(false);
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
    setAnalysisText(generation.analysisSnapshot);
    setPlanReady(true);
    closeDetail();
    document.getElementById("plan-canvas")?.scrollIntoView({ behavior: "smooth", block: "start" });
    pushToast("info", "Plan dimuat ulang ke canvas.");
  }

  function handleDownload(generation: Generation): void {
    if (!generation.outputUrl || generation.outputPurgedAt) {
      pushToast("error", "Hasil render sudah tidak tersedia.");
      return;
    }
    const link = document.createElement("a");
    link.href = `${generation.outputUrl}${generation.outputUrl.includes("?") ? "&" : "?"}download=1`;
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
          closeDetail();
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

      {planModelMissing ? (
        <div className="mt-4 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-[11px] leading-relaxed text-ink">
          Model plan belum disetel. Setel di CMS → Settings → AI. Plan mode membutuhkannya; mode
          langsung tetap {allowImageAnalysis || allowVideoAnalysis
            ? "menganalisis lampiran lewat model analisis"
            : "merender brief tanpa analisis lampiran"}.
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <div className="flex flex-col gap-4 xl:sticky xl:top-20 xl:self-start">
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
            attachments={attachments}
            onAttachmentsChange={handleAttachmentsChange}
            allowImage={allowImage}
            allowVideo={allowVideo}
            attachmentGate={planMode ? "plan" : "analysis"}
            balance={balance}
            tokenValueRupiah={config?.pricing.tokenValueRupiah ?? 500}
            onError={(message) => pushToast("error", message)}
            disabled={generating}
          />

          <PreContextPanel
            folderId={folderId}
            contexts={contexts}
            generations={folderGenerations}
            continueFromPrevious={continueFromPrevious}
            onContinueChange={handleContinueChange}
            disabled={generating}
            allowImageAnalysis={allowImageAnalysis}
            allowVideoAnalysis={allowVideoAnalysis}
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
            planMode={planMode}
            onPlanModeChange={handlePlanModeChange}
            analysisText={analysisText}
            planModelCapabilities={planModelCapabilities}
            planModelName={config?.planModel?.name ?? null}
            promptLimitChars={promptLimitChars}
            renderPromptLimit={renderPromptLimit}
            compressing={compressing}
            progressPercent={generating ? (activeGeneration?.progressPercent ?? 0) : null}
            estimateMs={activeGeneration?.estimateMs ?? null}
            completedFlash={completedFlash}
          />

          <HistoryPanel
            generations={folderGenerations}
            activeJobId={activeGenerationId}
            activeGeneration={activeGeneration}
            onOpen={setDetail}
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
        onClose={closeDetail}
        widthClassName="max-w-3xl"
        footer={
          detailTarget ? (
            <>
              <Button variant="ghost" onClick={closeDetail}>
                Tutup
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleDownload(detailTarget)}
                disabled={
                  detailTarget.status !== "COMPLETED" ||
                  !detailTarget.outputUrl ||
                  Boolean(detailTarget.outputPurgedAt)
                }
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
            {detailTarget.outputPurgedAt ? (
              <div className="flex aspect-video items-center justify-center rounded-2xl border border-dashed border-border bg-surface-2/50 text-center text-sm text-muted">
                Hasil dibersihkan setelah masa retensi penyimpanan.
              </div>
            ) : detailTarget.status === "COMPLETED" && detailTarget.outputUrl ? (
              <GenerationMediaPreview
                url={detailTarget.outputUrl}
                mediaType={detailTarget.mediaType}
                mime={detailTarget.outputMime}
                label={detailTarget.modelName}
                controls
                className="aspect-video w-full rounded-2xl bg-ink object-cover"
              />
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

            {detailTarget.promptCompressed ? (
              <p className="rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-[11px] leading-relaxed text-ink">
                Prompt dimampatkan ke {formatTokens(detailTarget.promptLimitChars ?? 0)} karakter.
              </p>
            ) : null}

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

            {detailTarget.analysisSnapshot ? (
              <div>
                <p className="mono-label text-muted">Analisis lampiran</p>
                <p className="mt-1.5 max-h-40 overflow-y-auto whitespace-pre-wrap rounded-xl border border-border bg-surface-2/50 p-3 font-mono text-[11px] leading-relaxed text-ink">
                  {detailTarget.analysisSnapshot}
                </p>
              </div>
            ) : null}

            {detailTarget.preContextSnapshot ? (
              <div>
                <p className="mono-label text-muted">Pre-context</p>
                <p className="mt-1.5 max-h-40 overflow-y-auto whitespace-pre-wrap rounded-xl border border-border bg-surface-2/50 p-3 text-[11px] leading-relaxed text-ink">
                  {detailTarget.preContextSnapshot}
                </p>
              </div>
            ) : null}

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
