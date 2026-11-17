"use client";

import { isVideoMedia } from "@rupakarsa/shared/lib/media";
import type { MediaType } from "@rupakarsa/shared/lib/types";

/**
 * One preview for every rendered asset. Chrome cannot decode an mp4 through `<img>` (it renders a
 * broken-image glyph), so a video is always a muted `<video>` with its first frame seeked in.
 */
export function GenerationMediaPreview({
  url,
  mediaType,
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
  if (mediaType === "VIDEO" || isVideoMedia(url, mime)) {
    return (
      <video
        muted
        playsInline
        preload="metadata"
        controls={controls}
        src={`${url}#t=0.1`}
        aria-label={label}
        className={className}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={label} loading="lazy" decoding="async" className={className} />
  );
}
