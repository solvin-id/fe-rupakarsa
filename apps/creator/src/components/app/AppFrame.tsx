"use client";

import {
  Building2,
  ChevronRight,
  CircleDollarSign,
  FolderKanban,
  FolderOpen,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Logo } from "@rupakarsa/shared/brand";
import { useGenerationStream } from "@rupakarsa/shared/hooks/use-generation-stream";
import { useLogoutMutation, usePublicConfigQuery, useSessionQuery } from "@rupakarsa/shared/hooks/use-session";
import { useWorkspacesQuery } from "@rupakarsa/shared/hooks/use-workspaces";
import { hasCmsAccess } from "@rupakarsa/shared/lib/auth";
import { formatTokens, formatWorkspaceRole } from "@rupakarsa/shared/lib/format";
import { useUiStore } from "@rupakarsa/shared/stores/ui-store";
import { SurfaceSwitcher } from "@rupakarsa/shared/surface";
import { Button, ToastViewport } from "@rupakarsa/shared/ui";

import { ChangePasswordDialog } from "@/components/app/ChangePasswordDialog";
import { GenerationBell } from "@/components/app/GenerationBell";
import { TopUpDialog } from "@/components/workspace/TopUpDialog";
import { WorkspaceSwitcher } from "@/components/workspace/WorkspaceSwitcher";

const CREATOR_URL = process.env.NEXT_PUBLIC_CREATOR_URL ?? "http://localhost:3000";
const CMS_URL = process.env.NEXT_PUBLIC_CMS_URL ?? "http://localhost:3001";

