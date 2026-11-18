"use client";

import { useState } from "react";

import { isVideoMedia } from "@rupakarsa/shared/lib/media";
import type { MediaType } from "@rupakarsa/shared/lib/types";

import { BufferedVideo } from "@/components/workspace/BufferedVideo";

/**
 * One preview for every rendered asset. The stored mime decides the element: a simulation poster is
 * an SVG and must render as an image, while a real clip is a muted `<video>` with its first frame
 * seeked in (Chrome cannot decode an mp4 through `<img>`).
 */
export function GenerationMediaPreview({
  url,
  mime,
  className,
  label,
  controls = false,
}: {
  url: string;
  mediaType: MediaType;
  mime: string | null;
  className?: string;
  label: string;
  controls?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  if (isVideoMedia(url, mime)) {
    return <BufferedVideo src={url} label={label} controls={controls} className={className} />;
  }

  if (failed) {
    return (
      <div
        role="img"
        aria-label={label}
        className={`flex items-center justify-center bg-canvas-2 text-center text-[10px] leading-tight text-muted ${className ?? ""}`}
      >
        Pratinjau tidak tersedia
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={label}
      loading="lazy"
      decoding="async"
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
