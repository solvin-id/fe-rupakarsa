"use client";

import { Building2, CircleDollarSign, Plus, ShieldCheck, Users } from "lucide-react";
import { useState } from "react";

import { formatDate, formatTokens } from "@rupakarsa/shared/lib/format";
import { readTenantWallet } from "@rupakarsa/shared/lib/tenant-wallet-cookie";
import type { Tenant } from "@rupakarsa/shared/lib/types";
import { useAdminStore } from "@rupakarsa/shared/stores/admin-store";
import { useUiStore } from "@rupakarsa/shared/stores/ui-store";
import { Button, Dialog, Field, TextInput } from "@rupakarsa/shared/ui";

export function TenantsView() {
  const tenants = useAdminStore((state) => state.tenants);
  const users = useAdminStore((state) => state.users);
  const createTenant = useAdminStore((state) => state.createTenant);
  const topUpTenant = useAdminStore((state) => state.topUpTenant);
  const toggleTenant = useAdminStore((state) => state.toggleTenant);
  const pushToast = useUiStore((state) => state.pushToast);

  const [createOpen, setCreateOpen] = useState(false);
  const [topUpTarget, setTopUpTarget] = useState<Tenant | null>(null);

  const [draftName, setDraftName] = useState("");
  const [draftSlug, setDraftSlug] = useState("");
  const [draftTokens, setDraftTokens] = useState("0");
  const [draftPlan, setDraftPlan] = useState("0");
  const [draftActive, setDraftActive] = useState(true);

  const [topUpAmount, setTopUpAmount] = useState("1000");
  const [topUpPlan, setTopUpPlan] = useState("50");

  const activeCount = tenants.filter((tenant) => tenant.isActive).length;

  function walletFor(tenant: Tenant): { tokenBalance: number; freePlanRemaining: number } {
    const wallet = readTenantWallet(tenant.id);
    return {
      tokenBalance: wallet?.tokenBalance ?? tenant.tokenBalance,
      freePlanRemaining: wallet?.freePlanRemaining ?? tenant.freePlanRemaining,
    };
  }

  const totalTokens = tenants.reduce((total, tenant) => total + walletFor(tenant).tokenBalance, 0);
  const totalPlan = tenants.reduce(
    (total, tenant) => total + walletFor(tenant).freePlanRemaining,
    0,
  );

  function userCount(tenantId: string): number {
    return users.filter((user) => user.tenantId === tenantId).length;
  }

  function openCreate(): void {
    setDraftName("");
    setDraftSlug("");
    setDraftTokens("0");
    setDraftPlan("0");
    setDraftActive(true);
    setCreateOpen(true);
  }

  function handleCreate(): void {
    if (draftName.trim().length < 2) {
      pushToast("error", "Nama tenant minimal 2 karakter.");
      return;
    }
    if (draftSlug.trim().length < 2) {
      pushToast("error", "Slug tenant minimal 2 karakter.");
      return;
    }
    const tokens = Number(draftTokens);
    const plan = Number(draftPlan);
    if (!Number.isFinite(tokens) || tokens < 0 || !Number.isFinite(plan) || plan < 0) {
      pushToast("error", "Token dan plan gratis tidak boleh negatif.");
      return;
    }

    const tenant = createTenant({
      name: draftName,
      slug: draftSlug,
      tokenBalance: Math.round(tokens),
      freePlanRemaining: Math.round(plan),
      isActive: draftActive,
    });
    if (!tenant) {
      pushToast("error", "Slug tenant sudah dipakai.");
      return;
    }
    setCreateOpen(false);
    pushToast("success", `Tenant ${tenant.name} ditambahkan.`);
  }

  function openTopUp(tenant: Tenant): void {
    setTopUpTarget(tenant);
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
    topUpTenant(topUpTarget.id, Math.round(amount), Math.max(0, Math.round(plan) || 0));
    setTopUpTarget(null);
    pushToast("success", `Top-up ${formatTokens(Math.round(amount))} token berhasil.`);
  }

  return (
    <div className="animate-fade-up">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="mono-label text-accent-strong">Kantong token</span>
          <h1 className="display mt-2 text-[clamp(2.2rem,4vw,3.4rem)] text-ink">Tenants</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            Setiap tenant memiliki saldo token dan kuota Plan Mode. Semua user tenant memakai
            kantong yang sama.
          </p>
        </div>
        <Button
          variant="primary"
          size="lg"
          icon={<Plus className="size-4" aria-hidden />}
          onClick={openCreate}
        >
          Tambah tenant
        </Button>
      </header>

      <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-accent/20 bg-accent-soft/50 px-4 py-3.5">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent-strong" aria-hidden />
        <p className="text-xs leading-relaxed text-ink/70">
          <span className="font-medium text-ink">Token adalah milik tenant.</span> User mengambil
          token dari kantong tenant saat generate. Top-up dan kuota Plan Mode diatur di sini.
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total tenant", value: formatTokens(tenants.length), icon: Building2 },
          { label: "Tenant aktif", value: formatTokens(activeCount), icon: ShieldCheck },
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
        <div className="hidden grid-cols-[minmax(0,1.4fr)_0.6fr_0.7fr_0.6fr_0.55fr_7.5rem] items-center gap-4 border-b border-border bg-surface-2/40 px-6 py-3 text-[10px] uppercase tracking-[0.14em] text-muted xl:grid">
          <span>Tenant</span>
          <span>Users</span>
          <span>Token</span>
          <span>Plan</span>
          <span>Status</span>
          <span className="text-right">Aksi</span>
        </div>

        {tenants.map((tenant) => (
          <div
            key={tenant.id}
            className="grid gap-3 border-b border-border/60 px-6 py-4 last:border-b-0 xl:grid-cols-[minmax(0,1.4fr)_0.6fr_0.7fr_0.6fr_0.55fr_7.5rem] xl:items-center xl:gap-4"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ink text-canvas">
                <Building2 className="size-4" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{tenant.name}</p>
                <p className="truncate font-mono text-[10px] text-muted">{tenant.slug}</p>
                <p className="text-[9px] text-muted/70">Dibuat {formatDate(tenant.createdAt)}</p>
              </div>
            </div>

            <p className="whitespace-nowrap text-xs text-muted">{userCount(tenant.id)} user</p>
            <p className="whitespace-nowrap text-sm font-semibold text-ink">
              {formatTokens(walletFor(tenant).tokenBalance)}
            </p>
            <p className="whitespace-nowrap text-xs text-muted">
              {formatTokens(walletFor(tenant).freePlanRemaining)}×
            </p>

            <button
              type="button"
              onClick={() => toggleTenant(tenant.id)}
              aria-pressed={tenant.isActive}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                tenant.isActive ? "bg-success" : "bg-ink/15"
              }`}
              aria-label={`${tenant.isActive ? "Nonaktifkan" : "Aktifkan"} ${tenant.name}`}
            >
              <span
                className={`absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform ${
                  tenant.isActive ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>

            <Button
              variant="ghost"
              size="sm"
              className="justify-self-end"
              icon={<CircleDollarSign className="size-3.5" aria-hidden />}
              onClick={() => openTopUp(tenant)}
            >
              Top up
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-2xl border border-border bg-white/60 px-4 py-3 text-[11px] leading-relaxed text-muted">
        <CircleDollarSign className="mt-0.5 size-3.5 shrink-0 text-accent" aria-hidden />
        <p>
          Top-up menambah saldo tenant. User dari tenant tersebut langsung memakai saldo baru saat
          generate—tanpa top-up per akun.
        </p>
      </div>

      <Dialog
        open={createOpen}
        title="Tambah tenant"
        description="Tenant baru mendapat kantong token sendiri."
        onClose={() => setCreateOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleCreate}>
              Tambah tenant
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="Nama tenant" htmlFor="tenant-name">
            <TextInput
              id="tenant-name"
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              placeholder="Contoh: Nama tenant"
              autoFocus
            />
          </Field>
          <Field
            label="Slug tenant"
            htmlFor="tenant-slug"
            hint="Huruf kecil, angka, dan tanda hubung. Contoh: alfateve."
          >
            <TextInput
              id="tenant-slug"
              value={draftSlug}
              onChange={(event) =>
                setDraftSlug(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))
              }
              placeholder="alfateve"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Token awal" htmlFor="tenant-tokens">
              <TextInput
                id="tenant-tokens"
                type="number"
                min={0}
                value={draftTokens}
                onChange={(event) => setDraftTokens(event.target.value)}
              />
            </Field>
            <Field label="Plan gratis" htmlFor="tenant-plan">
              <TextInput
                id="tenant-plan"
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
              <span className="block text-xs font-medium text-ink">Aktifkan tenant</span>
              <span className="mt-0.5 block text-[10px] leading-relaxed text-muted">
                User dari tenant aktif dapat login dan memakai saldo tenant.
              </span>
            </span>
          </label>
        </div>
      </Dialog>

      <Dialog
        open={Boolean(topUpTarget)}
        title={`Top up ${topUpTarget?.name ?? ""}`}
        description="Tambahkan saldo token dan kuota Plan Mode ke kantong tenant."
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
              {formatTokens(topUpTarget ? walletFor(topUpTarget).tokenBalance : 0)} token
            </span>{" "}
            · {formatTokens(topUpTarget ? walletFor(topUpTarget).freePlanRemaining : 0)}× plan
            gratis
          </div>
          <Field label="Tambah token" htmlFor="tenant-topup-amount">
            <TextInput
              id="tenant-topup-amount"
              type="number"
              min={1}
              value={topUpAmount}
              onChange={(event) => setTopUpAmount(event.target.value)}
            />
          </Field>
          <Field label="Tambah plan gratis" htmlFor="tenant-topup-plan">
            <TextInput
              id="tenant-topup-plan"
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
