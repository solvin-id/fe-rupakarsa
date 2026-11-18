"use client";

import {
  Activity,
  Building2,
  ChevronRight,
  HardDrive,
  KeyRound,
  LayoutGrid,
  LogOut,
  Menu,
  Settings,
  Settings2,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Logo } from "@rupakarsa/shared/brand";
import { useAdminWorkspacesQuery } from "@rupakarsa/shared/hooks/use-admin";
import { useLogoutMutation, useSessionQuery } from "@rupakarsa/shared/hooks/use-session";
import { hasCmsAccess } from "@rupakarsa/shared/lib/auth";
import { formatTokens } from "@rupakarsa/shared/lib/format";
import { SurfaceSwitcher } from "@rupakarsa/shared/surface";
import { useUiStore } from "@rupakarsa/shared/stores/ui-store";
import { Button, ToastViewport } from "@rupakarsa/shared/ui";

const CREATOR_URL = process.env.NEXT_PUBLIC_CREATOR_URL ?? "http://localhost:3000";
const CMS_URL = process.env.NEXT_PUBLIC_CMS_URL ?? "http://localhost:3001";

const NAV = [
  { href: "/overview", label: "Overview", icon: LayoutGrid },
  { href: "/workspaces", label: "Workspaces", icon: Building2 },
  { href: "/users", label: "Users & akses", icon: Users },
  { href: "/providers", label: "Providers", icon: KeyRound },
  { href: "/models", label: "Models & tarif", icon: Settings2 },
  { href: "/ai-activity", label: "AI activity", icon: Activity },
  { href: "/storage", label: "Storage", icon: HardDrive },
  { href: "/settings", label: "Settings", icon: Settings },
];

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function CmsFrame({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const sessionQuery = useSessionQuery();
  const workspacesQuery = useAdminWorkspacesQuery();
  const logout = useLogoutMutation();
  const pushToast = useUiStore((state) => state.pushToast);

  const [mobileOpen, setMobileOpen] = useState(false);

  const session = sessionQuery.data ?? null;
  const signedOut = sessionQuery.isError || sessionQuery.data === null;

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
  const allowed = hasCmsAccess(user);
  const workspaces = workspacesQuery.data?.workspaces ?? [];
  const activeWorkspaces = workspaces.filter((workspace) => workspace.isActive).length;

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

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 py-5">
        <Logo dark onClick={() => setMobileOpen(false)} />
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="flex size-8 items-center justify-center rounded-full text-canvas/60 hover:bg-white/10 hover:text-canvas lg:hidden"
          aria-label="Tutup menu"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>

      <div className="mx-4 rounded-2xl border border-white/10 bg-white/[0.04] px-3.5 py-3">
        <p className="mono-label text-[9px] text-canvas/40">Surface</p>
        <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-canvas">
          Rupakarsa CMS
          <span className="rounded-full bg-accent/20 px-1.5 py-0.5 text-[9px] font-medium text-accent">
            Admin
          </span>
        </p>
      </div>

      <div className="mx-4 mt-3">
        <p className="mono-label px-1 pb-1.5 text-[9px] text-canvas/35">Pindah surface</p>
        <SurfaceSwitcher
          active="cms"
          creatorUrl={CREATOR_URL}
          cmsUrl={CMS_URL}
          canUseCms
          dark
        />
      </div>

      <nav className="mt-5 flex flex-1 flex-col gap-1 px-3" aria-label="Navigasi CMS">
        <p className="mono-label px-2 pb-1 text-[9px] text-canvas/35">Kendali platform</p>
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                active
                  ? "bg-canvas text-ink"
                  : "text-canvas/60 hover:bg-white/[0.06] hover:text-canvas"
              }`}
            >
              <Icon className="size-4" aria-hidden />
              {item.label}
              {active ? <ChevronRight className="ml-auto size-3.5" aria-hidden /> : null}
            </Link>
          );
        })}

        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
          <p className="mono-label text-[8px] text-canvas/35">Workspace aktif</p>
          <p className="mt-1 text-lg font-semibold text-canvas">{formatTokens(activeWorkspaces)}</p>
          <p className="text-[9px] text-canvas/40">Kantong token per workspace</p>
        </div>
      </nav>

      <div className="border-t border-white/10 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-full bg-canvas text-xs font-semibold text-ink">
            {user.fullName.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-canvas">{user.fullName}</p>
            <p className="truncate text-[10px] text-canvas/40">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            aria-label="Keluar CMS"
            className="flex size-8 items-center justify-center rounded-full text-canvas/50 transition-colors hover:bg-white/10 hover:text-danger"
          >
            <LogOut className="size-3.5" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );

  if (!allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas px-5">
        <div className="w-full max-w-lg rounded-[1.75rem] border border-border bg-white p-8 text-center shadow-card">
          <ShieldCheck className="mx-auto size-8 text-accent" aria-hidden />
          <h1 className="mt-3 text-xl font-semibold text-ink">Akses CMS tidak tersedia</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Akun <span className="font-medium text-ink">{user.email}</span> tidak memiliki akses
            CMS. Minta Superadmin mengaktifkan akses melalui Users &amp; akses.
          </p>
          <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
            <a href={`${CREATOR_URL}/app/projects`}>
              <Button variant="secondary" className="w-full sm:w-auto">
                Buka Creator
              </Button>
            </a>
            <Button variant="primary" onClick={handleSignOut}>
              Keluar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-ink lg:block">{sidebar}</aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Tutup menu"
            className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-[min(18rem,85vw)] bg-ink shadow-lift">
            {sidebar}
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-border/70 bg-canvas/85 backdrop-blur-xl">
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
                <LayoutGrid className="size-3.5" aria-hidden />
                <span>CMS</span>
                <ChevronRight className="size-3" aria-hidden />
                <span className="text-ink">
                  {user.role === "SUPERADMIN" ? "Superadmin" : "CMS access"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden items-center gap-1.5 rounded-full border border-border bg-white/60 px-3 py-1.5 text-[11px] text-muted sm:inline-flex">
                <span className="size-1.5 rounded-full bg-success" aria-hidden />
                {user.role === "SUPERADMIN" ? "Superadmin" : "CMS access"}
              </span>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">{children}</main>
      </div>

      <ToastViewport />
    </div>
  );
}
