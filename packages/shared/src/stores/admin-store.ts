"use client";

import { create } from "zustand";

import { readAccountsCookie, writeAccountsCookie } from "../lib/accounts-cookie";
import { ensurePlatformSeeded } from "../lib/platform-seed";
import {
  SEED_ACCOUNTS,
  SEED_JOIN_REQUESTS,
  SEED_MEMBERSHIPS,
  SEED_MODELS,
  SEED_PROVIDERS,
  SEED_WORKSPACES,
} from "../lib/seed";
import { slugify } from "../lib/slug";
import { cleanupLegacyStorage, readJson, STORAGE_KEYS, writeJson } from "../lib/storage";
import type {
  AiModel,
  AiProvider,
  CatalogSnapshot,
  MediaType,
  ModelAllowedParams,
  ProviderCode,
  Result,
  Role,
  User,
  WorkspaceRegistry,
} from "../lib/types";
import { readWorkspaceRegistry, writeWorkspaceRegistry } from "../lib/workspaces-cookie";
import { useSessionStore } from "./session-store";
import { useWorkspaceStore } from "./workspace-store";

const STORAGE_FULL_MESSAGE = "Penyimpanan demo penuh. Hapus workspace yang tidak dipakai.";

function restoreRegistry(previous: WorkspaceRegistry | null): void {
  writeWorkspaceRegistry(
    previous ?? {
      workspaces: SEED_WORKSPACES,
      memberships: SEED_MEMBERSHIPS,
      requests: SEED_JOIN_REQUESTS,
    },
  );
  useWorkspaceStore.getState().hydrate();
}

interface CreateAccountInput {
  fullName: string;
  email: string;
  role: Role;
  cmsAccess: boolean;
}

interface CreateProviderInput {
  name: string;
  code: string;
  baseUrl: string;
  apiKeyMasked: string;
  isActive: boolean;
}

interface CreateModelInput {
  providerId: string;
  code: string;
  displayName: string;
  mediaType: MediaType;
  allowedParams: ModelAllowedParams;
  tokenCost: number;
  isActive: boolean;
}

interface AdminState {
  accounts: User[];
  providers: AiProvider[];
  models: AiModel[];
  hydrated: boolean;
  hydrate: () => void;
  refreshAccounts: () => void;
  getAccount: (id: string) => User | undefined;
  getAccountByEmail: (email: string) => User | undefined;
  createAccount: (input: CreateAccountInput) => Result<User>;
  toggleAccount: (id: string) => void;
  setCmsAccess: (id: string, value: boolean) => void;
  updateProvider: (code: ProviderCode, patch: Partial<AiProvider>) => void;
  toggleProvider: (code: ProviderCode) => void;
  updateModel: (id: string, patch: Partial<AiModel>) => void;
  toggleModel: (id: string) => void;
  createProvider: (input: CreateProviderInput) => AiProvider | null;
  createModel: (input: CreateModelInput) => AiModel | null;
}

function persistCatalog(providers: AiProvider[], models: AiModel[]): void {
  writeJson<CatalogSnapshot>(STORAGE_KEYS.catalog, { providers, models });
}

