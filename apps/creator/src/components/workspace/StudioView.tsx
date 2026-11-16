"use client";

import { ArrowLeft, Film, Image as ImageIcon, Layers, Sparkles } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { GradientArt, type GradientVariant } from "@rupakarsa/shared/brand";
import { Button } from "@rupakarsa/shared/ui";
import { Dialog } from "@rupakarsa/shared/ui";
import { GeneratorPanel } from "@/components/workspace/GeneratorPanel";
import { HistoryPanel } from "@/components/workspace/HistoryPanel";
import { PlanCanvas } from "@/components/workspace/PlanCanvas";
import type { ReferenceFile } from "@/components/workspace/AssetDropzone";
import { downloadGenerationPoster } from "@rupakarsa/shared/lib/download";
import { formatDateTime, formatRelative, formatTokens } from "@rupakarsa/shared/lib/format";
import { buildPlanBlueprint } from "@rupakarsa/shared/lib/plan";
import { planModeCost } from "@rupakarsa/shared/lib/tokens";
import type { Generation, GenerationStatus, MediaType } from "@rupakarsa/shared/lib/types";
import { useAdminStore } from "@rupakarsa/shared/stores/admin-store";
import { useProjectStore } from "@rupakarsa/shared/stores/project-store";
import { useSessionStore } from "@rupakarsa/shared/stores/session-store";
import { useUiStore } from "@rupakarsa/shared/stores/ui-store";

const STATUS_LABEL: Record<GenerationStatus, string> = {
  QUEUED: "Queued",
  RENDERING: "Rendering",
  COMPLETED: "Completed",
  FAILED: "Failed",
};

function variantFor(generation: Generation): GradientVariant {
  const key = generation.outputUrl?.replace("gradient:", "");
  const allowed: GradientVariant[] = ["sunset", "violet", "lime", "ocean", "peach", "sand", "night"];
  if (key && allowed.includes(key as GradientVariant)) return key as GradientVariant;
  return generation.mediaType === "VIDEO" ? "sunset" : "violet";
}

