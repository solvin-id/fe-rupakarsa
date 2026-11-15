"use client";

import { ArrowRight, Building2, Search, ShieldCheck, ShieldOff, UserPlus, Users } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { formatDate, formatTokens } from "@rupakarsa/shared/lib/format";
import { readTenantWallet } from "@rupakarsa/shared/lib/tenant-wallet-cookie";
import type { Role, User } from "@rupakarsa/shared/lib/types";
import { useAdminStore } from "@rupakarsa/shared/stores/admin-store";
import { useUiStore } from "@rupakarsa/shared/stores/ui-store";
import { Button, Dialog, Field, Select, TextInput } from "@rupakarsa/shared/ui";

export function UsersView() {
  const tenants = useAdminStore((state) => state.tenants);
  const users = useAdminStore((state) => state.users);
  const createUser = useAdminStore((state) => state.createUser);
  const toggleUser = useAdminStore((state) => state.toggleUser);
  const setCmsAccess = useAdminStore((state) => state.setCmsAccess);
  const pushToast = useUiStore((state) => state.pushToast);

  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [accessTarget, setAccessTarget] = useState<User | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("USER");
  const [tenantId, setTenantId] = useState(tenants[0]?.id ?? "ten_alfateve");
  const [grantCms, setGrantCms] = useState(false);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return users;
    return users.filter(
      (user) =>
        user.fullName.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.tenantName.toLowerCase().includes(term),
    );
  }, [users, query]);

  const cmsCount = users.filter((user) => user.role === "SUPERADMIN" || user.cmsAccess).length;
  const activeCount = users.filter((user) => user.isActive).length;

  function tenantBalance(user: User): number {
    const tenant = tenants.find((item) => item.id === user.tenantId);
    return readTenantWallet(user.tenantId)?.tokenBalance ?? tenant?.tokenBalance ?? 0;
  }

  function openCreate(): void {
    setFullName("");
    setEmail("");
    setRole("USER");
    setTenantId(tenants[0]?.id ?? "ten_alfateve");
    setGrantCms(false);
    setCreateOpen(true);
  }

  function handleCreate(): void {
    if (fullName.trim().length < 2) {
      pushToast("error", "Nama minimal 2 karakter.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      pushToast("error", "Format email tidak valid.");
      return;
    }
    const user = createUser({
      fullName,
      email,
      role,
      tenantId,
      cmsAccess: role === "SUPERADMIN" ? true : grantCms,
    });
    if (!user) {
      pushToast("error", "Email sudah terdaftar.");
      return;
    }
    setCreateOpen(false);
    pushToast(
      "success",
      user.cmsAccess
        ? `Akun ${user.fullName} didaftarkan dengan akses CMS.`
        : `Akun ${user.fullName} didaftarkan sebagai creator.`,
    );
  }

  function confirmAccess(): void {
    if (!accessTarget) return;
    const next = !accessTarget.cmsAccess;
    setCmsAccess(accessTarget.id, next);
    setAccessTarget(null);
    pushToast(
      "success",
      next
        ? `Akses CMS untuk ${accessTarget.fullName} diaktifkan.`
        : `Akses CMS ${accessTarget.fullName} dicabut.`,
    );
  }

  return (
    <div className="animate-fade-up">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="mono-label text-accent-strong">Tenant &amp; akses</span>
          <h1 className="display mt-2 text-[clamp(2.2rem,4vw,3.4rem)] text-ink">
            Users &amp; akses
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            Default akun adalah creator. Token dan Plan Mode diambil dari kantong tenant.
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
          ber-role USER dan memakai saldo token tenant-nya. Top-up dilakukan di menu Tenants.
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total user", value: formatTokens(users.length), icon: Users },
          { label: "Akses CMS", value: formatTokens(cmsCount), icon: ShieldCheck },
          { label: "User aktif", value: formatTokens(activeCount), icon: ShieldCheck },
          { label: "Tenant", value: formatTokens(tenants.length), icon: Building2 },
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
            placeholder="Cari nama, email, atau tenant…"
            className="pl-10"
          />
        </div>
        <p className="text-[10px] text-muted">
          {cmsCount} dari {users.length} user dapat masuk CMS
        </p>
      </div>

      <div className="mt-4 overflow-hidden rounded-[1.75rem] border border-border bg-white">
        <div className="hidden grid-cols-[minmax(0,1.6fr)_0.55fr_0.7fr_0.9fr_0.55fr_7.5rem] items-center gap-4 border-b border-border bg-surface-2/40 px-6 py-3 text-[10px] uppercase tracking-[0.14em] text-muted xl:grid">
          <span>User</span>
          <span>Role</span>
          <span>Tenant</span>
          <span>Akses CMS</span>
          <span>Aktif</span>
          <span className="text-right">Aksi</span>
        </div>

        {filtered.map((user) => {
          const isSuperadmin = user.role === "SUPERADMIN";
          const hasAccess = isSuperadmin || user.cmsAccess;
          return (
            <div
              key={user.id}
              className="grid gap-3 border-b border-border/60 px-6 py-4 last:border-b-0 xl:grid-cols-[minmax(0,1.6fr)_0.55fr_0.7fr_0.9fr_0.55fr_7.5rem] xl:items-center xl:gap-4"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-semibold text-canvas">
                  {user.fullName.slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{user.fullName}</p>
                  <p className="truncate text-[10px] text-muted">{user.email}</p>
                  <p className="text-[9px] text-muted/70">Dibuat {formatDate(user.createdAt)}</p>
                </div>
              </div>

              <span
                className={`inline-flex w-fit rounded-full px-2 py-0.5 text-[10px] ${
                  isSuperadmin ? "bg-ink text-canvas" : "bg-accent-soft text-accent-strong"
                }`}
              >
                {user.role}
              </span>

              <div>
                <p className="whitespace-nowrap text-xs text-muted">{user.tenantName}</p>
                <p className="whitespace-nowrap text-[9px] text-muted/70">
                  {formatTokens(tenantBalance(user))} token
                </p>
              </div>

              {isSuperadmin ? (
                <span className="inline-flex w-fit items-center gap-1 rounded-full bg-success/10 px-2 py-1 text-[10px] font-medium text-success">
                  <ShieldCheck className="size-3" aria-hidden />
                  Selalu aktif
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setAccessTarget(user)}
                  aria-pressed={hasAccess}
                  aria-label={
                    hasAccess
                      ? `Cabut akses CMS ${user.fullName}`
                      : `Beri akses CMS ${user.fullName}`
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
                onClick={() => toggleUser(user.id)}
                aria-pressed={user.isActive}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  user.isActive ? "bg-success" : "bg-ink/15"
                }`}
                aria-label={`${user.isActive ? "Nonaktifkan" : "Aktifkan"} ${user.fullName}`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform ${
                    user.isActive ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>

              <Link
                href="/tenants"
                className="inline-flex items-center gap-1 justify-self-end text-[11px] font-medium text-ink transition-colors hover:text-accent-strong"
              >
                Kelola tenant
                <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </div>
          );
        })}
      </div>

      <Dialog
        open={createOpen}
        title="Daftarkan user baru"
        description="Default role USER. Token dan Plan Mode mengikuti kantong tenant."
        onClose={() => setCreateOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleCreate}>
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
          <div className="grid gap-4 sm:grid-cols-2">
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
            <Field label="Tenant" htmlFor="user-tenant">
              <Select
                id="user-tenant"
                value={tenantId}
                onChange={setTenantId}
                options={tenants.map((tenant) => ({
                  value: tenant.id,
                  label: tenant.name,
                }))}
              />
            </Field>
          </div>
          <p className="rounded-xl border border-border bg-surface-2/60 px-3 py-2 text-[11px] leading-relaxed text-muted">
            Token dan Plan Mode diambil dari saldo tenant. Atur saldo di menu{" "}
            <Link href="/tenants" className="font-medium text-ink hover:text-accent-strong">
              Tenants
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
          <p className="rounded-xl border border-border bg-surface-2/60 px-3 py-2 text-[11px] leading-relaxed text-muted">
            Password sementara: <span className="font-mono text-ink">rupakarsa</span>. Minta user
            menggantinya setelah integrasi auth backend.
          </p>
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
            <Button variant={accessTarget?.cmsAccess ? "danger" : "primary"} onClick={confirmAccess}>
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
    </div>
  );
}
