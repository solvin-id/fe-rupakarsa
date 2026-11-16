"use client";

import {
  ArrowRight,
  Check,
  CircleDollarSign,
  Loader2,
  Sparkles,
  Wand2,
} from "lucide-react";

import { Button } from "@rupakarsa/shared/ui";
import { TextArea } from "@rupakarsa/shared/ui";
import { formatRupiahFromTokens, formatTokens } from "@rupakarsa/shared/lib/format";
import type { PlanCost } from "@rupakarsa/shared/lib/tokens";
import type { AiModel, GenerationStatus } from "@rupakarsa/shared/lib/types";

export interface PlanCanvasProps {
  rawPrompt: string;
  onRawPromptChange: (value: string) => void;
  plannedPrompt: string;
  onPlannedPromptChange: (value: string) => void;
  direction: string;
  negativePrompt: string;
  onNegativePromptChange: (value: string) => void;
  planState: "idle" | "planning" | "ready";
  onPlan: () => void;
  planCost: PlanCost;
  freePlanRemaining: number;
  model: AiModel | null;
  durationSec: number | undefined;
  resolution: string;
  aspectRatio: string;
  balance: number;
  tokenValueRupiah: number;
  onGenerate: () => void;
  generating: boolean;
  simulateFailure: boolean;
  onSimulateFailureChange: (value: boolean) => void;
  canGenerate: boolean;
  activeStatus: GenerationStatus | null;
  showSimulation: boolean;
}

const STATUS_LABEL: Record<GenerationStatus, string> = {
  QUEUED: "Queued — menunggu worker",
  RENDERING: "Rendering di provider",
  COMPLETED: "Render selesai",
  FAILED: "Render gagal",
};

