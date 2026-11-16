"use client";

import { FileImage, FileVideo, Image as ImageIcon, UploadCloud, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export interface ReferenceFile {
  name: string;
  size: number;
  url: string;
  file: File;
  kind: "IMAGE" | "VIDEO";
}

const IMAGE_ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const VIDEO_ACCEPTED = ["video/mp4", "video/webm"];
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

export type DropzoneAccept = "image" | "video" | "both";

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function acceptedTypes(accept: DropzoneAccept): string[] {
  if (accept === "image") return IMAGE_ACCEPTED;
  if (accept === "video") return VIDEO_ACCEPTED;
  return [...IMAGE_ACCEPTED, ...VIDEO_ACCEPTED];
}

export function kindForMime(mime: string): "IMAGE" | "VIDEO" {
  return mime.startsWith("video/") ? "VIDEO" : "IMAGE";
}

export function formatLabel(accept: DropzoneAccept): string {
  if (accept === "image") return "JPG, JPEG, PNG, WEBP · maks. 10 MB";
  if (accept === "video") return "MP4, WEBM · maks. 100 MB";
  return "JPG, PNG, WEBP, MP4, WEBM · gambar 10 MB / video 100 MB";
}

export function validateReferenceFile(
  file: File,
  accept: DropzoneAccept,
): { ok: true; kind: "IMAGE" | "VIDEO" } | { ok: false; message: string } {
  const types = acceptedTypes(accept);
  if (!types.includes(file.type)) {
    if (accept === "video") return { ok: false, message: "Format harus MP4 atau WEBM." };
    if (accept === "image") return { ok: false, message: "Format harus JPG, JPEG, PNG, atau WEBP." };
    return { ok: false, message: "Format harus JPG, JPEG, PNG, WEBP, MP4, atau WEBM." };
  }
  const kind = kindForMime(file.type);
  const limit = kind === "VIDEO" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (file.size > limit) {
    return {
      ok: false,
      message: kind === "VIDEO" ? "Ukuran video maksimal 100 MB." : "Ukuran gambar maksimal 10 MB.",
    };
  }
  return { ok: true, kind };
}

export function AssetDropzone({
  file,
  onChange,
  disabled = false,
  onError,
  accept = "both",
}: {
  file: ReferenceFile | null;
  onChange: (file: ReferenceFile | null) => void;
  disabled?: boolean;
  onError: (message: string) => void;
  accept?: DropzoneAccept;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const url = file?.url;
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [file?.url]);

  function handleFiles(files: FileList | null): void {
    const next = files?.[0];
    if (!next) return;
    const result = validateReferenceFile(next, accept);
    if (!result.ok) {
      onError(result.message);
      return;
    }
    onChange({
      name: next.name,
      size: next.size,
      url: URL.createObjectURL(next),
      file: next,
      kind: result.kind,
    });
  }

  if (file) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-white p-3">
        {file.kind === "VIDEO" ? (
          <video
            src={file.url}
            muted
            controls
            className="size-16 shrink-0 rounded-xl border border-border object-cover"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={file.url}
            alt={file.name}
            className="size-16 shrink-0 rounded-xl border border-border object-cover"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-ink">{file.name}</p>
          <p className="mt-0.5 text-[10px] text-muted">
            {formatSize(file.size)} · {file.kind === "VIDEO" ? "video" : "gambar"}
          </p>
          <p className="mt-1 flex items-center gap-1 text-[10px] text-success">
            {file.kind === "VIDEO" ? (
              <FileVideo className="size-3" aria-hidden />
            ) : (
              <FileImage className="size-3" aria-hidden />
            )}
            Siap dilampirkan
          </p>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          disabled={disabled}
          aria-label="Hapus lampiran"
          className="flex size-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-danger/5 hover:text-danger disabled:opacity-40"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    );
  }

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        if (!disabled) handleFiles(event.dataTransfer.files);
      }}
      className={`rounded-2xl border border-dashed p-4 transition-colors ${
        dragging ? "border-accent bg-accent-soft/50" : "border-border-strong bg-surface-2/50"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={acceptedTypes(accept).join(",")}
        className="sr-only"
        disabled={disabled}
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className="flex w-full flex-col items-center gap-2 py-2 text-center disabled:opacity-50"
      >
        <span className="flex size-10 items-center justify-center rounded-full border border-border bg-white text-ink">
          <UploadCloud className="size-4" aria-hidden />
        </span>
        <span className="text-xs font-medium text-ink">Tarik berkas ke sini atau pilih file</span>
        <span className="flex items-center gap-1 text-[10px] text-muted">
          <ImageIcon className="size-3" aria-hidden />
          {formatLabel(accept)}
        </span>
      </button>
    </div>
  );
}
