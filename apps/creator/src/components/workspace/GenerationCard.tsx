"use client";

import {
  Download,
  Eye,
  Image as ImageIcon,
  Play,
  RefreshCw,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";

import { GradientArt, type GradientVariant } from "@rupakarsa/shared/brand";
import { formatRelative, formatTokens } from "@rupakarsa/shared/lib/format";
import type { Generation } from "@rupakarsa/shared/lib/types";

const STATUS_STYLES: Record<Generation["status"], string> = {
  QUEUED: "bg-warning/10 text-warning",
  RENDERING: "bg-accent/10 text-accent-strong",
  COMPLETED: "bg-success/10 text-success",
  FAILED: "bg-danger/10 text-danger",
};

const STATUS_LABELS: Record<Generation["status"], string> = {
  QUEUED: "Queued",
  RENDERING: "Rendering",
  COMPLETED: "Completed",
  FAILED: "Failed",
};

const VARIANTS: GradientVariant[] = ["sunset", "violet", "lime", "ocean", "peach", "sand", "night"];

function variantFor(generation: Generation): GradientVariant {
  const key = generation.outputUrl?.replace("gradient:", "");
  if (key && VARIANTS.includes(key as GradientVariant)) return key as GradientVariant;
  return generation.mediaType === "VIDEO" ? "sunset" : "violet";
}

export function GenerationCard({
  generation,
  onOpen,
  onDownload,
  onRemix,
  onDelete,
  active,
}: {
  generation: Generation;
  onOpen: () => void;
  onDownload: () => void;
  onRemix: () => void;
  onDelete: () => void;
  active: boolean;
}) {
  const completed = generation.status === "COMPLETED";
  const failed = generation.status === "FAILED";
  const busy = generation.status === "QUEUED" || generation.status === "RENDERING";

  return (
    <article
      className={`group flex gap-3 rounded-2xl border bg-white p-2.5 transition-all ${
        active ? "border-accent/50 shadow-[0_0_0_3px_rgba(240,78,35,0.08)]" : "border-border hover:border-ink/20"
      }`}
    >
      <button
        type="button"
        onClick={onOpen}
        className="relative w-28 shrink-0 overflow-hidden rounded-xl sm:w-32"
        aria-label={`Lihat detail ${generation.modelName}`}
      >
        {completed ? (
          <GradientArt variant={variantFor(generation)} rounded="rounded-xl" className="aspect-[4/3] w-full">
            <div className="relative z-10 flex h-full items-center justify-center">
              <span className="flex size-8 items-center justify-center rounded-full border border-white/30 bg-white/15 text-white backdrop-blur transition-transform group-hover:scale-110">
                {generation.mediaType === "VIDEO" ? (
                  <Play className="ml-0.5 size-3.5 fill-white" aria-hidden />
                ) : (
                  <ImageIcon className="size-3.5" aria-hidden />
                )}
              </span>
            </div>
          </GradientArt>
        ) : busy ? (
          <div className="flex aspect-[4/3] w-full items-center justify-center rounded-xl bg-canvas-2">
            <RefreshCw className="size-5 animate-spin text-accent" aria-hidden />
          </div>
        ) : (
          <div className="flex aspect-[4/3] w-full items-center justify-center rounded-xl bg-danger/5">
            <X className="size-5 text-danger" aria-hidden />
          </div>
        )}
      </button>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-ink">{generation.modelName}</p>
            <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-muted">
              {generation.rawPrompt}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-medium ${STATUS_STYLES[generation.status]}`}
          >
            {STATUS_LABELS[generation.status]}
          </span>
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[9px] text-muted">
          {generation.mediaType === "VIDEO" ? (
            <span>{generation.selectedParams.durationSec ?? "—"}s</span>
          ) : (
            <span>Gambar</span>
          )}
          <span>·</span>
          <span>{generation.selectedParams.resolution}</span>
          <span>·</span>
          <span>{generation.selectedParams.aspectRatio}</span>
          <span>·</span>
          <span>{formatTokens(generation.tokensCharged)} token</span>
        </div>

        {failed ? (
          <p className="mt-1.5 line-clamp-2 text-[10px] leading-relaxed text-danger">
            {generation.errorMessage}
            {generation.refunded ? " · Token dikembalikan." : ""}
          </p>
        ) : (
          <p className="mt-1.5 text-[9px] text-muted/70">{formatRelative(generation.createdAt)}</p>
        )}

        <div className="mt-auto flex items-center gap-0.5 pt-1.5">
          <button
            type="button"
            onClick={onOpen}
            aria-label="Lihat detail"
            className="flex size-7 items-center justify-center rounded-full text-muted transition-colors hover:bg-canvas-2 hover:text-ink"
          >
            <Eye className="size-3.5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={onDownload}
            disabled={!completed}
            aria-label="Unduh hasil"
            className="flex size-7 items-center justify-center rounded-full text-muted transition-colors hover:bg-canvas-2 hover:text-ink disabled:opacity-30"
          >
            <Download className="size-3.5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={onRemix}
            aria-label="Gunakan ulang plan"
            className="flex size-7 items-center justify-center rounded-full text-muted transition-colors hover:bg-canvas-2 hover:text-ink"
          >
            <RotateCcw className="size-3.5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label="Hapus riwayat"
            className="ml-auto flex size-7 items-center justify-center rounded-full text-muted transition-colors hover:bg-danger/5 hover:text-danger"
          >
            <Trash2 className="size-3.5" aria-hidden />
          </button>
        </div>
      </div>
    </article>
  );
}
