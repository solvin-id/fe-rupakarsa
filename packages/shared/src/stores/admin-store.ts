"use client";

import { create } from "zustand";

import { grantCmsAccessOverride, revokeCmsAccessOverride } from "../lib/cms-access-cookie";
import { SEED_MODELS, SEED_PROVIDERS, SEED_TENANTS, SEED_USERS } from "../lib/seed";
import { readJson, STORAGE_KEYS, writeJson } from "../lib/storage";
import { upsertTenantWallet } from "../lib/tenant-wallet-cookie";
import type {
  AdminSnapshot,
  AiModel,
  AiProvider,
  MediaType,
  ModelAllowedParams,
  ProviderCode,
  Role,
  Tenant,
  User,
} from "../lib/types";
import { useSessionStore } from "./session-store";

interface CreateUserInput {
  fullName: string;
  email: string;
  role: Role;
  tenantId: string;
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

interface CreateTenantInput {
  name: string;
  slug: string;
  tokenBalance: number;
  freePlanRemaining: number;
  isActive: boolean;
}

interface AdminState {
  tenants: Tenant[];
  users: User[];
  providers: AiProvider[];
  models: AiModel[];
  hydrated: boolean;
  hydrate: () => void;
  updateProvider: (code: ProviderCode, patch: Partial<AiProvider>) => void;
  toggleProvider: (code: ProviderCode) => void;
  updateModel: (id: string, patch: Partial<AiModel>) => void;
  toggleModel: (id: string) => void;
  createProvider: (input: CreateProviderInput) => AiProvider | null;
  createModel: (input: CreateModelInput) => AiModel | null;
  createTenant: (input: CreateTenantInput) => Tenant | null;
  topUpTenant: (id: string, amount: number, freePlan: number) => void;
  toggleTenant: (id: string) => void;
  createUser: (input: CreateUserInput) => User | null;
  toggleUser: (id: string) => void;
  setCmsAccess: (id: string, value: boolean) => void;
}

function persist(
  tenants: Tenant[],
  users: User[],
  providers: AiProvider[],
  models: AiModel[],
): void {
  writeJson<AdminSnapshot>(STORAGE_KEYS.admin, { tenants, users, providers, models });
}

export const useAdminStore = create<AdminState>()((set, get) => ({
  tenants: [],
  users: [],
  providers: [],
  models: [],
  hydrated: false,

  hydrate: () => {
    const stored = readJson<AdminSnapshot | null>(STORAGE_KEYS.admin, null);
    if (!stored?.users || !stored?.providers || !stored?.models) {
      set({
        tenants: SEED_TENANTS,
        users: SEED_USERS,
        providers: SEED_PROVIDERS,
        models: SEED_MODELS,
        hydrated: true,
      });
      return;
    }
    set({
      tenants: stored.tenants ?? SEED_TENANTS,
      users: stored.users,
      providers: stored.providers,
      models: stored.models,
      hydrated: true,
    });
  },

  updateProvider: (code, patch) => {
    const providers = get().providers.map((provider) =>
      provider.code === code
        ? { ...provider, ...patch, updatedAt: new Date().toISOString() }
        : provider,
    );
    persist(get().tenants, get().users, providers, get().models);
    set({ providers });
  },

  toggleProvider: (code) => {
    const providers = get().providers.map((provider) =>
      provider.code === code
        ? { ...provider, isActive: !provider.isActive, updatedAt: new Date().toISOString() }
        : provider,
    );
    persist(get().tenants, get().users, providers, get().models);
    set({ providers });
  },

  updateModel: (id, patch) => {
    const models = get().models.map((model) => (model.id === id ? { ...model, ...patch } : model));
    persist(get().tenants, get().users, get().providers, models);
    set({ models });
  },

  toggleModel: (id) => {
    const models = get().models.map((model) =>
      model.id === id ? { ...model, isActive: !model.isActive } : model,
    );
    persist(get().tenants, get().users, get().providers, models);
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
    persist(get().tenants, get().users, providers, get().models);
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
    persist(get().tenants, get().users, get().providers, models);
    set({ models });
    return model;
  },

  createTenant: (input) => {
    const slug = input.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
    if (!slug || get().tenants.some((tenant) => tenant.slug === slug)) return null;

    const tenant: Tenant = {
      id: `ten_${crypto.randomUUID().slice(0, 8)}`,
      name: input.name.trim(),
      slug,
      tokenBalance: Math.max(0, Math.round(input.tokenBalance)),
      freePlanRemaining: Math.max(0, Math.round(input.freePlanRemaining)),
      isActive: input.isActive,
      createdAt: new Date().toISOString(),
    };
    const tenants = [...get().tenants, tenant];
    persist(tenants, get().users, get().providers, get().models);
    set({ tenants });
    upsertTenantWallet(tenant.id, {
      tokenBalance: tenant.tokenBalance,
      freePlanRemaining: tenant.freePlanRemaining,
      isActive: tenant.isActive,
    });
    return tenant;
  },

  topUpTenant: (id, amount, freePlan) => {
    const tenants = get().tenants.map((tenant) =>
      tenant.id === id
        ? {
            ...tenant,
            tokenBalance: Math.max(0, tenant.tokenBalance + amount),
            freePlanRemaining: Math.max(0, tenant.freePlanRemaining + freePlan),
          }
        : tenant,
    );
    persist(tenants, get().users, get().providers, get().models);
    set({ tenants });

    const updated = tenants.find((tenant) => tenant.id === id);
    if (updated) {
      upsertTenantWallet(updated.id, {
        tokenBalance: updated.tokenBalance,
        freePlanRemaining: updated.freePlanRemaining,
        isActive: updated.isActive,
      });
      useSessionStore.getState().updateTenant(id, {
        tokenBalance: updated.tokenBalance,
        freePlanRemaining: updated.freePlanRemaining,
      });
    }
  },

  toggleTenant: (id) => {
    const tenants = get().tenants.map((tenant) =>
      tenant.id === id ? { ...tenant, isActive: !tenant.isActive } : tenant,
    );
    persist(tenants, get().users, get().providers, get().models);
    set({ tenants });

    const updated = tenants.find((tenant) => tenant.id === id);
    if (updated) {
      upsertTenantWallet(updated.id, {
        tokenBalance: updated.tokenBalance,
        freePlanRemaining: updated.freePlanRemaining,
        isActive: updated.isActive,
      });
      useSessionStore.getState().updateTenant(id, { isActive: updated.isActive });
    }
  },

  createUser: (input) => {
    const email = input.email.trim().toLowerCase();
    if (get().users.some((user) => user.email === email)) return null;
    const tenant = get().tenants.find((item) => item.id === input.tenantId);
    const user: User = {
      id: `usr_${crypto.randomUUID().slice(0, 8)}`,
      tenantId: input.tenantId,
      tenantName: tenant?.name ?? "Tenant",
      email,
      fullName: input.fullName.trim(),
      role: input.role,
      cmsAccess: input.role === "SUPERADMIN" ? true : input.cmsAccess,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    const users = [user, ...get().users];
    persist(get().tenants, users, get().providers, get().models);
    set({ users });
    if (user.cmsAccess) grantCmsAccessOverride(user.id);
    return user;
  },

  toggleUser: (id) => {
    const users = get().users.map((user) =>
      user.id === id ? { ...user, isActive: !user.isActive } : user,
    );
    persist(get().tenants, users, get().providers, get().models);
    set({ users });

    const updated = users.find((user) => user.id === id);
    if (updated) {
      useSessionStore.getState().updateUser(id, { isActive: updated.isActive });
    }
  },

  setCmsAccess: (id, value) => {
    const users = get().users.map((user) =>
      user.id === id ? { ...user, cmsAccess: value } : user,
    );
    persist(get().tenants, users, get().providers, get().models);
    set({ users });
    if (value) {
      grantCmsAccessOverride(id);
    } else {
      revokeCmsAccessOverride(id);
    }
    useSessionStore.getState().updateUser(id, { cmsAccess: value });
  },
}));
