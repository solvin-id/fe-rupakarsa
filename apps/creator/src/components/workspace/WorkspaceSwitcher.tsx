"use client";

import { Check, ChevronsUpDown, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { formatTokens, formatWorkspaceRole } from "@rupakarsa/shared/lib/format";
import type { Workspace, WorkspaceMembership } from "@rupakarsa/shared/lib/types";
import { useSessionStore } from "@rupakarsa/shared/stores/session-store";
import { useUiStore } from "@rupakarsa/shared/stores/ui-store";

export interface WorkspaceSwitcherProps {
  activeWorkspace: Workspace;
  memberships: WorkspaceMembership[];
  workspaces: Workspace[];
}

export function WorkspaceSwitcher({
  activeWorkspace,
  memberships,
  workspaces,
}: WorkspaceSwitcherProps) {
  const router = useRouter();
  const switchWorkspace = useSessionStore((state) => state.switchWorkspace);
  const pushToast = useUiStore((state) => state.pushToast);

  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const activeRole =
    memberships.find((membership) => membership.workspaceId === activeWorkspace.id)?.role ?? null;

  function selectWorkspace(workspace: Workspace): void {
    if (workspace.id === activeWorkspace.id) {
      setOpen(false);
      return;
    }
    const switched = switchWorkspace(workspace.id);
    setOpen(false);
    if (!switched) {
      pushToast("error", `${workspace.name} sedang tidak aktif.`);
      return;
    }
    router.push("/app/projects");
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Ganti workspace"
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-white px-3 py-2 text-left transition-colors hover:border-border-strong"
      >
        <span className="min-w-0">
          <span className="block truncate text-xs font-medium text-ink">
            {activeWorkspace.name}
          </span>
          <span className="block truncate text-[10px] text-muted">
            {activeRole ? formatWorkspaceRole(activeRole) : "Tanpa role"}
          </span>
        </span>
        <ChevronsUpDown className="size-3.5 shrink-0 text-muted" aria-hidden />
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label="Daftar workspace"
          className="absolute left-0 right-0 top-full z-30 mt-1.5 max-h-64 overflow-y-auto rounded-xl border border-border bg-white p-1 shadow-lift"
        >
          {memberships.map((membership) => {
            const workspace = workspaces.find((item) => item.id === membership.workspaceId);
            if (!workspace) return null;
            const active = workspace.id === activeWorkspace.id;
            return (
              <button
                key={membership.id}
                type="button"
                role="option"
                aria-selected={active}
                disabled={!workspace.isActive}
                onClick={() => selectWorkspace(workspace)}
                className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors ${
                  active ? "bg-canvas-2" : "hover:bg-canvas-2"
                } ${workspace.isActive ? "" : "cursor-not-allowed opacity-45"}`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-medium text-ink">
                    {workspace.name}
                  </span>
                  <span className="block truncate text-[10px] text-muted">
                    {formatWorkspaceRole(membership.role)} · {formatTokens(workspace.tokenBalance)}{" "}
                    token
                  </span>
                </span>
                {active ? <Check className="size-3.5 text-accent-strong" aria-hidden /> : null}
              </button>
            );
          })}

          <Link
            href="/app/workspaces"
            onClick={() => setOpen(false)}
            className="mt-1 flex items-center gap-2 rounded-lg border-t border-border/70 px-2.5 py-2 text-[11px] font-medium text-ink transition-colors hover:bg-canvas-2"
          >
            <LayoutGrid className="size-3.5 text-accent" aria-hidden />
            Kelola workspace
          </Link>
        </div>
      ) : null}
    </div>
  );
}
