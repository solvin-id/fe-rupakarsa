"use client";

import { Download, HardDrive, Image as ImageIcon, Trash2, Video } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { useSessionQuery } from "@rupakarsa/shared/hooks/use-session";
import { useDeleteAssetMutation, useStorageQuery } from "@rupakarsa/shared/hooks/use-storage";
import { useWorkspaceDriveQuery } from "@rupakarsa/shared/hooks/use-workspaces";
import { formatBytes, formatDate } from "@rupakarsa/shared/lib/format";
import type { MediaType, StorageItem } from "@rupakarsa/shared/lib/types";
import { useUiStore } from "@rupakarsa/shared/stores/ui-store";
import { Button, Dialog, Select, TextInput } from "@rupakarsa/shared/ui";

const DRIVER_LABEL: Record<StorageItem["driver"], string> = {
  local: "local",
  s3: "s3",
  gdrive: "drive",
};

const SOURCE_LABEL: Record<StorageItem["source"], string> = {
  UPLOAD: "Upload",
  GENERATION: "Render",
};

export function StorageView() {
  const sessionQuery = useSessionQuery();
  const workspace = sessionQuery.data?.workspace ?? null;
  const driveQuery = useWorkspaceDriveQuery(workspace?.id ?? null);

  const [type, setType] = useState<MediaType | "ALL">("ALL");
  const [source, setSource] = useState<"ALL" | "UPLOAD" | "GENERATION">("ALL");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [detail, setDetail] = useState<StorageItem | null>(null);

  const pushToast = useUiStore((state) => state.pushToast);
  const deleteAsset = useDeleteAssetMutation();

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const filters = useMemo(
    () => ({
      type: type === "ALL" ? undefined : type,
      source: source === "ALL" ? undefined : source,
      q: search.length > 0 ? search : undefined,
      limit: 60,
    }),
    [type, source, search],
  );

  const storageQuery = useStorageQuery(filters);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const items = useMemo(
    () => (storageQuery.data?.pages ?? []).flatMap((page) => page.items),
    [storageQuery.data],
  );
  const totals = storageQuery.data?.pages[0]?.totals ?? {
    count: 0,
    bytes: 0,
    images: 0,
    videos: 0,
  };

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver((entries) => {
      const first = entries[0];
      if (first?.isIntersecting && storageQuery.hasNextPage && !storageQuery.isFetchingNextPage) {
        void storageQuery.fetchNextPage();
      }
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [storageQuery]);

  function toggleSelected(id: string): void {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  async function deleteMany(ids: string[]): Promise<void> {
    let deleted = 0;
    for (const id of ids) {
      try {
        await deleteAsset.mutateAsync(id);
        deleted += 1;
      } catch (error) {
        pushToast("error", error instanceof Error ? error.message : "Gagal menghapus aset.");
        break;
      }
    }
    setSelected([]);
    setDetail(null);
    if (deleted > 0) pushToast("success", `${deleted} aset dihapus.`);
  }

  const driveConnected = driveQuery.data?.connected ?? false;

  return (
    <div className="animate-fade-up">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="mono-label text-accent-strong">Penyimpanan workspace</span>
          <h1 className="display mt-2 text-[clamp(2rem,3.8vw,3.2rem)] text-ink">Penyimpanan</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            Semua lampiran dan hasil render workspace ini. Lampiran privat memakai URL bertanda
            tangan; hasil render publik dan tidak berubah.
          </p>
        </div>
        <span className="pill">
          <HardDrive className="size-3.5 text-accent" aria-hidden />
          {driveConnected ? "Google Drive" : "Storage default"}
        </span>
      </header>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: "Aset", value: String(totals.count) },
          { label: "Ukuran", value: formatBytes(totals.bytes) },
          { label: "Gambar", value: String(totals.images) },
          { label: "Video", value: String(totals.videos) },
        ].map((chip) => (
          <div key={chip.label} className="rounded-2xl border border-border bg-white px-3 py-2.5">
            <p className="mono-label text-[8px] text-muted">{chip.label}</p>
            <p className="mt-0.5 text-lg font-semibold tracking-[-0.02em] text-ink">{chip.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-full border border-border bg-surface-2/70 p-1">
          {(
            [
              { id: "ALL" as const, label: "Semua", icon: undefined },
              { id: "IMAGE" as const, label: "Gambar", icon: ImageIcon },
              { id: "VIDEO" as const, label: "Video", icon: Video },
            ] as ReadonlyArray<{
              id: MediaType | "ALL";
              label: string;
              icon: typeof ImageIcon | undefined;
            }>
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setType(tab.id)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                type === tab.id ? "bg-ink text-canvas" : "text-muted hover:text-ink"
              }`}
            >
              {tab.icon ? <tab.icon className="size-3" aria-hidden /> : null}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={source}
            onChange={(value) => setSource(value as typeof source)}
            options={[
              { value: "ALL", label: "Semua sumber" },
              { value: "UPLOAD", label: "Upload" },
              { value: "GENERATION", label: "Render" },
            ]}
            className="w-40"
          />
          <TextInput
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Cari nama aset…"
            className="w-56"
            aria-label="Cari aset"
          />
        </div>
      </div>

      {selected.length > 0 ? (
        <div className="mt-3 flex items-center justify-between rounded-xl border border-border bg-white px-3 py-2">
          <p className="text-xs text-ink">{selected.length} dipilih</p>
          <Button
            variant="danger"
            size="sm"
            loading={deleteAsset.isPending}
            onClick={() => void deleteMany(selected)}
          >
            Hapus terpilih
          </Button>
        </div>
      ) : null}

      {storageQuery.isPending ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <span className="size-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : items.length === 0 ? (
        <div className="mt-6 rounded-[1.75rem] border border-dashed border-border bg-white p-10 text-center">
          <HardDrive className="mx-auto size-7 text-accent" aria-hidden />
          <p className="mt-3 text-sm text-muted">
            Belum ada aset di workspace ini. Unggah lampiran atau jalankan render.
          </p>
          <Link href="/app/projects" className="mt-4 inline-block">
            <Button variant="primary">Buka proyek</Button>
          </Link>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="group overflow-hidden rounded-2xl border border-border bg-white"
            >
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDetail(item)}
                  className="block w-full text-left"
                  aria-label={`Lihat ${item.name}`}
                >
                  {item.purgedAt ? (
                    <div className="flex aspect-video w-full items-center justify-center bg-surface-2 text-[11px] text-muted">
                      Aset dibersihkan
                    </div>
                  ) : item.mime.startsWith("video/") ? (
                    <video
                      src={item.url}
                      muted
                      preload="metadata"
                      className="aspect-video w-full bg-ink object-cover"
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.url}
                      alt={item.name}
                      loading="lazy"
                      className="aspect-video w-full object-cover"
                    />
                  )}
                </button>
                <label className="absolute left-2 top-2 flex size-5 items-center justify-center rounded-md border border-white/60 bg-white/85">
                  <input
                    type="checkbox"
                    checked={selected.includes(item.id)}
                    onChange={() => toggleSelected(item.id)}
                    aria-label={`Pilih ${item.name}`}
                    className="size-3 accent-[#f04e23]"
                  />
                </label>
              </div>
              <div className="px-2.5 py-2">
                <p className="truncate text-[11px] font-medium text-ink">{item.name}</p>
                <p className="mt-0.5 text-[10px] text-muted">
                  {formatBytes(item.size)} · {formatDate(item.createdAt)}
                </p>
                <div className="mt-1.5 flex items-center gap-1">
                  <span className="mono-label rounded-full bg-surface-2 px-1.5 py-0.5 text-[8px] text-muted">
                    {DRIVER_LABEL[item.driver]}
                  </span>
                  <span className="mono-label rounded-full bg-surface-2 px-1.5 py-0.5 text-[8px] text-muted">
                    {SOURCE_LABEL[item.source]}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="h-8" />
      {storageQuery.isFetchingNextPage ? (
        <p className="text-center text-[11px] text-muted">Memuat aset berikutnya…</p>
      ) : null}

      <Dialog
        open={Boolean(detail)}
        title={detail?.name ?? "Aset"}
        description={detail ? `${SOURCE_LABEL[detail.source]} · ${DRIVER_LABEL[detail.driver]}` : undefined}
        onClose={() => setDetail(null)}
        widthClassName="max-w-2xl"
        footer={
          detail ? (
            <>
              <Button variant="ghost" onClick={() => setDetail(null)}>
                Tutup
              </Button>
              {!detail.purgedAt ? (
                <Button
                  variant="secondary"
                  icon={<Download className="size-3.5" aria-hidden />}
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = `${detail.url}${detail.url.includes("?") ? "&" : "?"}download=1`;
                    link.rel = "noopener";
                    document.body.append(link);
                    link.click();
                    link.remove();
                  }}
                >
                  Unduh
                </Button>
              ) : null}
              <Button
                variant="danger"
                loading={deleteAsset.isPending}
                icon={<Trash2 className="size-3.5" aria-hidden />}
                onClick={() => void deleteMany([detail.id])}
              >
                Hapus
              </Button>
            </>
          ) : null
        }
      >
        {detail ? (
          <div className="flex flex-col gap-3">
            {detail.purgedAt ? (
              <div className="flex aspect-video items-center justify-center rounded-2xl border border-dashed border-border bg-surface-2/50 text-sm text-muted">
                Aset sudah dibersihkan dari storage.
              </div>
            ) : detail.mime.startsWith("video/") ? (
              <video controls src={detail.url} className="aspect-video w-full rounded-2xl bg-ink" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={detail.url}
                alt={detail.name}
                className="aspect-video w-full rounded-2xl border border-border object-contain"
              />
            )}

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {[
                { label: "Tipe", value: detail.mime },
                { label: "Ukuran", value: formatBytes(detail.size) },
                {
                  label: "Dimensi",
                  value:
                    detail.width && detail.height ? `${detail.width}×${detail.height}` : "—",
                },
                {
                  label: "Durasi",
                  value: detail.durationMs ? `${Math.round(detail.durationMs / 1000)}s` : "—",
                },
                { label: "Model", value: detail.modelName ?? "—" },
                { label: "Dibuat", value: formatDate(detail.createdAt) },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-border bg-surface-2/50 px-3 py-2">
                  <p className="mono-label text-[8px] text-muted">{item.label}</p>
                  <p className="mt-0.5 truncate text-xs font-medium text-ink">{item.value}</p>
                </div>
              ))}
            </div>

            <p className="break-all font-mono text-[10px] text-muted">{detail.key}</p>
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}
