"use client";

import { create } from "zustand";

import { authorizeSignIn } from "../lib/auth";
import { hasCmsAccessOverride } from "../lib/cms-access-cookie";
import { DEMO_ACCOUNTS, SEED_TENANTS, SEED_USERS } from "../lib/seed";
import { clearSessionCookie, readSessionCookie, writeSessionCookie } from "../lib/session-cookie";
import { readJson, removeKey, STORAGE_KEYS, writeJson } from "../lib/storage";
import { readTenantWallet, upsertTenantWallet } from "../lib/tenant-wallet-cookie";
import type { AdminSnapshot, Session, Tenant, User } from "../lib/types";

function currentUsers(): User[] {
  const snapshot = readJson<AdminSnapshot | null>(STORAGE_KEYS.admin, null);
  return snapshot?.users ?? SEED_USERS;
}

function currentTenants(): Tenant[] {
  const snapshot = readJson<AdminSnapshot | null>(STORAGE_KEYS.admin, null);
  return snapshot?.tenants ?? SEED_TENANTS;
}

function persistTenantBalance(
  tenantId: string,
  tokenBalance: number,
  freePlanRemaining: number,
): void {
  const snapshot = readJson<AdminSnapshot | null>(STORAGE_KEYS.admin, null);
  if (!snapshot?.tenants) return;
  const tenants = snapshot.tenants.map((tenant) =>
    tenant.id === tenantId ? { ...tenant, tokenBalance, freePlanRemaining } : tenant,
  );
  writeJson(STORAGE_KEYS.admin, { ...snapshot, tenants });
}

function persist(session: Session | null): void {
  if (session) {
    writeSessionCookie(session);
  } else {
    clearSessionCookie();
  }
}

function resolveTenant(session: Session): Session | null {
  const base =
    session.tenant ??
    currentTenants().find((item) => item.id === session.user.tenantId) ??
    currentTenants()[0];
  if (!base) return null;
  const wallet = readTenantWallet(base.id);
  return { ...session, tenant: wallet ? { ...base, ...wallet } : base };
}

interface SessionState {
  session: Session | null;
  hydrated: boolean;
  errorMessage: string | null;
  hydrate: () => void;
  refreshAccess: () => void;
  signIn: (email: string, password: string) => boolean;
  signOut: () => void;
  adjustTokens: (delta: number) => void;
  consumePlanQuota: () => { tokens: number; usesFreeQuota: boolean };
  updateUser: (userId: string, patch: Partial<User>) => void;
  updateTenant: (tenantId: string, patch: Partial<Tenant>) => void;
}

