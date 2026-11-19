"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

const STALL_TIMEOUT_MS = 4000;
const MAX_RETRIES = 2;
const MAX_FALLBACK_BYTES = 200 * 1024 * 1024;
const OVERLAY_DELAY_MS = 400;

interface BufferedVideoProps {
  src: string;
  label: string;
  controls?: boolean;
  className?: string;
  /** Sizing + rounding of the clipped frame; the media element fills it. */
  frameClassName?: string;
}

/**
 * `<video>` with a real loading state. Provider URLs expire and hosts move, and a `<video>` element
 * reports neither progress nor a recoverable error, so a stalled element retries twice and then
 * falls back to a plain fetch into a blob URL (which also covers a missing `Range` support).
 */
export function BufferedVideo({
  src,
  label,
  controls = false,
  className,
  frameClassName,
}: BufferedVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const stallTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retries = useRef(0);
  const loadAbort = useRef<AbortController | null>(null);

  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const [bufferedPercent, setBufferedPercent] = useState(0);
  const [loadPercent, setLoadPercent] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [loadedSrc, setLoadedSrc] = useState(src);
  // A new source is a new load: reset during render instead of an effect that would cascade.
  if (loadedSrc !== src) {
    setLoadedSrc(src);
    setReady(false);
    setShowOverlay(false);
  }

  const mediaSrc = blobUrl ?? (controls ? src : `${src}#t=0.1`);

  const clearStallTimer = useCallback(() => {
    if (stallTimer.current !== null) {
      clearTimeout(stallTimer.current);
      stallTimer.current = null;
    }
  }, []);

  /** Last resort: download the whole asset and play it from memory. */
  const recoverThroughFetch = useCallback(async () => {
    if (recovering || blobUrl) return;
    setRecovering(true);

    const controller = new AbortController();
    loadAbort.current = controller;
    try {
      const response = await fetch(src, { credentials: "include", signal: controller.signal });
      if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);

      const total = Number(response.headers.get("content-length") ?? "0");
      if (total > MAX_FALLBACK_BYTES) throw new Error("Asset terlalu besar untuk dimuat ulang.");

      const reader = response.body.getReader();
      // `Blob` wants `ArrayBuffer`-backed views; a copy per chunk keeps the type honest.
      const chunks: Uint8Array<ArrayBuffer>[] = [];
      let received = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (!value) continue;
        received += value.byteLength;
        if (received > MAX_FALLBACK_BYTES) {
          await reader.cancel();
          throw new Error("Asset terlalu besar untuk dimuat ulang.");
        }
        chunks.push(new Uint8Array(value));
        if (total > 0) setLoadPercent(Math.min(100, Math.round((received / total) * 100)));
      }

      const type = response.headers.get("content-type") ?? "video/mp4";
      const url = URL.createObjectURL(new Blob(chunks, { type }));
      setBlobUrl(url);
      setLoadPercent(100);
    } catch {
      setFailed(true);
    } finally {
      setRecovering(false);
    }
  }, [blobUrl, recovering, src]);

  const armStallTimer = useCallback(() => {
    if (blobUrl) return;
    clearStallTimer();
    stallTimer.current = setTimeout(() => {
      const video = videoRef.current;
      if (!video) return;
      if (retries.current >= MAX_RETRIES) {
        void recoverThroughFetch();
        return;
      }
      retries.current += 1;
      const resumeAt = video.currentTime;
      // jsdom has no media pipeline; only a real element exposes `load`.
      if (typeof video.load === "function") {
        video.load();
        video.currentTime = resumeAt;
      }
      if (controls && typeof video.play === "function") {
        void video.play().catch(() => undefined);
      }
    }, STALL_TIMEOUT_MS);
  }, [blobUrl, clearStallTimer, controls, recoverThroughFetch]);

  useEffect(() => {
    return () => {
      clearStallTimer();
      loadAbort.current?.abort();
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl, clearStallTimer]);

  // A cached clip fires `loadeddata` before the eye registers; only a genuinely slow load earns
  // the overlay, so reloads never announce a fetch that does not happen.
  useEffect(() => {
    if (ready || failed) return;
    const timer = setTimeout(() => setShowOverlay(true), OVERLAY_DELAY_MS);
    return () => clearTimeout(timer);
  }, [ready, failed]);

  // Cards are thumbnails: a metadata-only element often reports no buffered range yet, so an
  // overlay there would spin forever. Only the dialog (controls) promises "loading".
  const loading = !failed && controls && (recovering || (showOverlay && !ready));

  if (failed) {
    return (
      <div
        role="img"
        aria-label={label}
        className={`flex items-center justify-center bg-canvas-2 text-center text-[10px] leading-tight text-muted ${className ?? ""}`}
      >
        Video tidak dapat dimuat
      </div>
    );
  }

  return (
    <div className={`relative h-full w-full overflow-hidden ${frameClassName ?? ""}`}>
      <video
        ref={videoRef}
        muted
        playsInline
        controls={controls}
        preload={controls ? "auto" : "metadata"}
        src={mediaSrc}
        aria-label={label}
        className={className}
        onProgress={(event) => {
          const video = event.currentTarget;
          if (!Number.isFinite(video.duration) || video.duration <= 0) return;
          const ranges = video.buffered;
          if (ranges.length === 0) return;
          setBufferedPercent(Math.min(100, Math.round((ranges.end(ranges.length - 1) / video.duration) * 100)));
        }}
        onWaiting={armStallTimer}
        onStalled={armStallTimer}
        onError={() => void recoverThroughFetch()}
        onLoadedData={() => setReady(true)}
        onCanPlay={() => {
          setReady(true);
          clearStallTimer();
        }}
        onPlaying={() => {
          setReady(true);
          clearStallTimer();
        }}
      />

      {loading ? (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-ink/40 text-[10px] font-medium text-white">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          <span>
            Memuat video…
            {loadPercent !== null ? ` ${loadPercent}%` : ""}
          </span>
        </div>
      ) : null}

      {controls ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-white/15">
          <div
            data-testid="video-buffer"
            className="h-full bg-accent transition-[width] duration-300"
            style={{ width: `${bufferedPercent}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}