export function PlanCanvas({
  rawPrompt,
  onRawPromptChange,
  plannedPrompt,
  onPlannedPromptChange,
  direction,
  negativePrompt,
  onNegativePromptChange,
  planState,
  onPlan,
  planCost,
  freePlanRemaining,
  model,
  durationSec,
  resolution,
  aspectRatio,
  balance,
  tokenValueRupiah,
  onGenerate,
  generating,
  simulateFailure,
  onSimulateFailureChange,
  canGenerate,
  activeStatus,
  showSimulation,
}: PlanCanvasProps) {
  const cost = model?.tokenCost ?? 0;
  const projected = Math.max(0, balance - cost);
  const planLabel = planCost.usesFreeQuota
    ? `Gratis · ${formatTokens(freePlanRemaining)} tersisa`
    : `${planCost.tokens} token`;

  return (
    <section id="plan-canvas" className="card overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
        <div>
          <p className="mono-label text-muted">Dual-mode prompt</p>
          <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-ink">Plan Canvas</h2>
        </div>
        <div className="flex items-center gap-1.5 text-[10px]">
          <span
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 ${
              planState === "ready"
                ? "bg-success/10 text-success"
                : "bg-ink text-canvas"
            }`}
          >
            {planState === "ready" ? (
              <Check className="size-3" aria-hidden />
            ) : (
              <span className="font-mono">1</span>
            )}
            <span>Plan</span>
          </span>
          <span className="h-px w-4 bg-border" aria-hidden />
          <span
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 ${
              generating ? "bg-accent text-white" : "bg-surface-2 text-muted"
            }`}
          >
            <span className="font-mono">2</span>
            <span>Implement</span>
          </span>
        </div>
      </header>

      <div className="p-5 sm:p-6">
        <div>
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="raw-prompt" className="mono-label text-muted">
              Brief mentah
            </label>
            <span className="text-[10px] text-muted">{rawPrompt.length}/2000</span>
          </div>
          <TextArea
            id="raw-prompt"
            rows={4}
            maxLength={2000}
            value={rawPrompt}
            onChange={(event) => onRawPromptChange(event.target.value)}
            placeholder="Contoh: Mbok Srini berjalan di lorong penjara batu, membawa lentera, bayangan jeruji jatuh di wajahnya. Suasana dingin, tegang, tapi ada kelembutan."
            className="mt-1.5 min-h-28 bg-surface-2/50 text-[13px] leading-relaxed"
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[10px] text-muted">
            {model ? `${model.displayName} · ${resolution} · ${aspectRatio}` : "Pilih model"}
            {durationSec ? ` · ${durationSec}s` : ""}
          </p>
          <Button
            variant="dark"
            size="sm"
            loading={planState === "planning"}
            disabled={!rawPrompt.trim() || planState === "planning" || !model}
            icon={<Wand2 className="size-3.5" aria-hidden />}
            onClick={onPlan}
          >
            Buat Plan (DeepSeek AI)
          </Button>
        </div>

        <div className="mt-2 flex items-center justify-end gap-1.5 text-[10px] text-muted">
          <Sparkles className="size-3 text-accent" aria-hidden />
          Biaya plan: <span className="font-medium text-ink">{planLabel}</span>
        </div>

        {planState === "planning" ? (
          <div className="mt-4 rounded-2xl border border-accent-2/20 bg-accent-2-soft/50 p-4">
            <div className="flex items-center gap-2 text-xs text-accent-2">
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
              DeepSeek-V3 sedang menyusun blueprint…
            </div>
            <div className="mt-3 space-y-2">
              <div className="h-2 w-full animate-pulse rounded-full bg-accent-2/20" />
              <div className="h-2 w-4/5 animate-pulse rounded-full bg-accent-2/20" />
              <div className="h-2 w-3/5 animate-pulse rounded-full bg-accent-2/20" />
            </div>
          </div>
        ) : null}

        {planState === "ready" ? (
          <div className="mt-4 rounded-2xl border border-accent-2/20 bg-accent-2-soft/40 p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="mono-label text-[9px] text-accent-2">Plan blueprint</p>
              <span className="flex items-center gap-1 text-[10px] text-success">
                <Check className="size-3" aria-hidden />
                Bisa diedit
              </span>
            </div>
            <TextArea
              aria-label="Plan blueprint"
              rows={8}
              value={plannedPrompt}
              onChange={(event) => onPlannedPromptChange(event.target.value)}
              className="mt-2 min-h-40 border-accent-2/20 bg-white/80 font-mono text-[11px] leading-relaxed"
            />
            {direction ? (
              <p className="mt-2 text-[10px] leading-relaxed text-muted">{direction}</p>
            ) : null}
            <details className="mt-2">
              <summary className="cursor-pointer text-[10px] font-medium text-muted hover:text-ink">
                Negative prompt
              </summary>
              <TextArea
                aria-label="Negative prompt"
                rows={2}
                value={negativePrompt}
                onChange={(event) => onNegativePromptChange(event.target.value)}
                className="mt-1.5 min-h-16 bg-white/80 text-[11px]"
              />
            </details>
          </div>
        ) : null}

        <div className="mt-5 rounded-2xl bg-ink p-4 text-canvas sm:p-5">
          <div className="flex items-center justify-between">
            <p className="mono-label text-[9px] text-canvas/50">Implement Mode</p>
            <CircleDollarSign className="size-4 text-accent-3" aria-hidden />
          </div>

          <div className="mt-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-3xl font-semibold tracking-[-0.04em] text-canvas">
                {formatTokens(cost)}
              </p>
              <p className="text-[10px] text-canvas/50">
                token · {formatRupiahFromTokens(cost, tokenValueRupiah)}
              </p>
            </div>
            <div className="text-right text-[11px] text-canvas/60">
              Saldo {formatTokens(balance)}
              <br />
              <span className="text-canvas">Sisa {formatTokens(projected)}</span>
            </div>
          </div>

          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent to-accent-3"
              style={{ width: `${Math.min(100, cost > 0 ? (cost / Math.max(balance, cost)) * 100 : 0)}%` }}
            />
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            {[
              { label: "Hold", value: formatTokens(cost) },
              { label: "Commit", value: formatTokens(cost) },
              { label: "Refund", value: "0" },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-white/10 bg-white/[0.03] px-2 py-2">
                <p className="mono-label text-[8px] text-canvas/40">{item.label}</p>
                <p className="mt-0.5 text-xs font-medium text-canvas">{item.value}</p>
              </div>
            ))}
          </div>

          {generating ? (
            <div className="mt-4 rounded-xl border border-accent/25 bg-accent/10 px-3 py-2.5">
              <div className="flex items-center gap-2 text-xs text-accent">
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
                {activeStatus ? STATUS_LABEL[activeStatus] : "Mengirim job…"}
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-2/3 animate-pulse rounded-full bg-accent" />
              </div>
            </div>
          ) : null}

          <Button
            variant="primary"
            size="lg"
            className="mt-4 w-full"
            disabled={!canGenerate || generating}
            loading={generating}
            icon={<ArrowRight className="size-4" aria-hidden />}
            onClick={onGenerate}
          >
            Generate konten
          </Button>

          {showSimulation ? (
            <label className="mt-3 flex items-center justify-center gap-2 text-[10px] text-canvas/50">
              <input
                type="checkbox"
                checked={simulateFailure}
                onChange={(event) => onSimulateFailureChange(event.target.checked)}
                className="size-3 accent-[#f04e23]"
              />
              Simulasikan gagal untuk menguji auto-refund
            </label>
          ) : null}
        </div>
      </div>
    </section>
  );
}
