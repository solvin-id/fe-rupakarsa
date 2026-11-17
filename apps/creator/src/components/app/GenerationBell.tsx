"use client";

import { Bell, CheckCheck, CircleAlert, CircleCheck, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { formatRelative } from "@rupakarsa/shared/lib/format";
import type { GenerationStatus } from "@rupakarsa/shared/lib/types";
import { useGenerationStore } from "@rupakarsa/shared/stores/generation-store";

const JOB_LABEL: Record<GenerationStatus, string> = {
  QUEUED: "Menunggu worker",
  RENDERING: "Rendering di provider",
  COMPLETED: "Selesai",
  FAILED: "Gagal",
};

const PROVIDER_LABEL: Record<string, string> = {
  queued: "antre di provider",
  rendering: "provider merender",
  in_progress: "provider memproses",
  retrying: "mencoba ulang",
};

function formatElapsed(fromIso: string, now: number): string {
  const seconds = Math.max(0, Math.floor((now - new Date(fromIso).getTime()) / 1000));
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) {
    return `${hours}:${String(minutes % 60).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

/** One bell for the workspace: live renders plus the alerts their completion produced. */
export function GenerationBell() {
  const router = useRouter();
  const jobs = useGenerationStore((state) => state.jobs);
  const alerts = useGenerationStore((state) => state.alerts);
  const morphPulse = useGenerationStore((state) => state.morphPulse);
  const markAllRead = useGenerationStore((state) => state.markAllRead);

  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const container = useRef<HTMLDivElement | null>(null);

  const jobList = Object.values(jobs);
  const unread = alerts.filter((alert) => !alert.read).length;
  const badge = jobList.length + unread;

  useEffect(() => {
    if (jobList.length === 0) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [jobList.length]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent): void {
      if (container.current && !container.current.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={container} className="relative">
      <button
        type="button"
        data-notification-bell
        aria-label="Notifikasi render"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="relative flex size-9 items-center justify-center rounded-full border border-border bg-white/60 text-ink transition-colors hover:border-ink/30"
      >
        {/* Re-keying the icon replays the morph landing animation without extra state. */}
        <span key={morphPulse} className={morphPulse > 0 ? "animate-bell-pulse" : undefined}>
          <Bell className="size-4" aria-hidden />
        </span>
        {badge > 0 ? (
          <span className="absolute -right-1 -top-1 flex min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-semibold leading-4 text-white">
            {badge > 9 ? "9+" : badge}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-white shadow-lift">
          <div className="flex items-center justify-between border-b border-border px-4 py-4">
            <div>
              <p className="mono-label text-muted">Render</p>
              <h2 className="mt-1 text-sm font-semibold text-ink">Notifikasi</h2>
            </div>
            {unread > 0 ? (
              <button
                type="button"
                onClick={markAllRead}
                className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[10px] font-medium text-ink transition-colors hover:border-ink/30"
              >
                <CheckCheck className="size-3" aria-hidden />
                Tandai dibaca
              </button>
            ) : null}
          </div>

          <div className="max-h-[26rem] overflow-y-auto">
            {jobList.length === 0 && alerts.length === 0 ? (
              <p className="px-4 py-6 text-center text-[11px] text-muted">
                Belum ada render berjalan. Job yang Anda mulai muncul di sini.
              </p>
            ) : null}

            {jobList.map((job) => (
              <div key={job.id} className="border-b border-border/60 px-4 py-3">
                <div className="flex items-start gap-2">
                  <Loader2 className="mt-0.5 size-3.5 shrink-0 animate-spin text-accent" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-ink">{job.folderName}</p>
                    <p className="truncate text-[10px] text-muted">{job.modelName}</p>
                    <p className="mt-1 text-[10px] text-muted">
                      {JOB_LABEL[job.status]}
                      {job.providerStatus
                        ? ` · ${PROVIDER_LABEL[job.providerStatus] ?? job.providerStatus}`
                        : ""}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-[10px] text-ink/70">
                    {formatElapsed(job.startedAt ?? job.createdAt, now)}
                  </span>
                </div>
              </div>
            ))}

            {alerts.map((alert) => (
              <button
                key={alert.id}
                type="button"
                onClick={() => {
                  setOpen(false);
                  router.push(`/app/projects/${alert.folderId}?generation=${alert.generationId}`);
                }}
                className="flex w-full items-start gap-2 border-b border-border/60 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-canvas-2/60"
              >
                {alert.status === "COMPLETED" ? (
                  <CircleCheck className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden />
                ) : (
                  <CircleAlert className="mt-0.5 size-3.5 shrink-0 text-danger" aria-hidden />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-medium text-ink">
                    {alert.folderName}
                  </span>
                  <span className="block truncate text-[10px] text-muted">{alert.message}</span>
                  <span className="mt-0.5 block text-[9px] text-muted/70">
                    {formatRelative(alert.at)}
                  </span>
                </span>
                {alert.read ? null : (
                  <span className="mt-1 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                )}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
