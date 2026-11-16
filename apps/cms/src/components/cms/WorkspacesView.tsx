"use client";

import { Building2, CircleDollarSign, Plus, ShieldCheck, Users } from "lucide-react";
import { useState } from "react";

import { formatDate, formatTokens } from "@rupakarsa/shared/lib/format";
import { slugify } from "@rupakarsa/shared/lib/slug";
import type { Workspace } from "@rupakarsa/shared/lib/types";
import { useAdminStore } from "@rupakarsa/shared/stores/admin-store";
import { useUiStore } from "@rupakarsa/shared/stores/ui-store";
import { useWorkspaceStore } from "@rupakarsa/shared/stores/workspace-store";
import { Button, Dialog, Field, Select, TextInput } from "@rupakarsa/shared/ui";

export function WorkspacesView() {
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const memberships = useWorkspaceStore((state) => state.memberships);
  const workspaceHydrated = useWorkspaceStore((state) => state.hydrated);
  const createWorkspace = useWorkspaceStore((state) => state.createWorkspace);
  const updateWorkspace = useWorkspaceStore((state) => state.updateWorkspace);
  const accounts = useAdminStore((state) => state.accounts);
  const adminHydrated = useAdminStore((state) => state.hydrated);
  const pushToast = useUiStore((state) => state.pushToast);

  const [createOpen, setCreateOpen] = useState(false);
  const [topUpTarget, setTopUpTarget] = useState<Workspace | null>(null);

  const [draftName, setDraftName] = useState("");
  const [draftSlug, setDraftSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [draftOwnerId, setDraftOwnerId] = useState("");
  const [draftTokens, setDraftTokens] = useState("0");
  const [draftPlan, setDraftPlan] = useState("0");
  const [draftActive, setDraftActive] = useState(true);

  const [topUpAmount, setTopUpAmount] = useState("1000");
  const [topUpPlan, setTopUpPlan] = useState("50");

  const activeCount = workspaces.filter((workspace) => workspace.isActive).length;
  const totalTokens = workspaces.reduce((total, workspace) => total + workspace.tokenBalance, 0);
  const totalPlan = workspaces.reduce(
    (total, workspace) => total + workspace.freePlanRemaining,
    0,
  );

  function ownerName(workspaceId: string): string {
    const ownerMembership = memberships.find(
      (membership) => membership.workspaceId === workspaceId && membership.role === "OWNER",
    );
    if (!ownerMembership) return "—";
    return (
      accounts.find((account) => account.id === ownerMembership.userId)?.fullName ??
      ownerMembership.userId
    );
  }

  function memberCount(workspaceId: string): number {
    return memberships.filter((membership) => membership.workspaceId === workspaceId).length;
  }

  function openCreate(): void {
    setDraftName("");
    setDraftSlug("");
    setSlugTouched(false);
    setDraftOwnerId(accounts[0]?.id ?? "");
    setDraftTokens("0");
    setDraftPlan("0");
    setDraftActive(true);
    setCreateOpen(true);
  }

  function handleCreate(): void {
    if (draftName.trim().length < 2) {
      pushToast("error", "Nama workspace minimal 2 karakter.");
      return;
    }
    if (!draftOwnerId) {
      pushToast("error", "Pilih owner workspace.");
      return;
    }
    const tokens = Number(draftTokens);
    const plan = Number(draftPlan);
    if (!Number.isFinite(tokens) || tokens < 0 || !Number.isFinite(plan) || plan < 0) {
      pushToast("error", "Token dan plan gratis tidak boleh negatif.");
      return;
    }

    const created = createWorkspace({
      name: draftName,
      slug: slugTouched ? draftSlug : undefined,
      ownerId: draftOwnerId,
      tokenBalance: Math.round(tokens),
      freePlanRemaining: Math.round(plan),
      isActive: draftActive,
    });
    if (!created.ok) {
      pushToast("error", created.message);
      return;
    }
    setCreateOpen(false);
    pushToast("success", `Workspace ${created.value.name} ditambahkan.`);
  }

  function openTopUp(workspace: Workspace): void {
    setTopUpTarget(workspace);
    setTopUpAmount("1000");
    setTopUpPlan("50");
  }

  function handleTopUp(): void {
    if (!topUpTarget) return;
    const amount = Number(topUpAmount);
    const plan = Number(topUpPlan);
    if (!Number.isFinite(amount) || amount <= 0) {
      pushToast("error", "Jumlah token harus lebih dari 0.");
      return;
    }
    const updated = updateWorkspace(topUpTarget.id, {
      tokenBalance: topUpTarget.tokenBalance + Math.round(amount),
      freePlanRemaining: topUpTarget.freePlanRemaining + Math.max(0, Math.round(plan) || 0),
    });
    if (!updated.ok) {
      pushToast("error", updated.message);
      return;
    }
    setTopUpTarget(null);
    pushToast("success", `Top-up ${formatTokens(Math.round(amount))} token berhasil.`);
  }

  function handleToggle(workspace: Workspace): void {
    const updated = updateWorkspace(workspace.id, { isActive: !workspace.isActive });
    if (!updated.ok) {
      pushToast("error", updated.message);
      return;
    }
    pushToast(
      "success",
      `${workspace.name} ${updated.value.isActive ? "diaktifkan" : "dinonaktifkan"}.`,
    );
  }

  if (!workspaceHydrated || !adminHydrated) {
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
          <span className="mono-label text-accent-strong">Kantong token</span>
          <h1 className="display mt-2 text-[clamp(2.2rem,4vw,3.4rem)] text-ink">Workspaces</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            Setiap workspace memiliki saldo token dan kuota Plan Mode sendiri. Semua anggota
            workspace memakai kantong yang sama.
          </p>
        </div>
        <Button
          variant="primary"
          size="lg"
          icon={<Plus className="size-4" aria-hidden />}
          onClick={openCreate}
        >
          Tambah workspace
        </Button>
      </header>

      <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-accent/20 bg-accent-soft/50 px-4 py-3.5">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent-strong" aria-hidden />
        <p className="text-xs leading-relaxed text-ink/70">
          <span className="font-medium text-ink">Token adalah milik workspace.</span> User mengambil
          token dari workspace aktifnya saat generate. Top-up dan kuota Plan Mode diatur di sini.
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total workspace", value: formatTokens(workspaces.length), icon: Building2 },
          { label: "Workspace aktif", value: formatTokens(activeCount), icon: ShieldCheck },
          { label: "Token beredar", value: formatTokens(totalTokens), icon: CircleDollarSign },
          { label: "Plan gratis", value: formatTokens(totalPlan), icon: Users },
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

      <div className="mt-4 overflow-hidden rounded-[1.75rem] border border-border bg-white">
        <div className="hidden grid-cols-[minmax(0,1.5fr)_0.8fr_0.5fr_0.6fr_0.5fr_0.5fr_7rem] items-center gap-4 border-b border-border bg-surface-2/40 px-6 py-3 text-[10px] uppercase tracking-[0.14em] text-muted xl:grid">
          <span>Workspace</span>
          <span>Owner</span>
          <span>Anggota</span>
          <span>Token</span>
          <span>Plan</span>
          <span>Status</span>
          <span className="text-right">Aksi</span>
        </div>

        {workspaces.map((workspace) => (
          <div
            key={workspace.id}
            className="grid gap-3 border-b border-border/60 px-6 py-4 last:border-b-0 xl:grid-cols-[minmax(0,1.5fr)_0.8fr_0.5fr_0.6fr_0.5fr_0.5fr_7rem] xl:items-center xl:gap-4"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ink text-canvas">
                <Building2 className="size-4" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{workspace.name}</p>
                <p className="truncate font-mono text-[10px] text-muted">{workspace.slug}</p>
                <p className="text-[9px] text-muted/70">
                  Dibuat {formatDate(workspace.createdAt)}
                </p>
              </div>
            </div>

            <p className="truncate whitespace-nowrap text-xs text-muted">{ownerName(workspace.id)}</p>
            <p className="whitespace-nowrap text-xs text-muted">
              {formatTokens(memberCount(workspace.id))} anggota
            </p>
            <p className="whitespace-nowrap text-sm font-semibold text-ink">
              {formatTokens(workspace.tokenBalance)}
            </p>
            <p className="whitespace-nowrap text-xs text-muted">
              {formatTokens(workspace.freePlanRemaining)}×
            </p>

            <button
              type="button"
              onClick={() => handleToggle(workspace)}
              aria-pressed={workspace.isActive}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                workspace.isActive ? "bg-success" : "bg-ink/15"
              }`}
              aria-label={`${workspace.isActive ? "Nonaktifkan" : "Aktifkan"} ${workspace.name}`}
            >
              <span
                className={`absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform ${
                  workspace.isActive ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>

            <Button
              variant="ghost"
              size="sm"
              className="justify-self-end"
              icon={<CircleDollarSign className="size-3.5" aria-hidden />}
              onClick={() => openTopUp(workspace)}
            >
              Top up
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-2xl border border-border bg-white/60 px-4 py-3 text-[11px] leading-relaxed text-muted">
        <CircleDollarSign className="mt-0.5 size-3.5 shrink-0 text-accent" aria-hidden />
        <p>
          Top-up menambah saldo workspace. Semua anggota langsung memakai saldo baru saat generate.
          Penghapusan workspace dilakukan owner dari Creator.
        </p>
      </div>

      <Dialog
        open={createOpen}
        title="Tambah workspace"
        description="Workspace baru mendapat kantong token sendiri dan satu owner."
        onClose={() => setCreateOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleCreate}>
              Tambah workspace
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="Nama workspace" htmlFor="cms-workspace-name">
            <TextInput
              id="cms-workspace-name"
              value={draftName}
              onChange={(event) => {
                setDraftName(event.target.value);
                if (!slugTouched) setDraftSlug(slugify(event.target.value));
              }}
              placeholder="Contoh: Lumiere Lab"
              autoFocus
            />
          </Field>
          <Field
            label="Slug workspace"
            htmlFor="cms-workspace-slug"
            hint="Huruf kecil, angka, dan tanda hubung. Slug tidak dapat diubah setelah dibuat."
          >
            <TextInput
              id="cms-workspace-slug"
              value={draftSlug}
              onChange={(event) => {
                setSlugTouched(true);
                setDraftSlug(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"));
              }}
              placeholder="lumiere-lab"
            />
          </Field>
          <Field label="Owner" htmlFor="cms-workspace-owner" hint="Owner dapat menghapus workspace.">
            <Select
              id="cms-workspace-owner"
              value={draftOwnerId}
              onChange={setDraftOwnerId}
              options={accounts.map((account) => ({
                value: account.id,
                label: account.fullName,
                description: account.email,
              }))}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Token awal" htmlFor="cms-workspace-tokens">
              <TextInput
                id="cms-workspace-tokens"
                type="number"
                min={0}
                value={draftTokens}
                onChange={(event) => setDraftTokens(event.target.value)}
              />
            </Field>
            <Field label="Plan gratis" htmlFor="cms-workspace-plan">
              <TextInput
                id="cms-workspace-plan"
                type="number"
                min={0}
                value={draftPlan}
                onChange={(event) => setDraftPlan(event.target.value)}
              />
            </Field>
          </div>
          <label className="flex items-start gap-3 rounded-xl border border-border bg-surface-2/60 px-3 py-3">
            <input
              type="checkbox"
              checked={draftActive}
              onChange={(event) => setDraftActive(event.target.checked)}
              className="mt-0.5 size-4 accent-[#d93e14]"
            />
            <span>
              <span className="block text-xs font-medium text-ink">Aktifkan workspace</span>
              <span className="mt-0.5 block text-[10px] leading-relaxed text-muted">
                Anggota workspace aktif dapat memakai saldo workspace untuk produksi.
              </span>
            </span>
          </label>
        </div>
      </Dialog>

      <Dialog
        open={Boolean(topUpTarget)}
        title={`Top up ${topUpTarget?.name ?? ""}`}
        description="Tambahkan saldo token dan kuota Plan Mode ke kantong workspace."
        onClose={() => setTopUpTarget(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setTopUpTarget(null)}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleTopUp}>
              Top up
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-border bg-surface-2/60 px-3 py-2 text-[11px] text-muted">
            Saldo saat ini:{" "}
            <span className="font-medium text-ink">
              {formatTokens(topUpTarget?.tokenBalance ?? 0)} token
            </span>{" "}
            · {formatTokens(topUpTarget?.freePlanRemaining ?? 0)}× plan gratis
          </div>
          <Field label="Tambah token" htmlFor="cms-workspace-topup-amount">
            <TextInput
              id="cms-workspace-topup-amount"
              type="number"
              min={1}
              value={topUpAmount}
              onChange={(event) => setTopUpAmount(event.target.value)}
            />
          </Field>
          <Field label="Tambah plan gratis" htmlFor="cms-workspace-topup-plan">
            <TextInput
              id="cms-workspace-topup-plan"
              type="number"
              min={0}
              value={topUpPlan}
              onChange={(event) => setTopUpPlan(event.target.value)}
            />
          </Field>
        </div>
      </Dialog>
    </div>
  );
}
