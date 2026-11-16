"use client";

import {
  ArrowUpRight,
  Building2,
  Check,
  CircleDollarSign,
  LogOut,
  Plus,
  Settings2,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useSessionQuery, useSwitchWorkspaceMutation } from "@rupakarsa/shared/hooks/use-session";
import {
  useApproveJoinRequestMutation,
  useCreateWorkspaceMutation,
  useDeleteWorkspaceMutation,
  useDisconnectWorkspaceDriveMutation,
  useLeaveWorkspaceMutation,
  useRejectJoinRequestMutation,
  useRemoveMemberMutation,
  useRenameWorkspaceMutation,
  useRequestJoinMutation,
  useStartWorkspaceDriveMutation,
  useTestWorkspaceDriveMutation,
  useUpdateMemberRoleMutation,
  useWorkspaceDriveQuery,
  useWorkspaceMembersQuery,
  useWorkspacesQuery,
} from "@rupakarsa/shared/hooks/use-workspaces";
import { canManageWorkspace, isWorkspaceOwner } from "@rupakarsa/shared/lib/auth";
import { formatDate, formatTokens, formatWorkspaceRole } from "@rupakarsa/shared/lib/format";
import { slugify } from "@rupakarsa/shared/lib/slug";
import type { JoinRequestStatus, Workspace } from "@rupakarsa/shared/lib/types";
import { useUiStore } from "@rupakarsa/shared/stores/ui-store";
import { Button, Dialog, Field, TextInput } from "@rupakarsa/shared/ui";

const STATUS_STYLE: Record<JoinRequestStatus, string> = {
  PENDING: "bg-accent-soft text-accent-strong",
  APPROVED: "bg-success/10 text-success",
  REJECTED: "bg-danger/10 text-danger",
};

const STATUS_LABEL: Record<JoinRequestStatus, string> = {
  PENDING: "Menunggu",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
};