export const useAdminStore = create<AdminState>()((set, get) => ({
  accounts: [],
  providers: [],
  models: [],
  hydrated: false,

  hydrate: () => {
    cleanupLegacyStorage();
    ensurePlatformSeeded();

    let accounts = readAccountsCookie();
    if (!accounts) {
      accounts = SEED_ACCOUNTS;
      writeAccountsCookie(accounts);
    }

    const catalog = readJson<CatalogSnapshot | null>(STORAGE_KEYS.catalog, null);
    if (!catalog?.providers || !catalog?.models) {
      persistCatalog(SEED_PROVIDERS, SEED_MODELS);
      set({ accounts, providers: SEED_PROVIDERS, models: SEED_MODELS, hydrated: true });
      return;
    }
    set({ accounts, providers: catalog.providers, models: catalog.models, hydrated: true });
  },

  refreshAccounts: () => {
    const accounts = readAccountsCookie();
    if (!accounts) {
      get().hydrate();
      return;
    }
    set({ accounts });
  },

  getAccount: (id) => get().accounts.find((account) => account.id === id),

  getAccountByEmail: (email) => {
    const normalized = email.trim().toLowerCase();
    return get().accounts.find((account) => account.email === normalized);
  },

  createAccount: (input) => {
    const fullName = input.fullName.trim();
    const email = input.email.trim().toLowerCase();
    if (fullName.length < 2) return { ok: false, message: "Nama minimal 2 karakter." };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { ok: false, message: "Format email tidak valid." };
    }

    const accounts = readAccountsCookie() ?? SEED_ACCOUNTS;
    if (accounts.some((account) => account.email === email)) {
      return { ok: false, message: "Email sudah terdaftar." };
    }

    const userId = `usr_${crypto.randomUUID().slice(0, 8)}`;
    const account: User = {
      id: userId,
      defaultWorkspaceId: "",
      email,
      fullName,
      role: input.role,
      cmsAccess: input.role === "SUPERADMIN" ? true : input.cmsAccess,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    // The workspace guard requires an existing owner, so the account is persisted first.
    if (!writeAccountsCookie([account, ...accounts])) {
      return { ok: false, message: STORAGE_FULL_MESSAGE };
    }

    const previousRegistry = readWorkspaceRegistry();
    useWorkspaceStore.getState().hydrate();
    const created = useWorkspaceStore.getState().createWorkspace({
      name: `${fullName} Workspace`,
      slug: `${slugify(fullName)}-${userId.slice(-4)}`,
      ownerId: userId,
    });
    if (!created.ok) {
      writeAccountsCookie(accounts);
      restoreRegistry(previousRegistry);
      return { ok: false, message: created.message };
    }

    const createdAccount: User = { ...account, defaultWorkspaceId: created.value.id };
    const nextAccounts = [createdAccount, ...accounts];
    if (!writeAccountsCookie(nextAccounts)) {
      writeAccountsCookie(accounts);
      restoreRegistry(previousRegistry);
      return { ok: false, message: STORAGE_FULL_MESSAGE };
    }

    set({ accounts: nextAccounts });
    return { ok: true, value: createdAccount };
  },

  toggleAccount: (id) => {
    const accounts = get().accounts.map((account) =>
      account.id === id ? { ...account, isActive: !account.isActive } : account,
    );
    if (!writeAccountsCookie(accounts)) return;
    set({ accounts });

    const updated = accounts.find((account) => account.id === id);
    if (updated) useSessionStore.getState().updateUser({ isActive: updated.isActive });
  },

  setCmsAccess: (id, value) => {
    const accounts = get().accounts.map((account) =>
      account.id === id ? { ...account, cmsAccess: value } : account,
    );
    if (!writeAccountsCookie(accounts)) return;
    set({ accounts });
    useSessionStore.getState().updateUser({ cmsAccess: value });
  },

  updateProvider: (code, patch) => {
    const providers = get().providers.map((provider) =>
      provider.code === code
        ? { ...provider, ...patch, updatedAt: new Date().toISOString() }
        : provider,
    );
    persistCatalog(providers, get().models);
    set({ providers });
  },

  toggleProvider: (code) => {
    const providers = get().providers.map((provider) =>
      provider.code === code
        ? { ...provider, isActive: !provider.isActive, updatedAt: new Date().toISOString() }
        : provider,
    );
    persistCatalog(providers, get().models);
    set({ providers });
  },

  updateModel: (id, patch) => {
    const models = get().models.map((model) => (model.id === id ? { ...model, ...patch } : model));
    persistCatalog(get().providers, models);
    set({ models });
  },

  toggleModel: (id) => {
    const models = get().models.map((model) =>
      model.id === id ? { ...model, isActive: !model.isActive } : model,
    );
    persistCatalog(get().providers, models);
    set({ models });
  },

  createProvider: (input) => {
    const code = input.code.trim().toUpperCase();
    if (!code || get().providers.some((provider) => provider.code === code)) return null;

    const provider: AiProvider = {
      id: `prv_${crypto.randomUUID().slice(0, 8)}`,
      code,
      name: input.name.trim(),
      baseUrl: input.baseUrl.trim(),
      apiKeyMasked: input.apiKeyMasked,
      isActive: input.isActive,
      updatedAt: new Date().toISOString(),
    };
    const providers = [...get().providers, provider];
    persistCatalog(providers, get().models);
    set({ providers });
    return provider;
  },

  createModel: (input) => {
    const code = input.code.trim().toLowerCase();
    if (
      !code ||
      get().models.some(
        (model) => model.providerId === input.providerId && model.code === code,
      )
    ) {
      return null;
    }

    const model: AiModel = {
      id: `mdl_${crypto.randomUUID().slice(0, 8)}`,
      providerId: input.providerId,
      code,
      displayName: input.displayName.trim(),
      mediaType: input.mediaType,
      allowedParams: input.allowedParams,
      tokenCost: Math.max(0, Math.round(input.tokenCost)),
      isActive: input.isActive,
    };
    const models = [...get().models, model];
    persistCatalog(get().providers, models);
    set({ models });
    return model;
  },
}));
