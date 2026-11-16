"use client";

import { create } from "zustand";

import { readAccountsCookie } from "../lib/accounts-cookie";
import { authorizeSignIn } from "../lib/auth";
import { removeLegacyCookies } from "../lib/cookies";
import { ensurePlatformSeeded } from "../lib/platform-seed";
import { DEMO_PASSWORD } from "../lib/seed";
import { clearSessionCookie, readSessionCookie, writeSessionCookie } from "../lib/session-cookie";
import { cleanupLegacyStorage } from "../lib/storage";
import type { Session, SessionCookie, User, Workspace } from "../lib/types";
import { readWorkspaceRegistry } from "../lib/workspaces-cookie";
import { useWorkspaceStore } from "./workspace-store";

const NO_WORKSPACE_MESSAGE = "Akun ini belum memiliki workspace. Hubungi Superadmin Rupakarsa.";

function resolveSession(cookie: SessionCookie): Session | null {
  const accounts = readAccountsCookie() ?? [];
  const registry = readWorkspaceRegistry();
  if (!registry) return null;

  const account = accounts.find((item) => item.id === cookie.userId);
  if (!account || !account.isActive) return null;

  const memberships = registry.memberships.filter((item) => item.userId === account.id);
  if (memberships.length === 0) return null;

  const memberWorkspaceIds = memberships.map((membership) => membership.workspaceId);
  const orderedIds: string[] = [];
  for (const id of [cookie.workspaceId, account.defaultWorkspaceId, ...memberWorkspaceIds]) {
    if (memberWorkspaceIds.includes(id) && !orderedIds.includes(id)) orderedIds.push(id);
  }
  const candidates = orderedIds
    .map((id) => registry.workspaces.find((workspace) => workspace.id === id))
    .filter((workspace): workspace is Workspace => Boolean(workspace));
  const workspace = candidates.find((item) => item.isActive) ?? candidates[0];
  if (!workspace) return null;

  return { user: account, workspace, signedInAt: cookie.signedInAt };
}

function persistSession(session: Session): void {
  writeSessionCookie({
    userId: session.user.id,
    workspaceId: session.workspace.id,
    signedInAt: session.signedInAt,
  });
}

interface SessionState {
  session: Session | null;
  hydrated: boolean;
  errorMessage: string | null;
  hydrate: () => void;
  refreshAccess: () => void;
  signIn: (email: string, password: string) => boolean;
  signOut: () => void;
  switchWorkspace: (workspaceId: string) => boolean;
  adjustTokens: (delta: number) => void;
  consumePlanQuota: () => { tokens: number; usesFreeQuota: boolean };
  updateUser: (patch: Partial<User>) => void;
  updateWorkspace: (patch: Partial<Workspace>) => void;
}

export const useSessionStore = create<SessionState>()((set, get) => ({
  session: null,
  hydrated: false,
  errorMessage: null,

  hydrate: () => {
    cleanupLegacyStorage();
    removeLegacyCookies();
    ensurePlatformSeeded();

    const cookie = readSessionCookie();
    if (!cookie) {
      set({ session: null, hydrated: true });
      return;
    }

    const resolved = resolveSession(cookie);
    if (!resolved) {
      clearSessionCookie();
      set({
        session: null,
        hydrated: true,
        errorMessage: "Sesi berakhir. Silakan masuk kembali.",
      });
      return;
    }

    persistSession(resolved);
    set({ session: resolved, hydrated: true, errorMessage: null });
  },

  refreshAccess: () => {
    const session = get().session;
    if (!session) return;

    ensurePlatformSeeded();
    const cookie = readSessionCookie();
    if (!cookie) {
      set({ session: null });
      return;
    }

    const resolved = resolveSession(cookie);
    if (!resolved) {
      clearSessionCookie();
      set({ session: null });
      return;
    }

    persistSession(resolved);
    set({ session: resolved });
  },

  signIn: (email, password) => {
    ensurePlatformSeeded();
    const normalized = email.trim().toLowerCase();
    const account = (readAccountsCookie() ?? []).find((item) => item.email === normalized);
    if (!account || password !== DEMO_PASSWORD) {
      set({
        errorMessage:
          "Akun tidak ditemukan atau password salah. Akun dibuat oleh Superadmin Rupakarsa.",
      });
      return false;
    }

    const authorization = authorizeSignIn(account);
    if (!authorization.ok) {
      set({ errorMessage: authorization.message });
      return false;
    }

    const signedInAt = new Date().toISOString();
    const resolved = resolveSession({
      userId: account.id,
      workspaceId: account.defaultWorkspaceId,
      signedInAt,
    });
    if (!resolved) {
      set({ errorMessage: NO_WORKSPACE_MESSAGE });
      return false;
    }

    persistSession(resolved);
    set({ session: resolved, errorMessage: null });
    return true;
  },

  signOut: () => {
    clearSessionCookie();
    set({ session: null, errorMessage: null });
  },

  switchWorkspace: (workspaceId) => {
    const session = get().session;
    if (!session) return false;

    const registry = readWorkspaceRegistry();
    if (!registry) return false;

    const membership = registry.memberships.find(
      (item) => item.workspaceId === workspaceId && item.userId === session.user.id,
    );
    const workspace = registry.workspaces.find((item) => item.id === workspaceId);
    if (!membership || !workspace || !workspace.isActive) return false;

    const next: Session = { ...session, workspace };
    persistSession(next);
    set({ session: next });
    return true;
  },

  adjustTokens: (delta) => {
    const session = get().session;
    if (!session) return;

    const updated = useWorkspaceStore.getState().updateWorkspace(session.workspace.id, {
      tokenBalance: Math.max(0, session.workspace.tokenBalance + delta),
    });
    if (updated.ok) set({ session: { ...session, workspace: updated.value } });
  },

  consumePlanQuota: () => {
    const session = get().session;
    if (!session) return { tokens: 0, usesFreeQuota: false };

    const { workspace } = session;
    if (workspace.freePlanRemaining > 0) {
      const updated = useWorkspaceStore
        .getState()
        .updateWorkspace(workspace.id, { freePlanRemaining: workspace.freePlanRemaining - 1 });
      if (!updated.ok) return { tokens: 0, usesFreeQuota: false };
      set({ session: { ...session, workspace: updated.value } });
      return { tokens: 0, usesFreeQuota: true };
    }

    if (workspace.tokenBalance < 1) return { tokens: 0, usesFreeQuota: false };

    const updated = useWorkspaceStore
      .getState()
      .updateWorkspace(workspace.id, { tokenBalance: workspace.tokenBalance - 1 });
    if (!updated.ok) return { tokens: 0, usesFreeQuota: false };
    set({ session: { ...session, workspace: updated.value } });
    return { tokens: 1, usesFreeQuota: false };
  },

  updateUser: (patch) => {
    const session = get().session;
    if (!session) return;
    set({ session: { ...session, user: { ...session.user, ...patch } } });
  },

  updateWorkspace: (patch) => {
    const session = get().session;
    if (!session) return;
    set({ session: { ...session, workspace: { ...session.workspace, ...patch } } });
  },
}));