export function StudioView({ folderId }: { folderId: string }) {
  const session = useSessionStore((state) => state.session);
  const adjustTokens = useSessionStore((state) => state.adjustTokens);
  const consumePlanQuota = useSessionStore((state) => state.consumePlanQuota);

  const folders = useProjectStore((state) => state.folders);
  const generations = useProjectStore((state) => state.generations);
  const addGeneration = useProjectStore((state) => state.addGeneration);
  const updateGeneration = useProjectStore((state) => state.updateGeneration);
  const deleteGeneration = useProjectStore((state) => state.deleteGeneration);
  const projectHydrated = useProjectStore((state) => state.hydrated);

  const models = useAdminStore((state) => state.models);
  const adminHydrated = useAdminStore((state) => state.hydrated);
  const pushToast = useUiStore((state) => state.pushToast);

  const [mediaType, setMediaType] = useState<MediaType>("VIDEO");
  const [modelId, setModelId] = useState("mdl_wan_10");
  const [durationSec, setDurationSec] = useState<number | undefined>(10);
  const [resolution, setResolution] = useState("1080p");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [rawPrompt, setRawPrompt] = useState("");
  const [plannedPrompt, setPlannedPrompt] = useState("");
  const [direction, setDirection] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [planState, setPlanState] = useState<"idle" | "planning" | "ready">("idle");
  const [referenceFile, setReferenceFile] = useState<ReferenceFile | null>(null);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [detailTarget, setDetailTarget] = useState<Generation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Generation | null>(null);

  const folder = folders.find(
    (item) => item.id === folderId && item.workspaceId === session?.workspace.id,
  );
  const folderGenerations = useMemo(
    () =>
      generations
        .filter(
          (item) => item.folderId === folderId && item.workspaceId === session?.workspace.id,
        )
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [generations, folderId, session?.workspace.id],
  );
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

  const planCost = planModeCost(session?.workspace.freePlanRemaining ?? 0);
  const activeGeneration = activeJobId
    ? (generations.find((item) => item.id === activeJobId) ?? null)
    : null;
  const activeStatus = activeGeneration?.status ?? null;
  const canGenerate = Boolean(
    plannedPrompt.trim() &&
      model &&
      session &&
      session.workspace.tokenBalance >= model.tokenCost &&
      !activeJobId,
  );

  const videos = folderGenerations.filter((item) => item.mediaType === "VIDEO").length;
  const images = folderGenerations.filter((item) => item.mediaType === "IMAGE").length;
  const tokensUsed = folderGenerations.reduce((total, item) => total + item.tokensCharged, 0);

  function handleMediaTypeChange(next: MediaType): void {
    setMediaType(next);
    const nextModel = models.find((item) => item.isActive && item.mediaType === next);
    if (nextModel) {
      setModelId(nextModel.id);
      setDurationSec(nextModel.allowedParams.durations?.[0]);
      setResolution(nextModel.allowedParams.resolutions[0] ?? "");
      setAspectRatio(nextModel.allowedParams.aspectRatios[0] ?? "");
    }
    setPlanState("idle");
    setPlannedPrompt("");
  }

  function handleModelChange(id: string): void {
    setModelId(id);
    const next = models.find((item) => item.id === id);
    if (next) {
      setDurationSec(next.allowedParams.durations?.[0]);
      setResolution(next.allowedParams.resolutions[0] ?? "");
      setAspectRatio(next.allowedParams.aspectRatios[0] ?? "");
    }
    setPlanState("idle");
    setPlannedPrompt("");
  }

  function handlePlan(): void {
    if (!session || !model) return;
    if (!rawPrompt.trim()) {
      pushToast("error", "Tulis brief terlebih dahulu.");
      return;
    }
    const cost = planModeCost(session.workspace.freePlanRemaining);
    if (!cost.usesFreeQuota && session.workspace.tokenBalance < cost.tokens) {
      pushToast("error", "Saldo token tidak cukup untuk Plan Mode.");
      return;
    }
    const result = consumePlanQuota();
    if (!result.usesFreeQuota && result.tokens === 0) {
      pushToast("error", "Kuota plan habis dan saldo tidak cukup.");
      return;
    }

    setPlanState("planning");
    window.setTimeout(() => {
      const blueprint = buildPlanBlueprint({
        rawPrompt,
        model,
        durationSec: effectiveDuration,
        resolution: effectiveResolution,
        aspectRatio: effectiveAspect,
        hasReference: Boolean(referenceFile),
      });
      setPlannedPrompt(blueprint.prompt);
      setDirection(blueprint.direction);
      setNegativePrompt(blueprint.negativePrompt);
      setPlanState("ready");
      pushToast(
        "success",
        result.usesFreeQuota
          ? "Plan dibuat dengan kuota gratis."
          : "Plan dibuat. 1 token terpakai.",
      );
    }, 1200);
  }

  function handleGenerate(): void {
    if (!session || !model) return;
    if (!plannedPrompt.trim()) {
      pushToast("error", "Buat plan terlebih dahulu.");
      return;
    }
    if (session.workspace.tokenBalance < model.tokenCost) {
      pushToast("error", "Saldo token tidak cukup. Hubungi Superadmin untuk top-up.");
      return;
    }
    if (activeJobId) return;

    const id = `gen_${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();
    const variant: GradientVariant =
      model.mediaType === "VIDEO" ? (model.id === "mdl_wan_5" ? "peach" : "sunset") : "violet";

    const generation: Generation = {
      id,
      workspaceId: session.workspace.id,
      folderId,
      userId: session.user.id,
      modelId: model.id,
      modelName: model.displayName,
      mediaType: model.mediaType,
      rawPrompt: rawPrompt.trim(),
      plannedPrompt: plannedPrompt.trim(),
      referenceImageUrl: referenceFile?.name ?? null,
      selectedParams: {
        durationSec: model.mediaType === "VIDEO" ? effectiveDuration : undefined,
        resolution: effectiveResolution,
        aspectRatio: effectiveAspect,
      },
      tokensCharged: model.tokenCost,
      status: "QUEUED",
      externalJobId: `hf_job_${crypto.randomUUID().slice(0, 6)}`,
      outputUrl: null,
      errorMessage: null,
      refunded: false,
      createdAt: now,
      completedAt: null,
    };

    adjustTokens(-model.tokenCost);
    addGeneration(generation);
    setActiveJobId(id);

    window.setTimeout(() => {
      updateGeneration(id, { status: "RENDERING" });
    }, 1200);

    window.setTimeout(() => {
      if (simulateFailure) {
        updateGeneration(id, {
          status: "FAILED",
          errorMessage: "Provider menolak render (simulasi). Token dikembalikan otomatis.",
          refunded: true,
          completedAt: new Date().toISOString(),
        });
        adjustTokens(model.tokenCost);
        pushToast("error", "Render gagal. Token dikembalikan otomatis.");
      } else {
        updateGeneration(id, {
          status: "COMPLETED",
          outputUrl: `gradient:${variant}`,
          completedAt: new Date().toISOString(),
        });
        pushToast("success", "Render selesai. Hasil tersimpan di folder proyek.");
      }
      setActiveJobId((current) => (current === id ? null : current));
    }, 4200);
  }

  function handleRemix(generation: Generation): void {
    setMediaType(generation.mediaType);
    setModelId(generation.modelId);
    setDurationSec(generation.selectedParams.durationSec);
    setResolution(generation.selectedParams.resolution);
    setAspectRatio(generation.selectedParams.aspectRatio);
    setRawPrompt(generation.rawPrompt);
    setPlannedPrompt(generation.plannedPrompt);
    setDirection("");
    setNegativePrompt("");
    setPlanState("ready");
    setDetailTarget(null);
    document.getElementById("plan-canvas")?.scrollIntoView({ behavior: "smooth", block: "start" });
    pushToast("info", "Plan dimuat ulang ke canvas.");
  }

  function handleDownload(generation: Generation): void {
    downloadGenerationPoster(generation);
    pushToast("info", "Poster demo diunduh. File asli tersedia setelah integrasi storage.");
  }

  function handleDelete(): void {
    if (!deleteTarget) return;
    deleteGeneration(deleteTarget.id);
    setDeleteTarget(null);
    setDetailTarget(null);
    pushToast("success", "Riwayat render dihapus.");
  }

  if (!projectHydrated || !adminHydrated) {
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
            balance={session?.workspace.tokenBalance ?? 0}
            onError={(message) => pushToast("error", message)}
            disabled={Boolean(activeJobId)}
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
            planState={planState}
            onPlan={handlePlan}
            planCost={planCost}
            freePlanRemaining={session?.workspace.freePlanRemaining ?? 0}
            model={model}
            durationSec={effectiveDuration}
            resolution={effectiveResolution}
            aspectRatio={effectiveAspect}
            balance={session?.workspace.tokenBalance ?? 0}
            onGenerate={handleGenerate}
            generating={Boolean(activeJobId)}
            simulateFailure={simulateFailure}
            onSimulateFailureChange={setSimulateFailure}
            canGenerate={canGenerate}
            activeStatus={activeStatus}
          />

          <HistoryPanel
            generations={folderGenerations}
            activeJobId={activeJobId}
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
                disabled={detailTarget.status !== "COMPLETED"}
              >
                Unduh poster
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
            {detailTarget.status === "COMPLETED" ? (
              <GradientArt
                variant={variantFor(detailTarget)}
                className="aspect-video w-full"
                rounded="rounded-2xl"
              >
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
            <Button variant="danger" onClick={handleDelete}>
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
