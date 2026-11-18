"use client";

import { FileVideo, Film, Image as ImageIcon, Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
  formatLabel,
  kindForMime,
  validateReferenceFile,
} from "@/components/workspace/AssetDropzone";
import type { ReferenceFile } from "@/components/workspace/AssetDropzone";

/** Which service reads the attachments: the plan model, or the analysis models in direct mode. */
export type AttachmentGate = "plan" | "analysis";

export interface AttachmentTrayProps {
  attachments: ReferenceFile[];
  onChange: (attachments: ReferenceFile[]) => void;
  disabled?: boolean;
  max?: number;
  allowImage: boolean;
  allowVideo: boolean;
  gate?: AttachmentGate;
  onError: (message: string) => void;
}

/**
 * Multi-file attachment tray. Types the plan model cannot read are disabled here and rejected when
 * dropped, so the server-side capability gate is never the first place a user learns about it.
 */
export function AttachmentTray({
  attachments,
  onChange,
  disabled = false,
  max = 4,
  allowImage,
  allowVideo,
  gate = "plan",
  onError,
}: AttachmentTrayProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    return () => {
      for (const item of attachments) URL.revokeObjectURL(item.url);
    };
    // Only revoke on unmount; removals revoke at removal time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const accept = [allowImage ? "image/jpeg,image/png,image/webp" : "", allowVideo ? "video/mp4,video/webm" : ""]
    .filter(Boolean)
    .join(",");

  function addFiles(files: FileList | null): void {
    if (!files || files.length === 0) return;
    const next = [...attachments];

    for (const file of Array.from(files)) {
      if (next.length >= max) {
        onError(`Lampiran maksimal ${max} berkas.`);
        break;
      }
      const kind = kindForMime(file.type);
      if (kind === "VIDEO" && !allowVideo) {
        onError(
          gate === "analysis"
            ? "Model analisis video belum disetel di CMS → Settings → AI."
            : "Model plan tidak mendukung lampiran video.",
        );
        continue;
      }
      if (kind === "IMAGE" && !allowImage) {
        onError(
          gate === "analysis"
            ? "Model analisis gambar belum disetel di CMS → Settings → AI."
            : "Model plan tidak mendukung lampiran gambar.",
        );
        continue;
      }
      const result = validateReferenceFile(file, kind === "VIDEO" ? "video" : "image");
      if (!result.ok) {
        onError(result.message);
        continue;
      }
      next.push({
        name: file.name,
        size: file.size,
        url: URL.createObjectURL(file),
        file,
        kind,
      });
    }

    if (next.length !== attachments.length) onChange(next);
  }

  function removeAt(index: number): void {
    const target = attachments[index];
    if (target) URL.revokeObjectURL(target.url);
    onChange(attachments.filter((_, position) => position !== index));
  }

  if (!allowImage && !allowVideo) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-surface-2/40 px-3 py-3 text-[11px] leading-relaxed text-muted">
        {gate === "analysis"
          ? "Model analisis gambar dan video belum disetel di CMS → Settings → AI."
          : "Model plan saat ini tidak menerima lampiran gambar maupun video."}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {attachments.length > 0 ? (
        <ul className="grid grid-cols-2 gap-2">
          {attachments.map((item, index) => (
            <li
              key={`${item.name}-${index}`}
              className="group relative overflow-hidden rounded-xl border border-border bg-white"
            >
              {item.kind === "VIDEO" ? (
                <video
                  src={item.url}
                  muted
                  preload="metadata"
                  className="aspect-video w-full object-cover"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.url} alt={item.name} className="aspect-video w-full object-cover" />
              )}
              <div className="flex items-center gap-1 px-2 py-1.5">
                {item.kind === "VIDEO" ? (
                  <FileVideo className="size-3 shrink-0 text-accent-2" aria-hidden />
                ) : (
                  <ImageIcon className="size-3 shrink-0 text-accent" aria-hidden />
                )}
                <span className="truncate text-[10px] text-muted">{item.name}</span>
              </div>
              <button
                type="button"
                onClick={() => removeAt(index)}
                disabled={disabled}
                aria-label={`Hapus ${item.name}`}
                className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-ink/70 text-white transition-colors hover:bg-danger disabled:opacity-40"
              >
                <X className="size-3" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (!disabled) addFiles(event.dataTransfer.files);
        }}
        className={`rounded-xl border border-dashed px-3 py-2.5 transition-colors ${
          dragging ? "border-accent bg-accent-soft/50" : "border-border-strong bg-surface-2/40"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          className="sr-only"
          disabled={disabled}
          onChange={(event) => {
            addFiles(event.target.files);
            event.target.value = "";
          }}
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="flex w-full items-center justify-between gap-2 text-left disabled:opacity-50"
        >
          <span className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-full border border-border bg-white text-ink">
              <Plus className="size-3.5" aria-hidden />
            </span>
            <span className="text-[11px] font-medium text-ink">Tambah lampiran</span>
          </span>
          <span className="flex items-center gap-1 text-[10px] text-muted">
            <Film className="size-3" aria-hidden />
            {attachments.length}/{max}
          </span>
        </button>
        <p className="mt-1 pl-9 text-[10px] text-muted">
          {formatLabel(allowImage && allowVideo ? "both" : allowImage ? "image" : "video")}
        </p>
      </div>
    </div>
  );
}
