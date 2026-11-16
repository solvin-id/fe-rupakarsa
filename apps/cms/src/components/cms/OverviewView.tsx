"use client";

import {
  ArrowRight,
  Building2,
  CircleDollarSign,
  KeyRound,
  Settings2,
  Sparkles,
  UserCog,
  Users,
} from "lucide-react";
import Link from "next/link";

import { formatTokens } from "@rupakarsa/shared/lib/format";
import { useAdminStore } from "@rupakarsa/shared/stores/admin-store";
import { useWorkspaceStore } from "@rupakarsa/shared/stores/workspace-store";

const STEPS = [
  {
    title: "Akun dibuat sebagai USER",
    description: "Setiap akun baru default kreator dan mendapat satu workspace personal.",
  },
  {
    title: "Superadmin memberi akses CMS",
    description: "Aktifkan toggle Akses CMS di Users & akses. User biasa tetap USER.",
  },
  {
    title: "User login ke CMS",
    description: "Akun dengan akses CMS bisa masuk ke surface CMS dengan kredensial yang sama.",
  },
];

export function OverviewView() {
  const accounts = useAdminStore((state) => state.accounts);
  const providers = useAdminStore((state) => state.providers);
  const models = useAdminStore((state) => state.models);
  const workspaces = useWorkspaceStore((state) => state.workspaces);

  const activeWorkspaces = workspaces.filter((workspace) => workspace.isActive).length;
  const activeUsers = accounts.filter((account) => account.isActive).length;
  const totalTokens = workspaces.reduce((total, workspace) => total + workspace.tokenBalance, 0);
  const activeModels = models.filter((model) => model.isActive).length;
  const activeProviders = providers.filter((provider) => provider.isActive).length;

  return (
    <div className="animate-fade-up">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="mono-label text-accent-strong">CMS overview</span>
          <h1 className="display mt-2 text-[clamp(2.2rem,4vw,3.4rem)] text-ink">
            Kendali platform
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            Pantau workspace, akses CMS, token beredar, dan kesiapan provider dalam satu layar.
          </p>
        </div>
        <Link
          href="/users"
          className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-canvas transition-colors hover:bg-ink-soft"
        >
          Kelola akses CMS
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </header>

      <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Workspace",
            value: formatTokens(workspaces.length),
            hint: `${activeWorkspaces} aktif`,
            icon: Building2,
          },
          {
            label: "Total user",
            value: formatTokens(accounts.length),
            hint: `${activeUsers} aktif`,
            icon: Users,
          },
          {
            label: "Token beredar",
            value: formatTokens(totalTokens),
            hint: "saldo seluruh workspace",
            icon: CircleDollarSign,
          },
          {
            label: "Model aktif",
            value: formatTokens(activeModels),
            hint: `${activeProviders} provider aktif`,
            icon: Settings2,
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="card p-4">
              <div className="flex items-center justify-between">
                <p className="mono-label text-[9px] text-muted">{item.label}</p>
                <span className="flex size-8 items-center justify-center rounded-xl bg-canvas-2 text-ink">
                  <Icon className="size-4" aria-hidden />
                </span>
              </div>
              <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-ink">{item.value}</p>
              <p className="mt-1 text-[10px] text-muted">{item.hint}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="card p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="mono-label text-muted">Akses CMS</p>
              <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-ink">
                Siapa yang bisa masuk CMS
              </h2>
            </div>
            <Link
              href="/users"
              className="text-xs font-medium text-ink transition-colors hover:text-accent-strong"
            >
              Atur akses
            </Link>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-border">
            {accounts.map((account) => {
              const hasAccess = account.role === "SUPERADMIN" || account.cmsAccess;
              return (
                <div
                  key={account.id}
                  className="flex items-center gap-3 border-b border-border/60 px-4 py-3 last:border-b-0"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-ink text-[11px] font-semibold text-canvas">
                    {account.fullName.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-ink">{account.fullName}</p>
                    <p className="truncate text-[10px] text-muted">{account.email}</p>
                  </div>
                  <span className="hidden rounded-full border border-border px-2 py-0.5 text-[9px] text-muted sm:inline">
                    {account.role}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[9px] font-medium ${
                      hasAccess ? "bg-success/10 text-success" : "bg-canvas-2 text-muted"
                    }`}
                  >
                    {hasAccess ? "CMS" : "Creator"}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="card p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-accent" aria-hidden />
            <div>
              <p className="mono-label text-muted">Alur akses</p>
              <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-ink">
                CREATOR → CMS
              </h2>
            </div>
          </div>

          <ol className="mt-4 flex flex-col gap-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-3">
                <span className="mono-label mt-0.5 text-accent-strong">0{index + 1}</span>
                <div>
                  <p className="text-xs font-medium text-ink">{step.title}</p>
                  <p className="mt-0.5 text-[10px] leading-relaxed text-muted">
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            href: "/workspaces",
            label: "Workspaces",
            description: "Kantong token, plan gratis, dan status workspace.",
            icon: Building2,
          },
          {
            href: "/users",
            label: "Users & akses",
            description: "Daftarkan user dan atur akses CMS.",
            icon: UserCog,
          },
          {
            href: "/providers",
            label: "Providers",
            description: "API key Kenari AI, Higgsfield, R2.",
            icon: KeyRound,
          },
          {
            href: "/models",
            label: "Models & tarif",
            description: "Aktivasi model dan tarif token.",
            icon: Settings2,
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-start gap-3 rounded-2xl border border-border bg-white/70 p-4 transition-all hover:-translate-y-0.5 hover:border-ink/20 hover:shadow-card"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-canvas-2 text-ink">
                <Icon className="size-4" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-medium text-ink">{item.label}</p>
                <p className="mt-0.5 text-[10px] leading-relaxed text-muted">
                  {item.description}
                </p>
              </div>
              <ArrowRight
                className="ml-auto mt-1 size-3.5 text-muted/50 transition-transform group-hover:translate-x-0.5 group-hover:text-ink"
                aria-hidden
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