export const useSessionStore = create<SessionState>()((set, get) => ({
  session: null,
  hydrated: false,
  errorMessage: null,

  hydrate: () => {
    let session = readSessionCookie();

    if (!session) {
      const legacy =
        readJson<Session | null>(STORAGE_KEYS.sessionCreator, null) ??
        readJson<Session | null>(STORAGE_KEYS.sessionCms, null);
      if (legacy?.user?.email) {
        session = legacy;
      }
    }

    removeKey(STORAGE_KEYS.sessionCreator);
    removeKey(STORAGE_KEYS.sessionCms);

    const resolved = session ? resolveTenant(session) : null;
    if (resolved) writeSessionCookie(resolved);
    set({ session: resolved, hydrated: true });
  },

  refreshAccess: () => {
    const session = get().session;
    if (!session) return;

    const current = currentUsers().find((item) => item.id === session.user.id);
    const cmsAccess = current
      ? current.cmsAccess || hasCmsAccessOverride(current.id)
      : session.user.cmsAccess || hasCmsAccessOverride(session.user.id);
    const baseTenant =
      currentTenants().find((item) => item.id === session.tenant.id) ?? session.tenant;
    const wallet = readTenantWallet(baseTenant.id);
    const tenant = wallet ? { ...baseTenant, ...wallet } : baseTenant;

    if (
      cmsAccess === session.user.cmsAccess &&
      tenant.tokenBalance === session.tenant.tokenBalance &&
      tenant.freePlanRemaining === session.tenant.freePlanRemaining &&
      tenant.isActive === session.tenant.isActive
    ) {
      return;
    }

    const next: Session = {
      ...session,
      user: { ...session.user, cmsAccess },
      tenant,
    };
    persist(next);
    set({ session: next });
  },

  signIn: (email, password) => {
    const normalized = email.trim().toLowerCase();
    const account = DEMO_ACCOUNTS.find((item) => item.email === normalized);
    if (!account || account.password !== password) {
      set({
        errorMessage:
          "Akun tidak ditemukan atau password salah. Akun dibuat oleh Superadmin Rupakarsa.",
      });
      return false;
    }

    const user = currentUsers().find((item) => item.id === account.userId);
    if (!user) {
      set({ errorMessage: "Akun tidak ditemukan. Hubungi Superadmin Rupakarsa." });
      return false;
    }

    const baseTenant = currentTenants().find((item) => item.id === user.tenantId);
    const wallet = baseTenant ? readTenantWallet(baseTenant.id) : null;
    const tenant = baseTenant && wallet ? { ...baseTenant, ...wallet } : baseTenant;
    if (!tenant || !tenant.isActive) {
      set({ errorMessage: "Tenant akun ini tidak aktif. Hubungi Superadmin Rupakarsa." });
      return false;
    }

    const authorization = authorizeSignIn(user);
    if (!authorization.ok) {
      set({ errorMessage: authorization.message });
      return false;
    }

    const resolved: User = {
      ...user,
      cmsAccess: user.cmsAccess || hasCmsAccessOverride(user.id),
    };
    const session: Session = { user: resolved, tenant, signedInAt: new Date().toISOString() };
    persist(session);
    set({ session, errorMessage: null });
    return true;
  },

  signOut: () => {
    persist(null);
    set({ session: null, errorMessage: null });
  },

  adjustTokens: (delta) => {
    const session = get().session;
    if (!session) return;
    const tokenBalance = Math.max(0, session.tenant.tokenBalance + delta);
    const next: Session = {
      ...session,
      tenant: { ...session.tenant, tokenBalance },
    };
    persist(next);
    set({ session: next });
    persistTenantBalance(session.tenant.id, tokenBalance, session.tenant.freePlanRemaining);
    upsertTenantWallet(session.tenant.id, {
      tokenBalance,
      freePlanRemaining: session.tenant.freePlanRemaining,
      isActive: session.tenant.isActive,
    });
  },

  consumePlanQuota: () => {
    const session = get().session;
    if (!session) return { tokens: 0, usesFreeQuota: false };

    if (session.tenant.freePlanRemaining > 0) {
      const freePlanRemaining = session.tenant.freePlanRemaining - 1;
      const next: Session = {
        ...session,
        tenant: { ...session.tenant, freePlanRemaining },
      };
      persist(next);
      set({ session: next });
      persistTenantBalance(session.tenant.id, session.tenant.tokenBalance, freePlanRemaining);
      upsertTenantWallet(session.tenant.id, {
        tokenBalance: session.tenant.tokenBalance,
        freePlanRemaining,
        isActive: session.tenant.isActive,
      });
      return { tokens: 0, usesFreeQuota: true };
    }

    if (session.tenant.tokenBalance < 1) {
      return { tokens: 0, usesFreeQuota: false };
    }

    get().adjustTokens(-1);
    return { tokens: 1, usesFreeQuota: false };
  },

  updateUser: (userId, patch) => {
    const session = get().session;
    if (!session || session.user.id !== userId) return;
    const next: Session = { ...session, user: { ...session.user, ...patch } };
    persist(next);
    set({ session: next });
  },

  updateTenant: (tenantId, patch) => {
    const session = get().session;
    if (!session || session.tenant.id !== tenantId) return;
    const next: Session = { ...session, tenant: { ...session.tenant, ...patch } };
    persist(next);
    set({ session: next });
    upsertTenantWallet(tenantId, {
      tokenBalance: next.tenant.tokenBalance,
      freePlanRemaining: next.tenant.freePlanRemaining,
      isActive: next.tenant.isActive,
    });
  },
}));
