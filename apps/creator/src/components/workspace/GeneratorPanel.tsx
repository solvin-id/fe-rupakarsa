"use client";

import { CircleDollarSign, Film, Image as ImageIcon, Info, Sparkles } from "lucide-react";

import { AttachmentTray } from "@/components/workspace/AttachmentTray";
import type { ReferenceFile } from "@/components/workspace/AssetDropzone";
import { formatRupiahFromTokens, formatTokens } from "@rupakarsa/shared/lib/format";
import { tokenCapacity } from "@rupakarsa/shared/lib/tokens";
import type { AiModel, MediaType } from "@rupakarsa/shared/lib/types";
import { Select } from "@rupakarsa/shared/ui";

export interface GeneratorPanelProps {
  mediaType: MediaType;
  onMediaTypeChange: (type: MediaType) => void;
  models: AiModel[];
  model: AiModel | null;
  onModelChange: (id: string) => void;
  durationSec: number | undefined;
  onDurationChange: (value: number) => void;
  resolution: string;
  onResolutionChange: (value: string) => void;
  aspectRatio: string;
  onAspectRatioChange: (value: string) => void;
  attachments: ReferenceFile[];
  onAttachmentsChange: (attachments: ReferenceFile[]) => void;
  allowImage: boolean;
  allowVideo: boolean;
  balance: number;
  tokenValueRupiah: number;
  onError: (message: string) => void;
  disabled?: boolean;
}

export function GeneratorPanel({
  mediaType,
  onMediaTypeChange,
  models,
  model,
  onModelChange,
  durationSec,
  onDurationChange,
  resolution,
  onResolutionChange,
  aspectRatio,
  onAspectRatioChange,
  attachments,
  onAttachmentsChange,
  allowImage,
  allowVideo,
  balance,
  tokenValueRupiah,
  onError,
  disabled = false,
}: GeneratorPanelProps) {
  const cost = model?.tokenCost ?? 0;
  const projected = Math.max(0, balance - cost);
  const capacity = model ? tokenCapacity(balance, cost) : 0;
  const insufficient = Boolean(model && balance < cost);

  return (
    <section className="card p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="mono-label text-muted">Generator setup</p>
          <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-ink">Siapkan render</h2>
        </div>
        <span className="flex size-9 items-center justify-center rounded-full bg-accent-soft text-accent-strong">
          <Sparkles className="size-4" aria-hidden />
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-1 rounded-full border border-border bg-surface-2/70 p-1">
        {(
          [
            { id: "VIDEO" as MediaType, label: "Video", icon: Film },
            { id: "IMAGE" as MediaType, label: "Gambar", icon: ImageIcon },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const active = mediaType === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              disabled={disabled}
              onClick={() => onMediaTypeChange(tab.id)}
              className={`flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium transition-colors ${
                active ? "bg-ink text-canvas" : "text-muted hover:text-ink"
              }`}
            >
              <Icon className="size-3.5" aria-hidden />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="mt-5">
        <label htmlFor="studio-model" className="mono-label text-muted">
          Model AI
        </label>
        <Select
          id="studio-model"
          value={model?.id ?? ""}
          disabled={disabled || models.length === 0}
          onChange={onModelChange}
          placeholder="Tidak ada model aktif"
          options={models.map((item) => ({
            value: item.id,
            label: `${item.displayName} · ${item.tokenCost} token`,
          }))}
          className="mt-1.5"
        />
        {model ? (
          <p className="mt-1.5 text-[10px] leading-relaxed text-muted">
            {model.mediaType === "VIDEO" ? "Video" : "Gambar"} · {model.allowedParams.resolutions.join(" / ")} ·{" "}
            {model.allowedParams.aspectRatios.join(" / ")}
          </p>
        ) : null}
      </div>

      {model?.allowedParams.durations && model.allowedParams.durations.length > 0 ? (
        <div className="mt-4">
          <p className="mono-label text-muted">Durasi</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {model.allowedParams.durations.map((option) => (
              <button
                key={option}
                type="button"
                disabled={disabled}
                onClick={() => onDurationChange(option)}
                className={`chip ${durationSec === option ? "chip-active" : ""}`}
              >
                {option}s
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-4">
        <p className="mono-label text-muted">Resolusi</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {model?.allowedParams.resolutions.map((option) => (
            <button
              key={option}
              type="button"
              disabled={disabled}
              onClick={() => onResolutionChange(option)}
              className={`chip ${resolution === option ? "chip-active" : ""}`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <p className="mono-label text-muted">Rasio aspek</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {model?.allowedParams.aspectRatios.map((option) => (
            <button
              key={option}
              type="button"
              disabled={disabled}
              onClick={() => onAspectRatioChange(option)}
              className={`chip ${aspectRatio === option ? "chip-active" : ""}`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <p className="mono-label text-muted">Lampiran</p>
        <p className="mt-1 text-[10px] leading-relaxed text-muted">
          Lampiran pertama dikirim ke provider render sebagai referensi visual; semuanya dibaca
          model plan sebagai konteks.
        </p>
        <div className="mt-2">
          <AttachmentTray
            attachments={attachments}
            onChange={onAttachmentsChange}
            disabled={disabled}
            allowImage={allowImage}
            allowVideo={allowVideo}
            onError={onError}
          />
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-border bg-surface-2/60 p-4">
        <div className="flex items-center justify-between">
          <p className="mono-label text-[9px] text-muted">Estimasi biaya</p>
          <CircleDollarSign className="size-4 text-accent" aria-hidden />
        </div>
        <div className="mt-2 flex items-end justify-between gap-3">
          <div>
            <p className="text-3xl font-semibold tracking-[-0.04em] text-ink">
              {formatTokens(cost)}
            </p>
            <p className="text-[10px] text-muted">
              token · {formatRupiahFromTokens(cost, tokenValueRupiah)}
            </p>
          </div>
          <div className="text-right text-[11px] text-muted">
            Saldo {formatTokens(balance)}
            <br />
            <span className={insufficient ? "text-danger" : "text-ink"}>
              Sisa {formatTokens(projected)}
            </span>
          </div>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink/10">
          <div
            className={`h-full rounded-full ${insufficient ? "bg-danger" : "bg-accent"}`}
            style={{ width: `${Math.min(100, cost > 0 ? (cost / Math.max(balance, cost)) * 100 : 0)}%` }}
          />
        </div>
        <p className="mt-2 text-[10px] text-muted">
          {insufficient
            ? "Saldo tidak cukup. Hubungi Superadmin untuk top-up."
            : `Cukup untuk ${formatTokens(capacity)} render dengan saldo saat ini.`}
        </p>
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-xl border border-border bg-white px-3 py-2.5 text-[10px] leading-relaxed text-muted">
        <Info className="mt-0.5 size-3.5 shrink-0 text-accent" aria-hidden />
        <p>
          Tulis brief di panel <span className="font-medium text-ink">Plan Canvas</span>. Plan Mode
          akan menyusun blueprint sebelum render dieksekusi.
        </p>
      </div>
    </section>
  );
}