export function WorkspaceHubView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sessionQuery = useSessionQuery();
  const workspacesQuery = useWorkspacesQuery();
  const pushToast = useUiStore((state) => state.pushToast);

  // Google redirects back with `?drive=connected|error`; announce it once, then clean the URL.
  const announcedDrive = useRef<string | null>(null);
  useEffect(() => {
    const result = searchParams.get("drive");
    if (!result || announcedDrive.current === result) return;
    announcedDrive.current = result;
    pushToast(
      result === "connected" ? "success" : "error",
      result === "connected"
        ? "Google Drive terhubung."
        : "Gagal menghubungkan Google Drive. Coba lagi atau hubungi admin.",
    );
    router.replace(pathname, { scroll: false });
  }, [pathname, pushToast, router, searchParams]);

  const createWorkspace = useCreateWorkspaceMutation();
  const switchWorkspace = useSwitchWorkspaceMutation();
  const renameWorkspace = useRenameWorkspaceMutation();
  const deleteWorkspace = useDeleteWorkspaceMutation();
  const leaveWorkspace = useLeaveWorkspaceMutation();
  const requestJoin = useRequestJoinMutation();
  const approveRequest = useApproveJoinRequestMutation();
  const rejectRequest = useRejectJoinRequestMutation();
  const updateMemberRole = useUpdateMemberRoleMutation();
  const removeMember = useRemoveMemberMutation();

  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [manageTargetId, setManageTargetId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const [draftName, setDraftName] = useState("");
  const [draftSlug, setDraftSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [joinSlug, setJoinSlug] = useState("");
  const [joinMessage, setJoinMessage] = useState("");
  const [renameDraft, setRenameDraft] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const membersQuery = useWorkspaceMembersQuery(manageTargetId);

  const session = sessionQuery.data;
  const payload = workspacesQuery.data;
  const workspaces = payload?.workspaces ?? [];
  const memberships = payload?.memberships ?? [];
  const manageableRequests = payload?.manageableRequests ?? [];
  const myRequests = payload?.myRequests ?? [];

  const userId = session?.user.id ?? "";
  const cards = memberships
    .map((membership) => ({
      membership,
      workspace: workspaces.find((item) => item.id === membership.workspaceId),
    }))
    .filter((card): card is { membership: (typeof memberships)[number]; workspace: Workspace } =>
      Boolean(card.workspace),
    );

  const manageWorkspace = workspaces.find((item) => item.id === manageTargetId) ?? null;
  const deleteWorkspaceTarget = workspaces.find((item) => item.id === deleteTargetId) ?? null;
  const manageMembers = membersQuery.data ?? [];
  const manageRequests = manageableRequests.filter(
    (request) => request.workspaceId === manageTargetId,
  );
  const actorRole = manageTargetId
    ? (memberships.find(
        (membership) =>
          membership.workspaceId === manageTargetId && membership.userId === userId,
      )?.role ?? null)
    : null;

  function openCreate(): void {
    setDraftName("");
    setDraftSlug("");
    setSlugTouched(false);
    setCreateOpen(true);
  }

  function openManage(workspace: Workspace): void {
    setManageTargetId(workspace.id);
    setRenameDraft(workspace.name);
  }

  function closeManage(): void {
    setManageTargetId(null);
  }

  function handleCreate(): void {
    const name = draftName.trim();
    if (name.length < 2) {
      pushToast("error", "Nama workspace minimal 2 karakter.");
      return;
    }
    const slug = draftSlug.trim();
    if (slugTouched && slug.length < 2) {
      pushToast("error", "Slug workspace minimal 2 karakter.");
      return;
    }

    createWorkspace.mutate(
      { name, slug: slugTouched ? slug : undefined },
      {
        onSuccess: (workspace) => {
          switchWorkspace.mutate(workspace.id, {
            onSuccess: () => {
              setCreateOpen(false);
              pushToast("success", `Workspace ${workspace.name} dibuat.`);
              router.push("/app/projects");
            },
            onError: (error) => {
              setCreateOpen(false);
              pushToast("error", error.message);
            },
          });
        },
        onError: (error) => pushToast("error", error.message),
      },
    );
  }

  function handleJoin(): void {
    const slug = joinSlug.trim();
    if (slug.length < 2) {
      pushToast("error", "Slug workspace minimal 2 karakter.");
      return;
    }
    requestJoin.mutate(
      { slug, message: joinMessage.trim() },
      {
        onSuccess: () => {
          setJoinOpen(false);
          setJoinSlug("");
          setJoinMessage("");
          pushToast("success", "Permintaan dikirim. Tunggu persetujuan owner/admin.");
        },
        onError: (error) => pushToast("error", error.message),
      },
    );
  }

  function handleOpen(workspace: Workspace): void {
    if (workspace.id === session?.workspace.id) return;
    switchWorkspace.mutate(workspace.id, {
      onSuccess: () => {
        router.push("/app/projects");
      },
      onError: (error) => pushToast("error", error.message),
    });
  }

  function handleLeave(workspace: Workspace): void {
    leaveWorkspace.mutate(workspace.id, {
      onSuccess: () => pushToast("success", `Anda keluar dari ${workspace.name}.`),
      onError: (error) => pushToast("error", error.message),
    });
  }

  function handleRename(): void {
    if (!manageWorkspace) return;
    renameWorkspace.mutate(
      { workspaceId: manageWorkspace.id, name: renameDraft },
      {
        onSuccess: () => pushToast("success", "Nama workspace diperbarui."),
        onError: (error) => pushToast("error", error.message),
      },
    );
  }

  function handleApprove(requestId: string): void {
    approveRequest.mutate(requestId, {
      onSuccess: () => pushToast("success", "Permintaan disetujui."),
      onError: (error) => pushToast("error", error.message),
    });
  }

  function handleReject(requestId: string): void {
    rejectRequest.mutate(requestId, {
      onSuccess: () => pushToast("success", "Permintaan ditolak."),
      onError: (error) => pushToast("error", error.message),
    });
  }

  function handleRoleChange(targetId: string, role: "ADMIN" | "MEMBER"): void {
    if (!manageWorkspace) return;
    updateMemberRole.mutate(
      { workspaceId: manageWorkspace.id, userId: targetId, role },
      {
        onSuccess: () => toast(`Role anggota diubah menjadi ${formatWorkspaceRole(role)}.`),
        onError: (error) => pushToast("error", error.message),
      },
    );
  }

  function handleRemoveMember(targetId: string): void {
    if (!manageWorkspace) return;
    removeMember.mutate(
      { workspaceId: manageWorkspace.id, userId: targetId },
      {
        onSuccess: () => toast("Anggota dikeluarkan dari workspace."),
        onError: (error) => pushToast("error", error.message),
      },
    );
  }

  function toast(message: string): void {
    pushToast("success", message);
  }

  function handleDelete(): void {
    if (!deleteWorkspaceTarget) return;
    const removed = deleteWorkspaceTarget;
    deleteWorkspace.mutate(removed.id, {
      onSuccess: () => {
        setDeleteTargetId(null);
        setManageTargetId(null);
        setDeleteConfirm("");
        pushToast("success", `Workspace ${removed.name} dihapus.`);
        router.replace("/app/projects");
      },
      onError: (error) => pushToast("error", error.message),
    });
  }

  if (sessionQuery.isPending || workspacesQuery.isPending || !session) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <span className="size-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  const activeWorkspaceId = session.workspace.id;
  const myMembershipCount = cards.length;

  return (
    <div className="animate-fade-up">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="mono-label text-accent-strong">Kolaborasi</span>
          <h1 className="display mt-2 text-[clamp(2.2rem,4vw,3.4rem)] text-ink">Workspace</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            Setiap workspace punya saldo token, kuota Plan Mode, dan folder proyek sendiri. Buat
            workspace baru atau ajukan bergabung ke workspace tim lain.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="primary"
            size="lg"
            icon={<Plus className="size-4" aria-hidden />}
            onClick={openCreate}
          >
            Buat workspace
          </Button>
          <Button
            variant="secondary"
            size="lg"
            icon={<Users className="size-4" aria-hidden />}
            onClick={() => setJoinOpen(true)}
          >
            Gabung workspace
          </Button>
        </div>
      </header>

      <section className="mt-8">
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-[-0.02em] text-ink">Workspace Anda</h2>
          <p className="text-[10px] text-muted">{myMembershipCount} workspace</p>
        </div>

        <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map(({ membership, workspace }) => {
            const memberCount = memberships.filter(
              (item) => item.workspaceId === workspace.id,
            ).length;
            const isCurrent = workspace.id === activeWorkspaceId;
            return (
              <article
                key={membership.id}
                className={`flex flex-col rounded-[1.75rem] border bg-white p-5 shadow-card ${
                  isCurrent ? "border-ink/25" : "border-border"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-canvas-2 text-ink">
                      <Building2 className="size-4" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{workspace.name}</p>
                      <p className="truncate font-mono text-[10px] text-muted">{workspace.slug}</p>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-medium ${
                      workspace.isActive
                        ? "bg-accent-3-soft text-[#3f6212]"
                        : "bg-danger/10 text-danger"
                    }`}
                  >
                    {workspace.isActive ? "Aktif" : "Nonaktif"}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl border border-border bg-surface-2/50 px-2 py-2">
                    <p className="text-sm font-semibold text-ink">{formatTokens(memberCount)}</p>
                    <p className="text-[9px] text-muted">anggota</p>
                  </div>
                  <div className="rounded-xl border border-border bg-surface-2/50 px-2 py-2">
                    <p className="text-sm font-semibold text-ink">
                      {formatTokens(workspace.tokenBalance)}
                    </p>
                    <p className="text-[9px] text-muted">token</p>
                  </div>
                  <div className="rounded-xl border border-border bg-surface-2/50 px-2 py-2">
                    <p className="text-sm font-semibold text-ink">
                      {formatTokens(workspace.freePlanRemaining)}
                    </p>
                    <p className="text-[9px] text-muted">plan</p>
                  </div>
                </div>

                <p className="mt-3 text-[10px] text-muted">
                  Role Anda:{" "}
                  <span className="font-medium text-ink">
                    {formatWorkspaceRole(membership.role)}
                  </span>
                </p>

                <div className="mt-auto flex flex-wrap gap-2 pt-4">
                  <Button
                    size="sm"
                    variant={isCurrent ? "soft" : "primary"}
                    disabled={isCurrent || !workspace.isActive}
                    icon={<ArrowUpRight className="size-3.5" aria-hidden />}
                    onClick={() => handleOpen(workspace)}
                  >
                    {isCurrent ? "Sedang dipakai" : "Buka"}
                  </Button>
                  {canManageWorkspace(membership.role) ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={<Settings2 className="size-3.5" aria-hidden />}
                      onClick={() => openManage(workspace)}
                    >
                      Kelola
                    </Button>
                  ) : null}
                  {membership.role !== "OWNER" ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={myMembershipCount <= 1}
                      icon={<LogOut className="size-3.5" aria-hidden />}
                      onClick={() => handleLeave(workspace)}
                    >
                      Keluar
                    </Button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {manageableRequests.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-lg font-semibold tracking-[-0.02em] text-ink">Permintaan bergabung</h2>
          <div className="mt-3 overflow-hidden rounded-[1.75rem] border border-border bg-white">
            {manageableRequests.map((request) => {
              const requestWorkspace = workspaces.find(
                (item) => item.id === request.workspaceId,
              );
              return (
                <div
                  key={request.id}
                  className="flex flex-col gap-3 border-b border-border/60 px-5 py-4 last:border-b-0 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{request.user.fullName}</p>
                    <p className="truncate text-[10px] text-muted">
                      {request.user.email} · {requestWorkspace?.name ?? "—"}
                    </p>
                    {request.message ? (
                      <p className="mt-1 text-[11px] leading-relaxed text-muted">
                        “{request.message}”
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={<Check className="size-3.5" aria-hidden />}
                      onClick={() => handleApprove(request.id)}
                    >
                      Setujui
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={<X className="size-3.5" aria-hidden />}
                      onClick={() => handleReject(request.id)}
                    >
                      Tolak
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="mt-8">
        <h2 className="text-lg font-semibold tracking-[-0.02em] text-ink">Permintaan saya</h2>
        {myRequests.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-border-strong bg-white/40 px-5 py-6 text-xs text-muted">
            Belum ada permintaan bergabung. Gunakan tombol “Gabung workspace” dengan slug workspace
            tujuan.
          </p>
        ) : (
          <div className="mt-3 overflow-hidden rounded-[1.75rem] border border-border bg-white">
            {myRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center gap-3 border-b border-border/60 px-5 py-3.5 last:border-b-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{request.workspace.name}</p>
                  <p className="truncate text-[10px] text-muted">
                    {request.message || "Tanpa pesan"}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-medium ${STATUS_STYLE[request.status]}`}
                >
                  {STATUS_LABEL[request.status]}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <Dialog
        open={createOpen}
        title="Buat workspace"
        description="Workspace baru mendapat kantong token sendiri dan Anda menjadi owner."
        onClose={() => setCreateOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Batal
            </Button>
            <Button
              variant="primary"
              loading={createWorkspace.isPending || switchWorkspace.isPending}
              onClick={handleCreate}
            >
              Buat workspace
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="Nama workspace" htmlFor="workspace-name">
            <TextInput
              id="workspace-name"
              value={draftName}
              onChange={(event) => {
                setDraftName(event.target.value);
                if (!slugTouched) setDraftSlug(slugify(event.target.value));
              }}
              placeholder="Contoh: Test Lab"
              autoFocus
            />
          </Field>
          <Field
            label="Slug workspace"
            htmlFor="workspace-slug"
            hint="Huruf kecil, angka, dan tanda hubung. Slug dipakai untuk mengajukan bergabung dan tidak bisa diubah."
          >
            <TextInput
              id="workspace-slug"
              value={draftSlug}
              onChange={(event) => {
                setSlugTouched(true);
                setDraftSlug(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"));
              }}
              placeholder="test-lab"
            />
          </Field>
          <p className="rounded-xl border border-border bg-surface-2/60 px-3 py-2 text-[11px] leading-relaxed text-muted">
            Saldo token dan kuota Plan Mode diisi oleh tim Rupakarsa lewat CMS. Workspace baru mulai
            dari 0 token dan 0 plan.
          </p>
        </div>
      </Dialog>

      <Dialog
        open={joinOpen}
        title="Gabung workspace"
        description="Kirim permintaan ke owner atau admin workspace tujuan."
        onClose={() => setJoinOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setJoinOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" loading={requestJoin.isPending} onClick={handleJoin}>
              Kirim permintaan
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field
            label="Slug workspace"
            htmlFor="join-slug"
            hint="Contoh: lumiere-lab. Minta slug ke owner workspace."
          >
            <TextInput
              id="join-slug"
              value={joinSlug}
              onChange={(event) =>
                setJoinSlug(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))
              }
              placeholder="lumiere-lab"
              autoFocus
            />
          </Field>
          <Field label="Pesan" htmlFor="join-message" hint="Opsional, membantu owner menilai.">
            <TextInput
              id="join-message"
              value={joinMessage}
              onChange={(event) => setJoinMessage(event.target.value)}
              placeholder="Contoh: Bergabung untuk produksi kampanye Lumiere."
            />
          </Field>
        </div>
      </Dialog>

      <Dialog
        open={Boolean(manageWorkspace)}
        title={`Kelola ${manageWorkspace?.name ?? "workspace"}`}
        description="Atur nama, anggota, dan permintaan bergabung."
        onClose={closeManage}
        widthClassName="max-w-2xl"
        footer={
          <Button variant="ghost" onClick={closeManage}>
            Tutup
          </Button>
        }
      >
        {manageWorkspace ? (
          <div className="flex flex-col gap-5">
            {isWorkspaceOwner(actorRole) ? (
              <div className="flex flex-col gap-2">
                <Field label="Nama workspace" htmlFor="manage-name" hint="Slug tidak dapat diubah.">
                  <TextInput
                    id="manage-name"
                    value={renameDraft}
                    onChange={(event) => setRenameDraft(event.target.value)}
                  />
                </Field>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={renameWorkspace.isPending}
                    onClick={handleRename}
                  >
                    Simpan nama
                  </Button>
                  <span className="font-mono text-[10px] text-muted">
                    {manageWorkspace.slug}
                  </span>
                </div>
              </div>
            ) : null}

            <div>
              <p className="mono-label text-muted">Anggota</p>
              <div className="mt-2 overflow-hidden rounded-2xl border border-border">
                {membersQuery.isPending ? (
                  <div className="flex items-center justify-center px-3 py-6">
                    <span className="size-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                  </div>
                ) : (
                  manageMembers.map((membership) => {
                    const isSelf = membership.userId === userId;
                    const canRemove =
                      membership.role !== "OWNER" &&
                      !isSelf &&
                      (isWorkspaceOwner(actorRole) || membership.role === "MEMBER");
                    return (
                      <div
                        key={membership.id}
                        className="flex flex-col gap-2 border-b border-border/60 px-3 py-2.5 last:border-b-0 sm:flex-row sm:items-center"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-ink">
                            {membership.user.fullName}
                            {isSelf ? " (Anda)" : ""}
                          </p>
                          <p className="truncate text-[10px] text-muted">{membership.user.email}</p>
                        </div>
                        <span className="w-fit rounded-full border border-border px-2 py-0.5 text-[9px] text-muted">
                          {formatWorkspaceRole(membership.role)}
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {isWorkspaceOwner(actorRole) &&
                          membership.role !== "OWNER" &&
                          !isSelf ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                handleRoleChange(
                                  membership.userId,
                                  membership.role === "ADMIN" ? "MEMBER" : "ADMIN",
                                )
                              }
                            >
                              {membership.role === "ADMIN" ? "Jadikan member" : "Jadikan admin"}
                            </Button>
                          ) : null}
                          {canRemove ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              icon={<Trash2 className="size-3.5" aria-hidden />}
                              onClick={() => handleRemoveMember(membership.userId)}
                            >
                              Keluarkan
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {manageRequests.length > 0 ? (
              <div>
                <p className="mono-label text-muted">Permintaan bergabung</p>
                <div className="mt-2 overflow-hidden rounded-2xl border border-border">
                  {manageRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex flex-col gap-2 border-b border-border/60 px-3 py-2.5 last:border-b-0 sm:flex-row sm:items-center"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-ink">
                          {request.user.fullName}
                        </p>
                        <p className="truncate text-[10px] text-muted">
                          {request.message || "Tanpa pesan"}
                        </p>
                      </div>
                      <div className="flex gap-1.5">
                        <Button
                          size="sm"
                          variant="secondary"
                          icon={<Check className="size-3.5" aria-hidden />}
                          onClick={() => handleApprove(request.id)}
                        >
                          Setujui
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={<X className="size-3.5" aria-hidden />}
                          onClick={() => handleReject(request.id)}
                        >
                          Tolak
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {canManageWorkspace(actorRole) ? (
              <WorkspaceDriveSection workspaceId={manageWorkspace.id} />
            ) : null}

            {isWorkspaceOwner(actorRole) ? (
              <div className="rounded-2xl border border-danger/20 bg-danger/5 px-4 py-3">
                <p className="flex items-center gap-1.5 text-xs font-medium text-danger">
                  <ShieldCheck className="size-3.5" aria-hidden />
                  Hapus workspace
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-muted">
                  Folder dan riwayat render ikut terhapus. Semua anggota harus punya workspace
                  lain sebelum workspace ini dihapus.
                </p>
                <Button
                  size="sm"
                  variant="danger"
                  className="mt-2"
                  icon={<Trash2 className="size-3.5" aria-hidden />}
                  onClick={() => {
                    setDeleteConfirm("");
                    setDeleteTargetId(manageWorkspace.id);
                    setManageTargetId(null);
                  }}
                >
                  Hapus workspace
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </Dialog>

      <Dialog
        open={Boolean(deleteWorkspaceTarget)}
        title={`Hapus ${deleteWorkspaceTarget?.name ?? "workspace"}?`}
        description="Folder, riwayat render, dan seluruh permintaan workspace ini ikut terhapus."
        onClose={() => setDeleteTargetId(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTargetId(null)}>
              Batal
            </Button>
            <Button
              variant="danger"
              disabled={deleteConfirm !== deleteWorkspaceTarget?.slug}
              loading={deleteWorkspace.isPending}
              onClick={handleDelete}
            >
              Hapus workspace
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-2.5 rounded-xl border border-warning/30 bg-warning/5 px-3.5 py-2.5">
            <CircleDollarSign className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
            <p className="text-[11px] leading-relaxed text-muted">
              Sisa token dan plan workspace ini hangus. Anggota yang hanya tergabung di sini akan
              memblokir penghapusan, jadi pindahkan mereka lebih dulu.
            </p>
          </div>
          <Field
            label="Ketik slug workspace untuk konfirmasi"
            htmlFor="delete-confirm"
            hint={deleteWorkspaceTarget ? `Slug: ${deleteWorkspaceTarget.slug}` : undefined}
          >
            <TextInput
              id="delete-confirm"
              value={deleteConfirm}
              onChange={(event) => setDeleteConfirm(event.target.value.trim())}
              placeholder={deleteWorkspaceTarget?.slug ?? ""}
              autoFocus
            />
          </Field>
        </div>
      </Dialog>
    </div>
  );
}

function WorkspaceDriveSection({ workspaceId }: { workspaceId: string }) {
  const driveQuery = useWorkspaceDriveQuery(workspaceId);
  const startDrive = useStartWorkspaceDriveMutation();
  const disconnectDrive = useDisconnectWorkspaceDriveMutation();
  const testDrive = useTestWorkspaceDriveMutation();
  const pushToast = useUiStore((state) => state.pushToast);

  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  const drive = driveQuery.data;
  const defaultStorage = drive?.defaultStorage;
  const needsReconnect = Boolean(drive?.connected && drive.lastError?.includes("kedaluwarsa"));

  function handleConnect(): void {
    startDrive.mutate(workspaceId, {
      onSuccess: ({ url }) => {
        window.location.href = url;
      },
      onError: (error) => pushToast("error", error.message),
    });
  }

  function handleTest(): void {
    testDrive.mutate(workspaceId, {
      onSuccess: (result) => pushToast(result.ok ? "success" : "error", result.message),
      onError: (error) => pushToast("error", error.message),
    });
  }

  function handleDisconnect(): void {
    disconnectDrive.mutate(workspaceId, {
      onSuccess: () => {
        setConfirmDisconnect(false);
        pushToast("success", "Google Drive diputus. Aset baru memakai storage default.");
      },
      onError: (error) => pushToast("error", error.message),
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-surface-2/40 px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <p className="mono-label text-[9px] text-muted">Google Drive</p>
        <span
          className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${
            drive?.connected ? "bg-success/10 text-success" : "bg-white text-muted"
          }`}
        >
          {drive?.connected ? "Terhubung" : "Belum terhubung"}
        </span>
      </div>

      <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-white px-3 py-2.5">
          <p className="text-[11px] font-medium text-ink">Storage default (CMS)</p>
          <p className="mt-1 text-[10px] leading-relaxed text-muted">
            {defaultStorage
              ? `Storage ${defaultStorage.kind === "s3" ? "S3" : "lokal"} · ${
                  defaultStorage.retentionDays > 0
                    ? `retensi otomatis ${defaultStorage.retentionDays} hari`
                    : "tanpa retensi otomatis"
                }`
              : "Memuat konfigurasi storage…"}
          </p>
          <p className="mt-1 text-[10px] leading-relaxed text-muted">
            Konfigurasi ini diatur admin di CMS → Storage dan berlaku untuk workspace tanpa Google
            Drive.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-white px-3 py-2.5">
          <p className="text-[11px] font-medium text-ink">Google Drive workspace</p>
          <p className="mt-1 text-[10px] leading-relaxed text-muted">
            File disimpan di Drive Google Anda dalam folder Rupakarsa. Tidak ada penghapusan otomatis
            oleh Rupakarsa; kuota memakai Drive Anda. Putuskan kapan saja—file lama tetap di Drive.
          </p>
        </div>
      </div>

      {driveQuery.isPending ? (
        <p className="mt-2 text-[11px] text-muted">Memuat status Drive…</p>
      ) : (
        <div className="mt-2 flex flex-col gap-2">
          {drive?.connected ? (
            <p className="text-[11px] leading-relaxed text-muted">
              Akun Google:{" "}
              <span className="font-mono text-[10px] text-ink">{drive.googleEmail}</span>
              <br />
              Folder:{" "}
              <a
                href={drive.folderUrl}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-[10px] text-accent-strong underline-offset-2 hover:underline"
              >
                {drive.folderName}
              </a>
              <br />
              Terhubung sejak {formatDate(drive.connectedAt)}
            </p>
          ) : null}

          {drive?.lastError ? (
            <p className="rounded-lg border border-danger/20 bg-danger/5 px-2 py-1.5 text-[10px] text-danger">
              {drive.lastError}
            </p>
          ) : null}

          {drive && !drive.oauthConfigured ? (
            <>
              <Button size="sm" variant="secondary" disabled>
                Hubungkan Google Drive
              </Button>
              <p className="text-[10px] leading-relaxed text-muted">
                Admin belum mengonfigurasi Google OAuth di CMS → Storage.
              </p>
            </>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {!drive?.connected || needsReconnect ? (
                <Button
                  size="sm"
                  variant="primary"
                  loading={startDrive.isPending}
                  onClick={handleConnect}
                >
                  {needsReconnect ? "Hubungkan ulang" : "Hubungkan Google Drive"}
                </Button>
              ) : null}
              {drive?.connected ? (
                <>
                  <Button size="sm" variant="secondary" loading={testDrive.isPending} onClick={handleTest}>
                    Uji koneksi
                  </Button>
                  <a
                    href={drive.folderUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-ink transition-colors hover:bg-white"
                  >
                    Buka folder
                  </a>
                  <Button size="sm" variant="ghost" onClick={() => setConfirmDisconnect(true)}>
                    Putuskan
                  </Button>
                </>
              ) : null}
            </div>
          )}
        </div>
      )}

      <Dialog
        open={confirmDisconnect}
        title="Putuskan Google Drive?"
        description="Aset baru akan disimpan di storage default setelah diputus. File yang sudah ada tetap di Drive."
        onClose={() => setConfirmDisconnect(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDisconnect(false)}>
              Batal
            </Button>
            <Button variant="danger" loading={disconnectDrive.isPending} onClick={handleDisconnect}>
              Putuskan
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">
          Aset yang sudah ada tetap berada di Drive workspace. Hanya penyimpanan baru yang berpindah.
        </p>
      </Dialog>
    </div>
  );
}

