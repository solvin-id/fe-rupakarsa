"use client";

import {
  ArrowUpRight,
  Clock3,
  Film,
  FolderPlus,
  Image as ImageIcon,
  LayoutGrid,
  List,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { GradientArt, type GradientVariant } from "@rupakarsa/shared/brand";
import { useSessionQuery } from "@rupakarsa/shared/hooks/use-session";
import {
  useCreateFolderMutation,
  useDeleteFolderMutation,
  useFoldersQuery,
  useRenameFolderMutation,
} from "@rupakarsa/shared/hooks/use-projects";
import { formatRelative, formatTokens } from "@rupakarsa/shared/lib/format";
import type { FolderWithStats } from "@rupakarsa/shared/lib/types";
import { useUiStore } from "@rupakarsa/shared/stores/ui-store";
import { Button } from "@rupakarsa/shared/ui";
import { Dialog } from "@rupakarsa/shared/ui";
import { Field, TextInput } from "@rupakarsa/shared/ui";

const ART_VARIANTS: GradientVariant[] = ["sunset", "violet", "lime", "ocean", "peach", "sand", "night"];

function artFor(index: number): GradientVariant {
  return ART_VARIANTS[index % ART_VARIANTS.length] ?? "sunset";
}

/** Stable per-folder art: the list endpoint no longer ships generations, so derive from the id. */
function folderArt(folderId: string): GradientVariant[] {
  const seed = Array.from(folderId).reduce((total, char) => total + char.charCodeAt(0), 0);
  return [0, 1, 2].map((offset) => artFor(seed + offset));
}

function FolderCollage({ variants }: { variants: GradientVariant[] }) {
  return (
    <div className="grid h-36 grid-cols-3 gap-1.5 overflow-hidden rounded-2xl bg-canvas-2 p-1.5">
      {variants.map((variant, index) => (
        <GradientArt
          key={`${variant}-${index}`}
          variant={variant}
          rounded="rounded-xl"
          className={index === 0 ? "col-span-2 row-span-2 h-full" : "h-full"}
        />
      ))}
    </div>
  );
}

export function ProjectsView() {
  const router = useRouter();
  const sessionQuery = useSessionQuery();
  const foldersQuery = useFoldersQuery();
  const createFolder = useCreateFolderMutation();
  const renameFolder = useRenameFolderMutation();
  const deleteFolder = useDeleteFolderMutation();
  const pushToast = useUiStore((state) => state.pushToast);

  const [view, setView] = useState<"grid" | "list">("grid");
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<FolderWithStats | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FolderWithStats | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftDescription, setDraftDescription] = useState("");

  const folders = useMemo(() => foldersQuery.data ?? [], [foldersQuery.data]);
  const workspaceName = sessionQuery.data?.workspace.name ?? "—";

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return folders;
    return folders.filter(
      (folder) =>
        folder.name.toLowerCase().includes(term) ||
        folder.description.toLowerCase().includes(term),
    );
  }, [folders, query]);

  const stats = useMemo(() => {
    let videos = 0;
    let images = 0;
    let tokens = 0;
    for (const folder of folders) {
      videos += folder.videoCount;
      images += folder.imageCount;
      tokens += folder.tokensUsed;
    }
    return { videos, images, tokens };
  }, [folders]);

  function openCreate(): void {
    setDraftName("");
    setDraftDescription("");
    setCreateOpen(true);
  }

  function openRename(folder: FolderWithStats): void {
    setDraftName(folder.name);
    setDraftDescription(folder.description);
    setRenameTarget(folder);
    setMenuOpenId(null);
  }

  function handleCreate(): void {
    if (draftName.trim().length < 2) {
      pushToast("error", "Nama folder minimal 2 karakter.");
      return;
    }
    createFolder.mutate(
      { name: draftName.trim(), description: draftDescription.trim() },
      {
        onSuccess: (folder) => {
          setCreateOpen(false);
          pushToast("success", `Folder "${folder.name}" dibuat.`);
          router.push(`/app/projects/${folder.id}`);
        },
        onError: (error) => pushToast("error", error.message),
      },
    );
  }

  function handleRename(): void {
    if (!renameTarget) return;
    if (draftName.trim().length < 2) {
      pushToast("error", "Nama folder minimal 2 karakter.");
      return;
    }
    renameFolder.mutate(
      {
        folderId: renameTarget.id,
        name: draftName.trim(),
        description: draftDescription.trim(),
      },
      {
        onSuccess: () => {
          setRenameTarget(null);
          pushToast("success", "Folder diperbarui.");
        },
        onError: (error) => pushToast("error", error.message),
      },
    );
  }

  function handleDelete(): void {
    if (!deleteTarget) return;
    deleteFolder.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null);
        pushToast("success", "Folder dan riwayatnya dihapus.");
      },
      onError: (error) => pushToast("error", error.message),
    });
  }

  if (foldersQuery.isPending) {
    return (
      <div className="animate-fade-up">
        <div className="h-9 w-64 animate-pulse rounded-full bg-ink/5" />
        <div className="mt-4 h-4 w-96 animate-pulse rounded-full bg-ink/5" />
        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="h-16 animate-pulse rounded-2xl bg-ink/5" />
          ))}
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <div key={index} className="h-72 animate-pulse rounded-[1.75rem] bg-ink/5" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="mono-label text-accent-strong">Drive workspace</span>
          <h1 className="display mt-2 text-[clamp(2.2rem,4vw,3.4rem)] text-ink">Ruang kerja</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
            Folder proyek di workspace{" "}
            <span className="font-medium text-ink">{workspaceName}</span>. Setiap folder menyimpan
            brief, aset referensi, plan, dan riwayat render yang bisa dibuka semua anggota
            workspace.
          </p>
        </div>
        <Button
          variant="primary"
          size="lg"
          icon={<FolderPlus className="size-4" aria-hidden />}
          onClick={openCreate}
        >
          Folder proyek baru
        </Button>
      </header>

      <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Folder proyek", value: formatTokens(folders.length), icon: LayoutGrid },
          { label: "Video dirender", value: formatTokens(stats.videos), icon: Film },
          { label: "Gambar dibuat", value: formatTokens(stats.images), icon: ImageIcon },
          { label: "Token terpakai", value: formatTokens(stats.tokens), icon: Clock3 },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="flex items-center gap-3 rounded-2xl border border-border bg-white/70 px-4 py-3.5"
            >
              <span className="flex size-9 items-center justify-center rounded-xl bg-canvas-2 text-ink">
                <Icon className="size-4" aria-hidden />
              </span>
              <div>
                <p className="text-lg font-semibold tracking-[-0.03em] text-ink">{item.value}</p>
                <p className="text-[10px] text-muted">{item.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <TextInput
            aria-label="Cari folder"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari folder proyek…"
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-1 rounded-full border border-border bg-white/60 p-1">
          <button
            type="button"
            onClick={() => setView("grid")}
            aria-pressed={view === "grid"}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors ${
              view === "grid" ? "bg-ink text-canvas" : "text-muted hover:text-ink"
            }`}
          >
            <LayoutGrid className="size-3.5" aria-hidden />
            Grid
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            aria-pressed={view === "list"}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors ${
              view === "list" ? "bg-ink text-canvas" : "text-muted hover:text-ink"
            }`}
          >
            <List className="size-3.5" aria-hidden />
            List
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-6 rounded-[1.75rem] border border-dashed border-border-strong bg-white/40 px-6 py-16 text-center">
          <FolderPlus className="mx-auto size-7 text-muted" aria-hidden />
          <p className="mt-3 text-sm font-medium text-ink">
            {query.trim() ? "Belum ada folder yang cocok." : "Belum ada folder di workspace ini."}
          </p>
          <p className="mt-1 text-xs text-muted">Buat folder baru atau ubah kata kunci pencarian.</p>
          <Button variant="primary" size="sm" className="mt-4" onClick={openCreate}>
            Buat folder
          </Button>
        </div>
      ) : view === "grid" ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((folder) => (
            <article
              key={folder.id}
              className="group relative rounded-[1.75rem] border border-border bg-white p-3 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
            >
              <button
                type="button"
                onClick={() => router.push(`/app/projects/${folder.id}`)}
                className="block w-full text-left"
                aria-label={`Buka folder ${folder.name}`}
              >
                <FolderCollage variants={folderArt(folder.id)} />
                <div className="px-2 pb-1 pt-4">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-base font-semibold tracking-[-0.02em] text-ink">
                      {folder.name}
                    </h2>
                    <ArrowUpRight
                      className="mt-0.5 size-4 shrink-0 text-muted/50 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink"
                      aria-hidden
                    />
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">
                    {folder.description || "Belum ada deskripsi."}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] text-muted">
                    <span className="rounded-full bg-canvas-2 px-2 py-0.5">
                      {folder.videoCount} video
                    </span>
                    <span className="rounded-full bg-canvas-2 px-2 py-0.5">
                      {folder.imageCount} gambar
                    </span>
                    <span className="rounded-full bg-accent-soft px-2 py-0.5 text-accent-strong">
                      {formatTokens(folder.tokensUsed)} token
                    </span>
                  </div>
                  <p className="mt-3 text-[10px] text-muted/70">
                    Diperbarui {formatRelative(folder.updatedAt)}
                  </p>
                </div>
              </button>

              <div className="absolute right-4 top-4">
                <button
                  type="button"
                  onClick={() => setMenuOpenId(menuOpenId === folder.id ? null : folder.id)}
                  aria-label={`Menu folder ${folder.name}`}
                  className="flex size-8 items-center justify-center rounded-full border border-white/40 bg-white/80 text-ink shadow-sm backdrop-blur transition-colors hover:bg-white"
                >
                  <MoreHorizontal className="size-4" aria-hidden />
                </button>
                {menuOpenId === folder.id ? (
                  <div className="absolute right-0 top-9 z-20 w-40 overflow-hidden rounded-xl border border-border bg-white py-1 shadow-lift">
                    <button
                      type="button"
                      onClick={() => router.push(`/app/projects/${folder.id}`)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-ink hover:bg-canvas-2"
                    >
                      <ArrowUpRight className="size-3.5" aria-hidden />
                      Buka
                    </button>
                    <button
                      type="button"
                      onClick={() => openRename(folder)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-ink hover:bg-canvas-2"
                    >
                      <Pencil className="size-3.5" aria-hidden />
                      Rename
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteTarget(folder);
                        setMenuOpenId(null);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-danger hover:bg-danger/5"
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                      Hapus
                    </button>
                  </div>
                ) : null}
              </div>
            </article>
          ))}

          <button
            type="button"
            onClick={openCreate}
            className="flex min-h-[18rem] flex-col items-center justify-center gap-2 rounded-[1.75rem] border border-dashed border-border-strong bg-white/30 text-muted transition-colors hover:border-ink/30 hover:bg-white/60 hover:text-ink"
          >
            <span className="flex size-11 items-center justify-center rounded-full border border-border bg-white">
              <Plus className="size-5" aria-hidden />
            </span>
            <span className="text-sm font-medium">Folder proyek baru</span>
            <span className="text-[11px]">Mulai dari brief kosong</span>
          </button>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-border bg-white">
          <div className="hidden grid-cols-[1.6fr_0.7fr_0.7fr_0.7fr_auto] gap-4 border-b border-border px-5 py-3 text-[10px] uppercase tracking-[0.14em] text-muted sm:grid">
            <span>Folder</span>
            <span>Konten</span>
            <span>Token</span>
            <span>Diperbarui</span>
            <span />
          </div>
          {filtered.map((folder) => (
            <div
              key={folder.id}
              className="grid gap-3 border-b border-border/60 px-5 py-4 last:border-b-0 sm:grid-cols-[1.6fr_0.7fr_0.7fr_0.7fr_auto] sm:items-center"
            >
              <button
                type="button"
                onClick={() => router.push(`/app/projects/${folder.id}`)}
                className="flex items-center gap-3 text-left"
              >
                <GradientArt
                  variant={folderArt(folder.id)[0] ?? "sunset"}
                  className="size-11 shrink-0"
                  rounded="rounded-xl"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{folder.name}</p>
                  <p className="truncate text-[11px] text-muted">{folder.description}</p>
                </div>
              </button>
              <p className="text-xs text-muted">
                {folder.videoCount} video · {folder.imageCount} gambar
              </p>
              <p className="text-xs text-muted">{formatTokens(folder.tokensUsed)} token</p>
              <p className="text-xs text-muted">{formatRelative(folder.updatedAt)}</p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => openRename(folder)}
                  aria-label={`Rename ${folder.name}`}
                  className="flex size-8 items-center justify-center rounded-full text-muted hover:bg-canvas-2 hover:text-ink"
                >
                  <Pencil className="size-3.5" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(folder)}
                  aria-label={`Hapus ${folder.name}`}
                  className="flex size-8 items-center justify-center rounded-full text-muted hover:bg-danger/5 hover:text-danger"
                >
                  <Trash2 className="size-3.5" aria-hidden />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={createOpen}
        title="Folder proyek baru"
        description="Folder menjadi rumah untuk brief, aset, plan, dan riwayat render."
        onClose={() => setCreateOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" loading={createFolder.isPending} onClick={handleCreate}>
              Buat folder
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="Nama folder" htmlFor="folder-name">
            <TextInput
              id="folder-name"
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              placeholder="Contoh: Kampanye Rasa Nusantara"
              autoFocus
            />
          </Field>
          <Field label="Deskripsi" htmlFor="folder-description" hint="Opsional, tapi membantu tim.">
            <TextInput
              id="folder-description"
              value={draftDescription}
              onChange={(event) => setDraftDescription(event.target.value)}
              placeholder="Tujuan proyek, audiens, atau catatan produksi."
            />
          </Field>
        </div>
      </Dialog>

      <Dialog
        open={Boolean(renameTarget)}
        title="Rename folder"
        description="Perbarui nama dan deskripsi folder proyek."
        onClose={() => setRenameTarget(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setRenameTarget(null)}>
              Batal
            </Button>
            <Button variant="primary" loading={renameFolder.isPending} onClick={handleRename}>
              Simpan
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="Nama folder" htmlFor="rename-name">
            <TextInput
              id="rename-name"
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              autoFocus
            />
          </Field>
          <Field label="Deskripsi" htmlFor="rename-description">
            <TextInput
              id="rename-description"
              value={draftDescription}
              onChange={(event) => setDraftDescription(event.target.value)}
            />
          </Field>
        </div>
      </Dialog>

      <Dialog
        open={Boolean(deleteTarget)}
        title="Hapus folder?"
        description="Folder beserta seluruh riwayat generasi di dalamnya akan dihapus."
        onClose={() => setDeleteTarget(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Batal
            </Button>
            <Button variant="danger" loading={deleteFolder.isPending} onClick={handleDelete}>
              Hapus folder
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">
          <span className="font-medium text-ink">{deleteTarget?.name}</span> akan dihapus dari
          workspace. Tindakan ini tidak bisa dibatalkan.
        </p>
      </Dialog>
    </div>
  );
}
