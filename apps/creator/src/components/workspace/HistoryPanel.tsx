"use client";

import { Film } from "lucide-react";

import { GenerationCard } from "@/components/workspace/GenerationCard";
import type { Generation } from "@rupakarsa/shared/lib/types";

export function HistoryPanel({
  generations,
  activeJobId,
  onOpen,
  onDownload,
  onRemix,
  onDelete,
}: {
  generations: Generation[];
  activeJobId: string | null;
  onOpen: (generation: Generation) => void;
  onDownload: (generation: Generation) => void;
  onRemix: (generation: Generation) => void;
  onDelete: (generation: Generation) => void;
}) {
  return (
    <section className="card p-5 sm:p-6">
      <header className="flex items-end justify-between gap-3">
        <div>
          <p className="mono-label text-muted">Folder history</p>
          <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-ink">
            Riwayat render
          </h2>
        </div>
        <span className="rounded-full border border-border bg-surface-2/60 px-2.5 py-1 text-[10px] text-muted">
          {generations.length} item
        </span>
      </header>

      {generations.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-border-strong bg-surface-2/40 px-5 py-10 text-center">
          <Film className="mx-auto size-6 text-muted" aria-hidden />
          <p className="mt-2 text-sm font-medium text-ink">Belum ada render.</p>
          <p className="mt-1 text-xs text-muted">
            Buat plan di atas, lalu tekan Generate konten untuk memulai.
          </p>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-2.5">
          {generations.map((generation) => (
            <GenerationCard
              key={generation.id}
              generation={generation}
              active={generation.id === activeJobId}
              onOpen={() => onOpen(generation)}
              onDownload={() => onDownload(generation)}
              onRemix={() => onRemix(generation)}
              onDelete={() => onDelete(generation)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
