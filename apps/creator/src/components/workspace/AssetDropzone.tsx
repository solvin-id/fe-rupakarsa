"use client";

import { FileImage, Image as ImageIcon, Plus, UploadCloud, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export interface ReferenceFile {
  name: string;
  size: number;
  url: string;
}

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 10 * 1024 * 1024;
export const MAX_REFERENCE_FILES = 5;

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AssetDropzone({
  files,
  onChange,
  disabled = false,
  onError,
  max = MAX_REFERENCE_FILES,
}: {
  files: ReferenceFile[];
  onChange: (files: ReferenceFile[]) => void;
  disabled?: boolean;
  onError: (message: string) => void;
  max?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  // Simpan referensi terbaru agar cleanup unmount tidak me-revoke URL yang masih dipakai.
  const filesRef = useRef(files);
  useEffect(() => {
    filesRef.current = files;
  }, [files]);
  useEffect(
    () => () => {
      for (const file of filesRef.current) URL.revokeObjectURL(file.url);
    },
    [],
  );

  const remaining = Math.max(0, max - files.length);
  const full = remaining === 0;

  function handleFiles(list: FileList | null): void {
    if (!list || list.length === 0) return;

    const incoming = Array.from(list);
    const accepted: ReferenceFile[] = [];
    let rejectedFormat = 0;
    let rejectedSize = 0;

    for (const file of incoming) {
      if (!ACCEPTED.includes(file.type)) {
        rejectedFormat += 1;
        continue;
      }
      if (file.size > MAX_BYTES) {
        rejectedSize += 1;
        continue;
      }
      accepted.push({ name: file.name, size: file.size, url: URL.createObjectURL(file) });
    }

    if (rejectedFormat > 0) onError("Format harus JPG, JPEG, PNG, atau WEBP.");
    if (rejectedSize > 0) onError("Ukuran tiap gambar maksimal 10 MB.");

    if (accepted.length === 0) return;

    const room = Math.max(0, max - files.length);
    if (accepted.length > room) {
      for (const file of accepted.slice(room)) URL.revokeObjectURL(file.url);
      onError(`Maksimal ${max} gambar referensi.`);
    }

    const next = [...files, ...accepted.slice(0, room)];
    if (next.length > files.length) onChange(next);
  }

  function removeAt(index: number): void {
    const target = files[index];
    if (target) URL.revokeObjectURL(target.url);
    onChange(files.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-3">
      {files.length > 0 ? (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="group relative overflow-hidden rounded-xl border border-border bg-white"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={file.url}
                alt={file.name}
                className="aspect-square w-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeAt(index)}
                disabled={disabled}
                aria-label={`Hapus ${file.name}`}
                className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-ink/70 text-white transition-colors hover:bg-danger disabled:opacity-40"
              >
                <X className="size-3.5" aria-hidden />
              </button>
              <div className="p-2">
                <p className="truncate text-[10px] font-medium text-ink">{file.name}</p>
                <p className="mt-0.5 text-[9px] text-muted">{formatSize(file.size)}</p>
              </div>
            </li>
          ))}

          {!full ? (
            <li>
              <button
                type="button"
                disabled={disabled}
                onClick={() => inputRef.current?.click()}
                className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border-strong bg-surface-2/50 text-muted transition-colors hover:border-accent hover:text-accent-strong disabled:opacity-50"
              >
                <Plus className="size-4" aria-hidden />
                <span className="text-[10px] font-medium">Tambah</span>
              </button>
            </li>
          ) : null}
        </ul>
      ) : (
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
              JPG, JPEG, PNG, WEBP · maks. 10 MB · hingga {max} gambar
            </span>
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        className="sr-only"
        disabled={disabled}
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = "";
        }}
      />

      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1 text-[10px] text-muted">
          <FileImage className="size-3" aria-hidden />
          {files.length > 0 ? "Siap dilampirkan" : "Belum ada gambar"}
        </p>
        <p className={`text-[10px] ${full ? "text-accent-strong" : "text-muted"}`}>
          {files.length}/{max} gambar
        </p>
      </div>
    </div>
  );
}
