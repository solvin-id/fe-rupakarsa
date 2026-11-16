"use client";

import { create } from "zustand";

import { readAccountsCookie, writeAccountsCookie } from "../lib/accounts-cookie";
import { canManageWorkspace, isWorkspaceOwner } from "../lib/auth";
import { removeLegacyCookies } from "../lib/cookies";
import { ensurePlatformSeeded } from "../lib/platform-seed";
import { SEED_JOIN_REQUESTS, SEED_MEMBERSHIPS, SEED_WORKSPACES } from "../lib/seed";
import { slugify } from "../lib/slug";
import { cleanupLegacyStorage } from "../lib/storage";
import type {
  ActionResult,
  Result,
  User,
  Workspace,
  WorkspaceJoinRequest,
  WorkspaceMembership,
} from "../lib/types";
import { readWorkspaceRegistry, writeWorkspaceRegistry } from "../lib/workspaces-cookie";
import { useProjectStore } from "./project-store";

const STORAGE_FULL_MESSAGE = "Penyimpanan demo penuh. Hapus workspace yang tidak dipakai.";

function clampCount(value: number | undefined, fallback: number): number {
  if (value === undefined || !Number.isFinite(value)) return fallback;
  return Math.max(0, Math.round(value));
}

function uniqueSlug(base: string, taken: Set<string>): string {
  if (!taken.has(base)) return base;
  let suffix = 2;
  while (taken.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

function relocateDefault(
  accounts: User[],
  remainingMemberships: WorkspaceMembership[],
  workspaces: Workspace[],
  removedWorkspaceId: string,
  userId: string,
): User[] {
  const account = accounts.find((item) => item.id === userId);
  if (!account || account.defaultWorkspaceId !== removedWorkspaceId) return accounts;

  const options = remainingMemberships.filter((membership) => membership.userId === userId);
  const fallback =
    options.find(
      (membership) => workspaces.find((workspace) => workspace.id === membership.workspaceId)?.isActive,
    ) ?? options[0];
  if (!fallback) return accounts;

  return accounts.map((item) =>
    item.id === userId ? { ...item, defaultWorkspaceId: fallback.workspaceId } : item,
  );
}

interface WorkspaceState {
  workspaces: Workspace[];
  memberships: WorkspaceMembership[];
  requests: WorkspaceJoinRequest[];
  hydrated: boolean;
  hydrate: () => void;
  refresh: () => void;
  createWorkspace: (input: {
    name: string;
    slug?: string;
    ownerId: string;
    tokenBalance?: number;
    freePlanRemaining?: number;
    isActive?: boolean;
  }) => Result<Workspace>;
  updateWorkspace: (
    id: string,
    patch: Partial<Pick<Workspace, "name" | "tokenBalance" | "freePlanRemaining" | "isActive">>,
  ) => Result<Workspace>;
  deleteWorkspace: (id: string, actorId: string) => ActionResult;
  requestJoin: (input: {
    slug: string;
    userId: string;
    message: string;
  }) => Result<WorkspaceJoinRequest>;
  approveRequest: (requestId: string, actorId: string) => ActionResult;
  rejectRequest: (requestId: string, actorId: string) => ActionResult;
  removeMember: (workspaceId: string, actorId: string, userId: string) => ActionResult;
  setMemberRole: (
    workspaceId: string,
    actorId: string,
    userId: string,
    role: "ADMIN" | "MEMBER",
  ) => ActionResult;
  leaveWorkspace: (workspaceId: string, userId: string) => ActionResult;
  getWorkspace: (id: string) => Workspace | undefined;
  getWorkspaceBySlug: (slug: string) => Workspace | undefined;
  getMembership: (workspaceId: string, userId: string) => WorkspaceMembership | undefined;
  getUserMemberships: (userId: string) => WorkspaceMembership[];
  getWorkspaceMembers: (workspaceId: string) => WorkspaceMembership[];
  getUserRequests: (userId: string) => WorkspaceJoinRequest[];
  getManageableRequests: (userId: string) => WorkspaceJoinRequest[];
}

function ensureHydrated(): void {
  if (!useWorkspaceStore.getState().hydrated) useWorkspaceStore.getState().hydrate();
}

export const useWorkspaceStore = create<WorkspaceState>()((set, get) => ({
  workspaces: [],
  memberships: [],
  requests: [],
  hydrated: false,

  hydrate: () => {
    cleanupLegacyStorage();
    removeLegacyCookies();
    ensurePlatformSeeded();
    const registry = readWorkspaceRegistry() ?? {
      workspaces: SEED_WORKSPACES,
      memberships: SEED_MEMBERSHIPS,
      requests: SEED_JOIN_REQUESTS,
    };
    writeWorkspaceRegistry(registry);
    set({
      workspaces: registry.workspaces,
      memberships: registry.memberships,
      requests: registry.requests,
      hydrated: true,
    });
  },

  refresh: () => {
    const registry = readWorkspaceRegistry();
    if (!registry) {
      get().hydrate();
      return;
    }
    set({
      workspaces: registry.workspaces,
      memberships: registry.memberships,
      requests: registry.requests,
    });
  },

  createWorkspace: (input) => {
    ensureHydrated();
    const name = input.name.trim();
    if (name.length < 2) return { ok: false, message: "Nama workspace minimal 2 karakter." };

    const accounts = readAccountsCookie() ?? [];
    if (!accounts.some((account) => account.id === input.ownerId)) {
      return { ok: false, message: "Akun owner tidak ditemukan." };
    }

    const explicitSlug = Boolean(input.slug && input.slug.trim().length > 0);
    const base = slugify(explicitSlug ? input.slug ?? "" : name);
    if (base.length < 2) return { ok: false, message: "Slug workspace minimal 2 karakter." };

    const taken = new Set(get().workspaces.map((workspace) => workspace.slug));
    if (explicitSlug && taken.has(base)) {
      return { ok: false, message: "Slug workspace sudah dipakai." };
    }
    const slug = explicitSlug ? base : uniqueSlug(base, taken);

    const createdAt = new Date().toISOString();
    const workspace: Workspace = {
      id: `ws_${crypto.randomUUID().slice(0, 8)}`,
      name,
      slug,
      tokenBalance: clampCount(input.tokenBalance, 0),
      freePlanRemaining: clampCount(input.freePlanRemaining, 0),
      isActive: input.isActive ?? true,
      createdAt,
    };
    const membership: WorkspaceMembership = {
      id: `wsm_${crypto.randomUUID().slice(0, 8)}`,
      workspaceId: workspace.id,
      userId: input.ownerId,
      role: "OWNER",
      joinedAt: createdAt,
    };

    const workspaces = [...get().workspaces, workspace];
    const memberships = [...get().memberships, membership];
    if (!writeWorkspaceRegistry({ workspaces, memberships, requests: get().requests })) {
      return { ok: false, message: STORAGE_FULL_MESSAGE };
    }
    set({ workspaces, memberships });
    return { ok: true, value: workspace };
  },

  updateWorkspace: (id, patch) => {
    ensureHydrated();
    const current = get().workspaces.find((workspace) => workspace.id === id);
    if (!current) return { ok: false, message: "Workspace tidak ditemukan." };

    let name = current.name;
    if (patch.name !== undefined) {
      name = patch.name.trim();
      if (name.length < 2) return { ok: false, message: "Nama workspace minimal 2 karakter." };
    }

    const next: Workspace = {
      ...current,
      name,
      tokenBalance:
        patch.tokenBalance === undefined
          ? current.tokenBalance
          : clampCount(patch.tokenBalance, current.tokenBalance),
      freePlanRemaining:
        patch.freePlanRemaining === undefined
          ? current.freePlanRemaining
          : clampCount(patch.freePlanRemaining, current.freePlanRemaining),
      isActive: patch.isActive === undefined ? current.isActive : patch.isActive,
    };
    const workspaces = get().workspaces.map((workspace) => (workspace.id === id ? next : workspace));
    if (!writeWorkspaceRegistry({ workspaces, memberships: get().memberships, requests: get().requests })) {
      return { ok: false, message: STORAGE_FULL_MESSAGE };
    }
    set({ workspaces });
    return { ok: true, value: next };
  },

  deleteWorkspace: (id, actorId) => {
    ensureHydrated();
    const workspace = get().workspaces.find((item) => item.id === id);
    if (!workspace) return { ok: false, message: "Workspace tidak ditemukan." };

    const actor = get().memberships.find(
      (membership) => membership.workspaceId === id && membership.userId === actorId,
    );
    if (!isWorkspaceOwner(actor?.role)) {
      return { ok: false, message: "Hanya owner yang dapat menghapus workspace." };
    }

    const accounts = readAccountsCookie() ?? [];
    const members = get().memberships.filter((membership) => membership.workspaceId === id);
    const stranded = members
      .filter(
        (membership) =>
          get().memberships.filter((item) => item.userId === membership.userId).length <= 1,
      )
      .map(
        (membership) =>
          accounts.find((account) => account.id === membership.userId)?.fullName ??
          membership.userId,
      );
    if (stranded.length > 0) {
      return {
        ok: false,
        message: `${stranded.join(", ")} hanya tergabung di ${workspace.name}. Tambahkan mereka ke workspace lain sebelum menghapus.`,
      };
    }

    const workspaces = get().workspaces.filter((item) => item.id !== id);
    const memberships = get().memberships.filter((item) => item.workspaceId !== id);
    let nextAccounts = accounts;
    for (const member of members) {
      nextAccounts = relocateDefault(nextAccounts, memberships, workspaces, id, member.userId);
    }
    if (!writeAccountsCookie(nextAccounts)) {
      return { ok: false, message: STORAGE_FULL_MESSAGE };
    }

    const requests = get().requests.filter((request) => request.workspaceId !== id);
    if (!writeWorkspaceRegistry({ workspaces, memberships, requests })) {
      return { ok: false, message: STORAGE_FULL_MESSAGE };
    }
    set({ workspaces, memberships, requests });
    useProjectStore.getState().deleteWorkspaceData(id);
    return { ok: true };
  },

  requestJoin: ({ slug, userId, message }) => {
    ensureHydrated();
    const workspace = get().workspaces.find((item) => item.slug === slug.trim().toLowerCase());
    if (!workspace) {
      return { ok: false, message: "Workspace dengan slug tersebut tidak ditemukan." };
    }
    if (!workspace.isActive) {
      return { ok: false, message: `Workspace ${workspace.name} sedang tidak aktif.` };
    }
    if (
      get().memberships.some(
        (membership) => membership.workspaceId === workspace.id && membership.userId === userId,
      )
    ) {
      return { ok: false, message: `Anda sudah menjadi anggota ${workspace.name}.` };
    }
    if (
      get().requests.some(
        (request) =>
          request.workspaceId === workspace.id &&
          request.userId === userId &&
          request.status === "PENDING",
      )
    ) {
      return { ok: false, message: "Permintaan Anda masih menunggu persetujuan." };
    }

    const accounts = readAccountsCookie() ?? [];
    const account = accounts.find((item) => item.id === userId);
    if (!account) return { ok: false, message: "Akun tidak ditemukan." };
    if (!account.isActive) return { ok: false, message: "Akun tidak aktif." };

    const request: WorkspaceJoinRequest = {
      id: `wsr_${crypto.randomUUID().slice(0, 8)}`,
      workspaceId: workspace.id,
      userId,
      message: message.trim(),
      status: "PENDING",
      createdAt: new Date().toISOString(),
      resolvedAt: null,
      resolvedByUserId: null,
    };
    const requests = [request, ...get().requests];
    if (!writeWorkspaceRegistry({ workspaces: get().workspaces, memberships: get().memberships, requests })) {
      return { ok: false, message: STORAGE_FULL_MESSAGE };
    }
    set({ requests });
    return { ok: true, value: request };
  },

  approveRequest: (requestId, actorId) => {
    ensureHydrated();
    const request = get().requests.find((item) => item.id === requestId);
    if (!request) return { ok: false, message: "Permintaan tidak ditemukan." };
    if (request.status !== "PENDING") return { ok: false, message: "Permintaan sudah diproses." };

    const actor = get().memberships.find(
      (membership) =>
        membership.workspaceId === request.workspaceId && membership.userId === actorId,
    );
    if (!canManageWorkspace(actor?.role)) {
      return { ok: false, message: "Hanya owner atau admin yang dapat menyetujui permintaan." };
    }

    const resolvedAt = new Date().toISOString();
    const requests = get().requests.map((item) =>
      item.id === requestId
        ? { ...item, status: "APPROVED" as const, resolvedAt, resolvedByUserId: actorId }
        : item,
    );
    const alreadyMember = get().memberships.some(
      (membership) =>
        membership.workspaceId === request.workspaceId && membership.userId === request.userId,
    );
    const memberships = alreadyMember
      ? get().memberships
      : [
          ...get().memberships,
          {
            id: `wsm_${crypto.randomUUID().slice(0, 8)}`,
            workspaceId: request.workspaceId,
            userId: request.userId,
            role: "MEMBER" as const,
            joinedAt: resolvedAt,
          },
        ];

    if (!writeWorkspaceRegistry({ workspaces: get().workspaces, memberships, requests })) {
      return { ok: false, message: STORAGE_FULL_MESSAGE };
    }
    set({ memberships, requests });
    return { ok: true };
  },

  rejectRequest: (requestId, actorId) => {
    ensureHydrated();
    const request = get().requests.find((item) => item.id === requestId);
    if (!request) return { ok: false, message: "Permintaan tidak ditemukan." };
    if (request.status !== "PENDING") return { ok: false, message: "Permintaan sudah diproses." };

    const actor = get().memberships.find(
      (membership) =>
        membership.workspaceId === request.workspaceId && membership.userId === actorId,
    );
    if (!canManageWorkspace(actor?.role)) {
      return { ok: false, message: "Hanya owner atau admin yang dapat menolak permintaan." };
    }

    const resolvedAt = new Date().toISOString();
    const requests = get().requests.map((item) =>
      item.id === requestId
        ? { ...item, status: "REJECTED" as const, resolvedAt, resolvedByUserId: actorId }
        : item,
    );
    if (!writeWorkspaceRegistry({ workspaces: get().workspaces, memberships: get().memberships, requests })) {
      return { ok: false, message: STORAGE_FULL_MESSAGE };
    }
    set({ requests });
    return { ok: true };
  },

  removeMember: (workspaceId, actorId, userId) => {
    ensureHydrated();
    const actor = get().memberships.find(
      (membership) => membership.workspaceId === workspaceId && membership.userId === actorId,
    );
    if (!canManageWorkspace(actor?.role)) {
      return { ok: false, message: "Hanya owner atau admin yang dapat mengeluarkan anggota." };
    }
    const target = get().memberships.find(
      (membership) => membership.workspaceId === workspaceId && membership.userId === userId,
    );
    if (!target) return { ok: false, message: "Anggota tidak ditemukan." };
    if (target.role === "OWNER") {
      return { ok: false, message: "Owner tidak dapat dikeluarkan dari workspace." };
    }
    if (actor?.role === "ADMIN" && target.role === "ADMIN") {
      return { ok: false, message: "Admin tidak dapat mengeluarkan admin lain." };
    }
    if (userId === actorId) {
      return { ok: false, message: "Gunakan Keluar untuk meninggalkan workspace." };
    }

    const accounts = readAccountsCookie() ?? [];
    if (get().memberships.filter((membership) => membership.userId === userId).length <= 1) {
      return {
        ok: false,
        message: `${
          accounts.find((account) => account.id === userId)?.fullName ?? userId
        } hanya tergabung di workspace ini.`,
      };
    }

    const memberships = get().memberships.filter(
      (membership) => !(membership.workspaceId === workspaceId && membership.userId === userId),
    );
    const nextAccounts = relocateDefault(accounts, memberships, get().workspaces, workspaceId, userId);
    if (!writeAccountsCookie(nextAccounts)) {
      return { ok: false, message: STORAGE_FULL_MESSAGE };
    }
    if (!writeWorkspaceRegistry({ workspaces: get().workspaces, memberships, requests: get().requests })) {
      return { ok: false, message: STORAGE_FULL_MESSAGE };
    }
    set({ memberships });
    return { ok: true };
  },

  setMemberRole: (workspaceId, actorId, userId, role) => {
    ensureHydrated();
    const actor = get().memberships.find(
      (membership) => membership.workspaceId === workspaceId && membership.userId === actorId,
    );
    if (!isWorkspaceOwner(actor?.role)) {
      return { ok: false, message: "Hanya owner yang dapat mengubah role anggota." };
    }
    if (role !== "ADMIN" && role !== "MEMBER") {
      return { ok: false, message: "Role tidak valid." };
    }
    const target = get().memberships.find(
      (membership) => membership.workspaceId === workspaceId && membership.userId === userId,
    );
    if (!target) return { ok: false, message: "Anggota tidak ditemukan." };
    if (target.role === "OWNER") {
      return { ok: false, message: "Role owner tidak dapat diubah." };
    }

    const memberships = get().memberships.map((membership) =>
      membership.workspaceId === workspaceId && membership.userId === userId
        ? { ...membership, role }
        : membership,
    );
    if (!writeWorkspaceRegistry({ workspaces: get().workspaces, memberships, requests: get().requests })) {
      return { ok: false, message: STORAGE_FULL_MESSAGE };
    }
    set({ memberships });
    return { ok: true };
  },

  leaveWorkspace: (workspaceId, userId) => {
    ensureHydrated();
    const target = get().memberships.find(
      (membership) => membership.workspaceId === workspaceId && membership.userId === userId,
    );
    if (!target) return { ok: false, message: "Anda bukan anggota workspace ini." };
    if (target.role === "OWNER") {
      return { ok: false, message: "Owner tidak dapat keluar. Hapus workspace bila tidak dipakai." };
    }
    if (get().memberships.filter((membership) => membership.userId === userId).length <= 1) {
      return { ok: false, message: "Setiap akun harus punya minimal satu workspace." };
    }

    const accounts = readAccountsCookie() ?? [];
    const memberships = get().memberships.filter(
      (membership) => !(membership.workspaceId === workspaceId && membership.userId === userId),
    );
    const nextAccounts = relocateDefault(accounts, memberships, get().workspaces, workspaceId, userId);
    if (!writeAccountsCookie(nextAccounts)) {
      return { ok: false, message: STORAGE_FULL_MESSAGE };
    }
    if (!writeWorkspaceRegistry({ workspaces: get().workspaces, memberships, requests: get().requests })) {
      return { ok: false, message: STORAGE_FULL_MESSAGE };
    }
    set({ memberships });
    return { ok: true };
  },

  getWorkspace: (id) => get().workspaces.find((workspace) => workspace.id === id),

  getWorkspaceBySlug: (slug) =>
    get().workspaces.find((workspace) => workspace.slug === slug.trim().toLowerCase()),

  getMembership: (workspaceId, userId) =>
    get().memberships.find(
      (membership) => membership.workspaceId === workspaceId && membership.userId === userId,
    ),

  getUserMemberships: (userId) =>
    get().memberships.filter((membership) => membership.userId === userId),

  getWorkspaceMembers: (workspaceId) =>
    get().memberships.filter((membership) => membership.workspaceId === workspaceId),

  getUserRequests: (userId) =>
    get()
      .requests.filter((request) => request.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),

  getManageableRequests: (userId) => {
    const managedIds = new Set(
      get()
        .memberships.filter(
          (membership) => membership.userId === userId && canManageWorkspace(membership.role),
        )
        .map((membership) => membership.workspaceId),
    );
    return get()
      .requests.filter((request) => request.status === "PENDING" && managedIds.has(request.workspaceId))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
}));
