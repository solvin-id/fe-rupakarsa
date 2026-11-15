"use client";

import { FileImage, Image as ImageIcon, UploadCloud, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export interface ReferenceFile {
  name: string;
  size: number;
  url: string;
}

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 10 * 1024 * 1024;

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AssetDropzone({
  file,
  onChange,
  disabled = false,
  onError,
}: {
  file: ReferenceFile | null;
  onChange: (file: ReferenceFile | null) => void;
  disabled?: boolean;
  onError: (message: string) => void;
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
    if (!ACCEPTED.includes(next.type)) {
      onError("Format harus JPG, JPEG, PNG, atau WEBP.");
      return;
    }
    if (next.size > MAX_BYTES) {
      onError("Ukuran gambar maksimal 10 MB.");
      return;
    }
    onChange({ name: next.name, size: next.size, url: URL.createObjectURL(next) });
  }

  if (file) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-white p-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={file.url}
          alt={file.name}
          className="size-16 shrink-0 rounded-xl border border-border object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-ink">{file.name}</p>
          <p className="mt-0.5 text-[10px] text-muted">{formatSize(file.size)} · referensi visual</p>
          <p className="mt-1 flex items-center gap-1 text-[10px] text-success">
            <FileImage className="size-3" aria-hidden />
            Siap dilampirkan
          </p>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          disabled={disabled}
          aria-label="Hapus gambar referensi"
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
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
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
        <span className="text-xs font-medium text-ink">Tarik gambar ke sini atau pilih file</span>
        <span className="flex items-center gap-1 text-[10px] text-muted">
          <ImageIcon className="size-3" aria-hidden />
          JPG, JPEG, PNG, WEBP · maks. 10 MB
        </span>
      </button>
    </div>
  );
}
