"use client";

import { ArrowRight, Building2, Check, Copy, Search, ShieldCheck, ShieldOff, UserPlus, Users } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import {
  useAdminAccountsQuery,
  useAdminWorkspacesQuery,
  useCreateAccountMutation,
  useUpdateAccountMutation,
} from "@rupakarsa/shared/hooks/use-admin";
import { formatDate, formatTokens, formatWorkspaceRole } from "@rupakarsa/shared/lib/format";
import type { Role, User } from "@rupakarsa/shared/lib/types";
import { useUiStore } from "@rupakarsa/shared/stores/ui-store";
import { Button, Dialog, Field, Select, TextInput } from "@rupakarsa/shared/ui";

interface CreatedAccount {
  fullName: string;
  email: string;
  temporaryPassword: string;
}

export function UsersView() {
  const accountsQuery = useAdminAccountsQuery();
  const workspacesQuery = useAdminWorkspacesQuery();
  const createAccount = useCreateAccountMutation();
  const updateAccount = useUpdateAccountMutation();
  const pushToast = useUiStore((state) => state.pushToast);

  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [accessTarget, setAccessTarget] = useState<User | null>(null);
  const [createdAccount, setCreatedAccount] = useState<CreatedAccount | null>(null);
  const [copied, setCopied] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("USER");
  const [grantCms, setGrantCms] = useState(false);

  const accounts = useMemo(() => accountsQuery.data ?? [], [accountsQuery.data]);
  const workspaces = useMemo(() => workspacesQuery.data?.workspaces ?? [], [workspacesQuery.data]);
  const memberships = useMemo(
    () => workspacesQuery.data?.memberships ?? [],
    [workspacesQuery.data],
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return accounts;

    const matchingWorkspaceIds = new Set(
      workspaces
        .filter((workspace) => workspace.name.toLowerCase().includes(term))
        .map((workspace) => workspace.id),
    );

    return accounts.filter(
      (account) =>
        account.fullName.toLowerCase().includes(term) ||
        account.email.toLowerCase().includes(term) ||
        memberships.some(
          (membership) =>
            membership.userId === account.id && matchingWorkspaceIds.has(membership.workspaceId),
        ),
    );
  }, [accounts, memberships, query, workspaces]);

  const cmsCount = accounts.filter(
    (account) => account.role === "SUPERADMIN" || account.cmsAccess,
  ).length;
  const activeCount = accounts.filter((account) => account.isActive).length;

  function membershipsFor(userId: string) {
    return memberships
      .filter((membership) => membership.userId === userId)
      .map((membership) => ({
        membership,
        workspace: workspaces.find((item) => item.id === membership.workspaceId),
      }))
      .filter((entry) => Boolean(entry.workspace));
  }

  function openCreate(): void {
    setFullName("");
    setEmail("");
    setRole("USER");
    setGrantCms(false);
    setCreateOpen(true);
  }

  function handleCreate(): void {
    if (fullName.trim().length < 2) {
      pushToast("error", "Nama akun minimal 2 karakter.");
      return;
    }
    createAccount.mutate(
      {
        fullName: fullName.trim(),
        email: email.trim(),
        role,
        cmsAccess: role === "SUPERADMIN" ? true : grantCms,
      },
      {
        onSuccess: (result) => {
          setCreateOpen(false);
          setCreatedAccount({
            fullName: result.account.fullName,
            email: result.account.email,
            temporaryPassword: result.temporaryPassword,
          });
          pushToast("success", "Akun dan workspace personal dibuat.");
        },
        onError: (error) => pushToast("error", error.message),
      },
    );
  }

  function confirmAccess(): void {
    if (!accessTarget) return;
    const next = !accessTarget.cmsAccess;
    updateAccount.mutate(
      { accountId: accessTarget.id, cmsAccess: next },
      {
        onSuccess: () => {
          pushToast(
            "success",
            next
              ? `Akses CMS untuk ${accessTarget.fullName} diaktifkan.`
              : `Akses CMS ${accessTarget.fullName} dicabut.`,
          );
          setAccessTarget(null);
        },
        onError: (error) => pushToast("error", error.message),
      },
    );
  }

  function toggleActive(account: User): void {
    updateAccount.mutate(
      { accountId: account.id, isActive: !account.isActive },
      {
        onError: (error) => pushToast("error", error.message),
      },
    );
  }

  async function copyPassword(): Promise<void> {
    if (!createdAccount) return;
    try {
      await navigator.clipboard.writeText(createdAccount.temporaryPassword);
      setCopied(true);
    } catch {
      pushToast("error", "Gagal menyalin. Salin password secara manual.");
    }
  }

  if (accountsQuery.isPending || workspacesQuery.isPending) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <span className="size-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="mono-label text-accent-strong">Akun &amp; akses</span>
          <h1 className="display mt-2 text-[clamp(2.2rem,4vw,3.4rem)] text-ink">
            Users &amp; akses
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            Default akun adalah creator. Token dan Plan Mode diambil dari workspace yang sedang
            dipakai akun tersebut.
          </p>
        </div>
        <Button
          variant="primary"
          size="lg"
          icon={<UserPlus className="size-4" aria-hidden />}
          onClick={openCreate}
        >
          Daftarkan user
        </Button>
      </header>

      <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-accent/20 bg-accent-soft/50 px-4 py-3.5">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent-strong" aria-hidden />
        <p className="text-xs leading-relaxed text-ink/70">
          <span className="font-medium text-ink">Akses CMS adalah izin tambahan.</span> User tetap
          ber-role USER dan memakai saldo workspace-nya. Setiap akun baru otomatis mendapat satu
          workspace personal. Top-up dilakukan di menu Workspaces.
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total user", value: formatTokens(accounts.length), icon: Users },
          { label: "Akses CMS", value: formatTokens(cmsCount), icon: ShieldCheck },
          { label: "User aktif", value: formatTokens(activeCount), icon: ShieldCheck },
          { label: "Workspace", value: formatTokens(workspaces.length), icon: Building2 },
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

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <TextInput
            aria-label="Cari user"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari nama, email, atau workspace…"
            className="pl-10"
          />
        </div>
        <p className="text-[10px] text-muted">
          {cmsCount} dari {accounts.length} user dapat masuk CMS
        </p>
      </div>

      <div className="mt-4 overflow-hidden rounded-[1.75rem] border border-border bg-white">
        <div className="hidden grid-cols-[minmax(0,1.4fr)_0.5fr_minmax(0,1fr)_0.8fr_0.7fr_0.45fr_7rem] items-center gap-4 border-b border-border bg-surface-2/40 px-6 py-3 text-[10px] uppercase tracking-[0.14em] text-muted xl:grid">
          <span>User</span>
          <span>Role</span>
          <span>Workspace</span>
          <span>Default</span>
          <span>Akses CMS</span>
          <span>Aktif</span>
          <span className="text-right">Aksi</span>
        </div>

        {filtered.map((account) => {
          const isSuperadmin = account.role === "SUPERADMIN";
          const hasAccess = isSuperadmin || account.cmsAccess;
          const accountMemberships = membershipsFor(account.id);
          const defaultWorkspace = workspaces.find(
            (workspace) => workspace.id === account.defaultWorkspaceId,
          );
          return (
            <div
              key={account.id}
              className="grid gap-3 border-b border-border/60 px-6 py-4 last:border-b-0 xl:grid-cols-[minmax(0,1.4fr)_0.5fr_minmax(0,1fr)_0.8fr_0.7fr_0.45fr_7rem] xl:items-center xl:gap-4"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-semibold text-canvas">
                  {account.fullName.slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{account.fullName}</p>
                  <p className="truncate text-[10px] text-muted">{account.email}</p>
                  <p className="text-[9px] text-muted/70">
                    Dibuat {formatDate(account.createdAt)}
                  </p>
                </div>
              </div>

              <span
                className={`inline-flex w-fit rounded-full px-2 py-0.5 text-[10px] ${
                  isSuperadmin ? "bg-ink text-canvas" : "bg-accent-soft text-accent-strong"
                }`}
              >
                {account.role}
              </span>

              <div className="flex flex-wrap gap-1">
                {accountMemberships.length === 0 ? (
                  <span className="text-[10px] text-muted">Belum ada</span>
                ) : (
                  accountMemberships.map(({ membership, workspace }) => (
                    <span
                      key={membership.id}
                      className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[9px] text-muted"
                    >
                      {workspace?.name} ({formatWorkspaceRole(membership.role)})
                      {account.defaultWorkspaceId === membership.workspaceId ? (
                        <span className="rounded-full bg-canvas-2 px-1 text-[8px] text-ink">
                          default
                        </span>
                      ) : null}
                    </span>
                  ))
                )}
              </div>

              <p className="truncate whitespace-nowrap text-xs text-muted">
                {defaultWorkspace?.name ?? "—"}
              </p>

              {isSuperadmin ? (
                <span className="inline-flex w-fit items-center gap-1 rounded-full bg-success/10 px-2 py-1 text-[10px] font-medium text-success">
                  <ShieldCheck className="size-3" aria-hidden />
                  Selalu aktif
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setAccessTarget(account)}
                  aria-pressed={hasAccess}
                  aria-label={
                    hasAccess
                      ? `Cabut akses CMS ${account.fullName}`
                      : `Beri akses CMS ${account.fullName}`
                  }
                  className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium transition-colors ${
                    hasAccess
                      ? "border-success/25 bg-success/10 text-success hover:bg-success/15"
                      : "border-border bg-surface-2 text-muted hover:border-ink/30 hover:text-ink"
                  }`}
                >
                  {hasAccess ? (
                    <ShieldCheck className="size-3" aria-hidden />
                  ) : (
                    <ShieldOff className="size-3" aria-hidden />
                  )}
                  {hasAccess ? "Bisa masuk CMS" : "Beri akses"}
                </button>
              )}

              <button
                type="button"
                onClick={() => toggleActive(account)}
                aria-pressed={account.isActive}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  account.isActive ? "bg-success" : "bg-ink/15"
                }`}
                aria-label={`${account.isActive ? "Nonaktifkan" : "Aktifkan"} ${account.fullName}`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform ${
                    account.isActive ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>

              <Link
                href="/workspaces"
                className="inline-flex items-center gap-1 justify-self-end text-[11px] font-medium text-ink transition-colors hover:text-accent-strong"
              >
                Kelola workspace
                <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </div>
          );
        })}
      </div>

      <Dialog
        open={createOpen}
        title="Daftarkan user baru"
        description="Akun baru otomatis mendapat satu workspace personal dengan saldo 0."
        onClose={() => setCreateOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" loading={createAccount.isPending} onClick={handleCreate}>
              Daftarkan
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="Nama lengkap" htmlFor="user-name">
            <TextInput
              id="user-name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Nama anggota tim"
              autoFocus
            />
          </Field>
          <Field label="Email" htmlFor="user-email">
            <TextInput
              id="user-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nama@alfateve.co.id"
            />
          </Field>
          <Field label="Role" htmlFor="user-role">
            <Select
              id="user-role"
              value={role}
              onChange={(value) => setRole(value as Role)}
              options={[
                { value: "USER", label: "USER (creator)" },
                { value: "SUPERADMIN", label: "SUPERADMIN" },
              ]}
            />
          </Field>
          <p className="rounded-xl border border-border bg-surface-2/60 px-3 py-2 text-[11px] leading-relaxed text-muted">
            Workspace personal dibuat otomatis. Saldo dan Plan Mode diatur di menu{" "}
            <Link href="/workspaces" className="font-medium text-ink hover:text-accent-strong">
              Workspaces
            </Link>
            .
          </p>
          <label className="flex items-start gap-3 rounded-xl border border-border bg-surface-2/60 px-3 py-3">
            <input
              type="checkbox"
              checked={role === "SUPERADMIN" ? true : grantCms}
              disabled={role === "SUPERADMIN"}
              onChange={(event) => setGrantCms(event.target.checked)}
              className="mt-0.5 size-4 accent-[#d93e14]"
            />
            <span>
              <span className="block text-xs font-medium text-ink">Beri akses CMS</span>
              <span className="mt-0.5 block text-[10px] leading-relaxed text-muted">
                User tetap ber-role USER tetapi dapat masuk ke surface CMS. Superadmin selalu
                memiliki akses.
              </span>
            </span>
          </label>
        </div>
      </Dialog>

      <Dialog
        open={Boolean(accessTarget)}
        title={accessTarget?.cmsAccess ? "Cabut akses CMS?" : "Beri akses CMS?"}
        description={
          accessTarget?.cmsAccess
            ? "User tidak akan bisa lagi masuk ke CMS. Sesi CMS yang aktif akan ditolak pada pengecekan berikutnya."
            : "User tetap ber-role USER, tetapi dapat masuk ke surface CMS dengan kredensial yang sama."
        }
        onClose={() => setAccessTarget(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setAccessTarget(null)}>
              Batal
            </Button>
            <Button
              variant={accessTarget?.cmsAccess ? "danger" : "primary"}
              loading={updateAccount.isPending}
              onClick={confirmAccess}
            >
              {accessTarget?.cmsAccess ? "Cabut akses" : "Beri akses"}
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">
          <span className="font-medium text-ink">{accessTarget?.fullName}</span> ·{" "}
          {accessTarget?.email}
        </p>
      </Dialog>

      <Dialog
        open={Boolean(createdAccount)}
        title="Akun berhasil dibuat"
        description="Salin password sementara ini sekarang. Password tidak ditampilkan lagi setelah dialog ditutup."
        onClose={() => {
          setCreatedAccount(null);
          setCopied(false);
        }}
        footer={
          <Button
            variant="primary"
            onClick={() => {
              setCreatedAccount(null);
              setCopied(false);
            }}
          >
            Selesai
          </Button>
        }
      >
        <div className="flex flex-col gap-3">
          <div className="rounded-xl border border-border bg-surface-2/60 px-3.5 py-3">
            <p className="text-xs font-medium text-ink">{createdAccount?.fullName}</p>
            <p className="text-[11px] text-muted">{createdAccount?.email}</p>
          </div>
          <div>
            <p className="mono-label text-muted">Password sementara</p>
            <div className="mt-1.5 flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-xl border border-border bg-white px-3 py-2 font-mono text-sm text-ink">
                {createdAccount?.temporaryPassword}
              </code>
              <Button
                size="sm"
                variant="secondary"
                icon={
                  copied ? (
                    <Check className="size-3.5" aria-hidden />
                  ) : (
                    <Copy className="size-3.5" aria-hidden />
                  )
                }
                onClick={() => void copyPassword()}
              >
                {copied ? "Tersalin" : "Salin"}
              </Button>
            </div>
          </div>
          <p className="rounded-xl border border-border bg-surface-2/60 px-3 py-2 text-[11px] leading-relaxed text-muted">
            Minta user masuk ke Creator lalu mengganti password lewat tombol Ubah password di
            sidebar.
          </p>
        </div>
      </Dialog>
    </div>
  );
}