const USER_NAV = [
  { href: "/app/workspaces", label: "Workspace", icon: Building2 },
  { href: "/app/projects", label: "Proyek", icon: FolderKanban },
  { href: "/app/storage", label: "Penyimpanan", icon: FolderOpen },
  { href: "/app/security", label: "Keamanan", icon: ShieldCheck },
];

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppFrame({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const sessionQuery = useSessionQuery();
  const workspacesQuery = useWorkspacesQuery();
  const configQuery = usePublicConfigQuery();
  const logout = useLogoutMutation();
  const pushToast = useUiStore((state) => state.pushToast);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [topUpOpen, setTopUpOpen] = useState(false);

  const session = sessionQuery.data ?? null;
  const signedOut = sessionQuery.isError || sessionQuery.data === null;

  useGenerationStream(session?.workspace.id ?? null);

  useEffect(() => {
    if (!signedOut) return;
    router.replace("/login");
  }, [signedOut, router]);

  if (sessionQuery.isPending || workspacesQuery.isPending || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <span className="size-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  const user = session.user;
  const workspace = session.workspace;
  const memberships = workspacesQuery.data?.memberships ?? session.memberships;
  const workspaces = workspacesQuery.data?.workspaces ?? session.workspaces;
  const workspaceRole = session.activeWorkspaceRole;
  const canOpenCms = hasCmsAccess(user);
  const balance = workspace.tokenBalance;
  const planQuota = workspace.freePlanRemaining;
  const packageTokens = configQuery.data?.pricing.packageTokens ?? 4000;

  function handleSignOut(): void {
    logout.mutate(undefined, {
      onSuccess: () => {
        router.replace("/login");
      },
      onError: (error) => {
        // 401 means the session is already gone elsewhere; finish the local sign-out.
        if ((error as { status?: number }).status === 401) {
          router.replace("/login");
          return;
        }
        pushToast("error", error.message);
      },
    });
  }

  function handleTopUp(): void {
    setTopUpOpen(true);
  }

  if (!workspace.isActive) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas px-5">
        <div className="w-full max-w-lg rounded-[1.75rem] border border-border bg-white p-8 text-center shadow-card">
          <ShieldAlert className="mx-auto size-8 text-accent" aria-hidden />
          <h1 className="mt-3 text-xl font-semibold text-ink">Workspace tidak aktif</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Workspace {workspace.name} sedang dinonaktifkan. Hubungi Superadmin Rupakarsa untuk
            mengaktifkan kembali.
          </p>
          <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
            {canOpenCms ? (
              <a href={`${CMS_URL}/workspaces`}>
                <Button variant="secondary" className="w-full sm:w-auto">
                  Buka CMS
                </Button>
              </a>
            ) : null}
            <Button variant="primary" loading={logout.isPending} onClick={handleSignOut}>
              Keluar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 py-5">
        <Logo onClick={() => setMobileOpen(false)} />
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="flex size-8 items-center justify-center rounded-full text-muted hover:bg-ink/5 hover:text-ink lg:hidden"
          aria-label="Tutup menu"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>

      <div className="mx-4 rounded-2xl border border-border bg-surface-2/70 px-3.5 py-3">
        <p className="mono-label text-[9px] text-muted">Workspace aktif</p>
        <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-ink">
          <span className="truncate">{workspace.name}</span>
          <span
            className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium ${
              workspace.isActive ? "bg-accent-3-soft text-[#3f6212]" : "bg-danger/10 text-danger"
            }`}
          >
            {workspace.isActive ? "Aktif" : "Nonaktif"}
          </span>
        </p>
        <p className="mt-0.5 truncate font-mono text-[10px] text-muted">{workspace.slug}</p>
        <p className="mt-1 text-[10px] text-muted">
          Role Anda:{" "}
          <span className="font-medium text-ink">{formatWorkspaceRole(workspaceRole)}</span>
        </p>
        <div className="mt-2.5">
          <WorkspaceSwitcher
            activeWorkspace={workspace}
            memberships={memberships}
            workspaces={workspaces}
          />
        </div>
      </div>

      <div className="mx-4 mt-3">
        <p className="mono-label px-1 pb-1.5 text-[9px] text-muted/70">Surface</p>
        <SurfaceSwitcher
          active="creator"
          creatorUrl={CREATOR_URL}
          cmsUrl={CMS_URL}
          canUseCms={canOpenCms}
        />
      </div>

      <nav className="mt-5 flex flex-1 flex-col gap-1 px-3" aria-label="Navigasi workspace">
        <p className="mono-label px-2 pb-1 text-[9px] text-muted/70">Creator</p>
        {USER_NAV.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                active ? "bg-ink text-canvas" : "text-muted hover:bg-ink/5 hover:text-ink"
              }`}
            >
              <Icon className="size-4" aria-hidden />
              {item.label}
              {active ? <ChevronRight className="ml-auto size-3.5" aria-hidden /> : null}
            </Link>
          );
        })}
      </nav>

      <div className="m-3 rounded-2xl border border-border bg-white p-3.5 shadow-card">
        <div className="flex items-center justify-between">
          <p className="mono-label text-[9px] text-muted">Saldo workspace</p>
          <CircleDollarSign className="size-3.5 text-accent" aria-hidden />
        </div>
        <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-ink">
          {formatTokens(balance)}
        </p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink/10">
          <div
            className="h-full rounded-full bg-accent"
            style={{ width: `${Math.min(100, (balance / packageTokens) * 100)}%` }}
          />
        </div>
        <p className="mt-2 text-[10px] text-muted">
          {formatTokens(planQuota)} Plan Mode gratis tersisa
        </p>
        <Button
          variant="soft"
          size="sm"
          className="mt-3 w-full"
          icon={<Sparkles className="size-3.5" aria-hidden />}
          onClick={handleTopUp}
        >
          Cara top-up
        </Button>
      </div>

      <div className="border-t border-border px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-full bg-ink text-xs font-semibold text-canvas">
            {user.fullName.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-ink">{user.fullName}</p>
            <p className="truncate text-[10px] text-muted">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={() => setPasswordOpen(true)}
            aria-label="Ubah password"
            className="flex size-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-ink/5 hover:text-ink"
          >
            <KeyRound className="size-3.5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            aria-label="Keluar"
            className="flex size-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-ink/5 hover:text-danger"
          >
            <LogOut className="size-3.5" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-canvas">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border bg-surface/80 backdrop-blur-xl lg:block">
        {sidebar}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Tutup menu"
            className="absolute inset-0 bg-ink/35 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-[min(18rem,85vw)] border-r border-border bg-surface shadow-lift">
            {sidebar}
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-border/70 bg-canvas/80 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="flex size-9 items-center justify-center rounded-full border border-border bg-white/60 text-ink lg:hidden"
                aria-label="Buka menu"
              >
                <Menu className="size-4" aria-hidden />
              </button>
              <div className="hidden items-center gap-2 text-xs text-muted sm:flex">
                <LayoutDashboard className="size-3.5" aria-hidden />
                <span>Creator</span>
                <ChevronRight className="size-3" aria-hidden />
                <span className="text-ink">{workspace.name}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <GenerationBell />
              <span className="hidden items-center gap-1.5 rounded-full border border-border bg-white/60 px-3 py-1.5 text-[11px] text-muted sm:inline-flex">
                <span className="size-1.5 rounded-full bg-success" aria-hidden />
                {formatWorkspaceRole(workspaceRole)}
              </span>
              <button
                type="button"
                onClick={handleTopUp}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white/60 px-3 py-1.5 text-[11px] text-ink transition-colors hover:border-ink/30"
              >
                <CircleDollarSign className="size-3.5 text-accent" aria-hidden />
                {formatTokens(balance)} token
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">{children}</main>
      </div>

      <ChangePasswordDialog open={passwordOpen} onClose={() => setPasswordOpen(false)} />
      <TopUpDialog open={topUpOpen} onClose={() => setTopUpOpen(false)} />
      <ToastViewport />
    </div>
  );
}
