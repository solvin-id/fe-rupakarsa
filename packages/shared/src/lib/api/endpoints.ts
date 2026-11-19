import type {} from "../api-contract";
import { apiRequest, apiUpload } from "./client";
import type {
  ActiveGeneration,
  AdminContact,
  AiActivityFilters,
  AiActivityPage,
  AiCharacterReference,
  AdminWorkspacesPayload,
  AiModel,
  AiProvider,
  AssetAnalysis,
  AuditLog,
  CmsOrder,
  CreatedGeneration,
  Folder,
  FolderContext,
  FolderWithStats,
  Generation,
  GenerationParams,
  LimitsSettings,
  LoginResponse,
  MailSettings,
  MediaCapability,
  MediaType,
  ModelMediaType,
  ModelAllowedParams,
  ModelTemplate,
  Order,
  PackageOffer,
  PlanResponse,
  PublicConfig,
  RemoteModel,
  Role,
  SessionPayload,
  StorageList,
  StorageSettings,
  StorageUsage,
  SyncResult,
  TotpEnrollment,
  UploadedAsset,
  User,
  Workspace,
  WorkspaceDrive,
  WorkspaceJoinRequest,
  WorkspaceMemberSummary,
  WorkspaceMembership,
  WorkspaceRole,
  WorkspacesPayload,
} from "../types";

export interface LoginInput {
  email: string;
  password: string;
}

export interface PlanGenerationInput {
  folderId: string;
  modelId: string;
  rawPrompt: string;
  durationSec?: number;
  resolution: string;
  aspectRatio: string;
  attachmentKeys: string[];
  contextIds: string[];
  chainSceneIds: string[];
}

export interface CreateGenerationInput {
  folderId: string;
  modelId: string;
  rawPrompt: string;
  planMode: boolean;
  finalPrompt: string | null;
  attachmentKeys: string[];
  contextIds: string[];
  selectedParams: GenerationParams;
  chainSceneIds: string[];
}

export type AccountWorkspaceMode = "PERSONAL" | "EXISTING";

export interface CreateAccountInput {
  fullName: string;
  email: string;
  role: Role;
  cmsAccess: boolean;
  workspaceMode: AccountWorkspaceMode;
  workspaceIds: string[];
  password?: string;
}

export interface CreateAdminWorkspaceInput {
  name: string;
  slug: string;
  ownerId: string;
  tokenBalance?: number;
  freePlanRemaining?: number;
  isActive?: boolean;
}

export interface CreateProviderInput {
  name: string;
  code: string;
  baseUrl: string;
  apiKey: string;
  modelsPath: string;
  supportsVideoInput: boolean;
  isActive: boolean;
}

export interface UpdateProviderInput {
  name?: string;
  baseUrl?: string;
  apiKey?: string;
  modelsPath?: string;
  supportsVideoInput?: boolean;
  isActive?: boolean;
}

export interface CreateModelInput {
  providerId: string;
  code: string;
  displayName: string;
  providerModelId?: string;
  mediaType: ModelMediaType;
  inputCapabilities?: MediaCapability[];
  outputCapabilities?: MediaCapability[];
  allowedParams: ModelAllowedParams;
  tokenCost: number;
  maxPromptChars?: number | null;
  thinkingEnabled?: boolean;
  customReferenceId?: string | null;
  isActive: boolean;
}

export interface UpdateModelInput {
  displayName?: string;
  providerModelId?: string;
  inputCapabilities?: MediaCapability[];
  outputCapabilities?: MediaCapability[];
  tokenCost?: number;
  maxPromptChars?: number | null;
  thinkingEnabled?: boolean;
  customReferenceId?: string | null;
  allowedParams?: ModelAllowedParams;
  isActive?: boolean;
}

export interface ModelFilters {
  providerId?: string;
  input?: MediaCapability;
  output?: MediaCapability;
  q?: string;
  active?: boolean;
}

export interface StorageFilters {
  type?: MediaType;
  source?: "UPLOAD" | "GENERATION";
  q?: string;
  cursor?: string | null;
  limit?: number;
}

function modelQuery(filters: ModelFilters): string {
  const params = new URLSearchParams();
  if (filters.providerId) params.set("providerId", filters.providerId);
  if (filters.input) params.set("input", filters.input);
  if (filters.output) params.set("output", filters.output);
  if (filters.q) params.set("q", filters.q);
  if (filters.active !== undefined) params.set("active", String(filters.active));
  const query = params.toString();
  return query.length > 0 ? `?${query}` : "";
}

/** Every filter is optional except paging/sorting, which the API always expects. */
export function aiActivityQuery(filters: AiActivityFilters): string {
  const params = new URLSearchParams();
  params.set("page", String(filters.page));
  params.set("limit", String(filters.limit));
  params.set("orderBy", filters.orderBy);
  params.set("order", filters.order);
  if (filters.q) params.set("q", filters.q);
  if (filters.kind) params.set("kind", filters.kind);
  if (filters.status) params.set("status", filters.status);
  if (filters.providerId) params.set("providerId", filters.providerId);
  if (filters.modelId) params.set("modelId", filters.modelId);
  if (filters.workspaceId) params.set("workspaceId", filters.workspaceId);
  if (filters.mediaType) params.set("mediaType", filters.mediaType);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  return `?${params.toString()}`;
}

export function storageQuery(filters: StorageFilters): string {
  const params = new URLSearchParams();
  if (filters.type) params.set("type", filters.type);
  if (filters.source) params.set("source", filters.source);
  if (filters.q) params.set("q", filters.q);
  if (filters.cursor) params.set("cursor", filters.cursor);
  if (filters.limit) params.set("limit", String(filters.limit));
  const query = params.toString();
  return query.length > 0 ? `?${query}` : "";
}

export const creatorApi = {
  login: (input: LoginInput) =>
    apiRequest<LoginResponse>("/api/creator/auth/login", { method: "POST", body: input }),
  totpChallenge: (input: { challengeToken: string; code: string }) =>
    apiRequest<SessionPayload>("/api/creator/auth/totp/challenge", { method: "POST", body: input }),
  totpEnroll: () =>
    apiRequest<TotpEnrollment>("/api/creator/auth/totp/enroll", { method: "POST" }),
  totpActivate: (code: string) =>
    apiRequest<void>("/api/creator/auth/totp/activate", { method: "POST", body: { code } }),
  totpDisable: (code: string) =>
    apiRequest<void>("/api/creator/auth/totp", { method: "PATCH", body: { enabled: false, code } }),
  requestPasswordReset: (email: string) =>
    apiRequest<{ ok: boolean }>("/api/creator/auth/password-reset/request", {
      method: "POST",
      body: { email },
    }),
  confirmPasswordReset: (input: { token: string; newPassword: string }) =>
    apiRequest<void>("/api/creator/auth/password-reset/confirm", { method: "POST", body: input }),
  logout: () => apiRequest<void>("/api/creator/auth/logout", { method: "POST" }),
  changePassword: (input: { currentPassword: string; newPassword: string }) =>
    apiRequest<void>("/api/creator/auth/password", { method: "POST", body: input }),
  session: () => apiRequest<SessionPayload>("/api/creator/session"),
  exportAccount: () => apiRequest<Record<string, unknown>>("/api/creator/account/export"),
  deleteAccount: (password: string) =>
    apiRequest<void>("/api/creator/account", { method: "DELETE", body: { password } }),

  workspaces: () => apiRequest<WorkspacesPayload>("/api/creator/workspaces"),
  activateWorkspace: (workspaceId: string) =>
    apiRequest<SessionPayload>(`/api/creator/workspaces/${workspaceId}/activate`, { method: "POST" }),
  createWorkspace: (input: { name: string; slug?: string }) =>
    apiRequest<Workspace>("/api/creator/workspaces", { method: "POST", body: input }),
  renameWorkspace: (workspaceId: string, input: { name: string }) =>
    apiRequest<Workspace>(`/api/creator/workspaces/${workspaceId}`, { method: "PATCH", body: input }),
  deleteWorkspace: (workspaceId: string) =>
    apiRequest<void>(`/api/creator/workspaces/${workspaceId}`, { method: "DELETE" }),
  leaveWorkspace: (workspaceId: string) =>
    apiRequest<void>(`/api/creator/workspaces/${workspaceId}/leave`, { method: "POST" }),
  members: (workspaceId: string) =>
    apiRequest<WorkspaceMemberSummary[]>(`/api/creator/workspaces/${workspaceId}/members`),
  updateMemberRole: (workspaceId: string, userId: string, role: "ADMIN" | "MEMBER") =>
    apiRequest<WorkspaceMembership>(`/api/creator/workspaces/${workspaceId}/members/${userId}`, {
      method: "PATCH",
      body: { role },
    }),
  removeMember: (workspaceId: string, userId: string) =>
    apiRequest<void>(`/api/creator/workspaces/${workspaceId}/members/${userId}`, { method: "DELETE" }),
  requestJoin: (input: { slug: string; message?: string }) =>
    apiRequest<WorkspaceJoinRequest>("/api/creator/join-requests", { method: "POST", body: input }),
  approveJoinRequest: (requestId: string) =>
    apiRequest<void>(`/api/creator/join-requests/${requestId}/approve`, { method: "POST" }),
  rejectJoinRequest: (requestId: string) =>
    apiRequest<void>(`/api/creator/join-requests/${requestId}/reject`, { method: "POST" }),

  workspaceDrive: (workspaceId: string) =>
    apiRequest<WorkspaceDrive>(`/api/creator/workspaces/${workspaceId}/storage/drive`),
  startWorkspaceDrive: (workspaceId: string) =>
    apiRequest<{ url: string }>(`/api/creator/workspaces/${workspaceId}/storage/drive/start`, {
      method: "POST",
    }),
  disconnectWorkspaceDrive: (workspaceId: string) =>
    apiRequest<void>(`/api/creator/workspaces/${workspaceId}/storage/drive`, { method: "DELETE" }),
  testWorkspaceDrive: (workspaceId: string) =>
    apiRequest<{ ok: boolean; message: string }>(
      `/api/creator/workspaces/${workspaceId}/storage/drive/test`,
      { method: "POST" },
    ),

  models: () => apiRequest<AiModel[]>("/api/creator/models"),

  folders: () => apiRequest<FolderWithStats[]>("/api/creator/folders"),
  createFolder: (input: { name: string; description?: string }) =>
    apiRequest<Folder>("/api/creator/folders", { method: "POST", body: input }),
  updateFolder: (folderId: string, input: { name?: string; description?: string; characterReferenceId?: string | null }) =>
    apiRequest<Folder>(`/api/creator/folders/${folderId}`, { method: "PATCH", body: input }),
  deleteFolder: (folderId: string) =>
    apiRequest<void>(`/api/creator/folders/${folderId}`, { method: "DELETE" }),
  folderGenerations: (folderId: string) =>
    apiRequest<Generation[]>(`/api/creator/folders/${folderId}/generations`),

  folderContexts: (folderId: string) =>
    apiRequest<FolderContext[]>(`/api/creator/folders/${folderId}/contexts`),
  createFolderContext: (
    folderId: string,
    input: {
      source: "TEXT" | "UPLOAD" | "GENERATION";
      label?: string;
      text?: string;
      mediaAssetId?: string;
      generationId?: string;
    },
  ) => apiRequest<FolderContext>(`/api/creator/folders/${folderId}/contexts`, { method: "POST", body: input }),
  updateFolderContext: (
    contextId: string,
    input: { label?: string; text?: string; isActive?: boolean },
  ) => apiRequest<FolderContext>(`/api/creator/contexts/${contextId}`, { method: "PATCH", body: input }),
  deleteFolderContext: (contextId: string) =>
    apiRequest<void>(`/api/creator/contexts/${contextId}`, { method: "DELETE" }),
  analyzeAsset: (input: { mediaAssetId?: string; generationId?: string; refresh?: boolean }) =>
    apiRequest<AssetAnalysis>("/api/creator/analyses", { method: "POST", body: input }),

  planGeneration: (input: PlanGenerationInput) =>
    apiRequest<PlanResponse>("/api/creator/generations/plan", { method: "POST", body: input }),
  createGeneration: (input: CreateGenerationInput) =>
    apiRequest<CreatedGeneration>("/api/creator/generations", { method: "POST", body: input }),
  generation: (generationId: string) =>
    apiRequest<Generation>(`/api/creator/generations/${generationId}`),
  activeGenerations: () =>
    apiRequest<ActiveGeneration[]>("/api/creator/generations?active=true"),
  deleteGeneration: (generationId: string) =>
    apiRequest<void>(`/api/creator/generations/${generationId}`, { method: "DELETE" }),
  uploadReference: (file: File) => apiUpload<UploadedAsset>("/api/creator/uploads", file),

  characters: () => apiRequest<AiCharacterReference[]>("/api/creator/characters"),
  trainCharacter: (input: {
    name: string;
    modelVersion: "v1" | "v2" | "cinema";
    imageAssetIds: string[];
  }) => apiRequest<AiCharacterReference>("/api/creator/characters", { method: "POST", body: input }),
  refreshCharacter: (characterId: string) =>
    apiRequest<AiCharacterReference>(`/api/creator/characters/${characterId}/refresh`, {
      method: "POST",
    }),

  storage: (filters: StorageFilters) =>
    apiRequest<StorageList>(`/api/creator/storage${storageQuery(filters)}`),
  deleteAsset: (assetId: string) =>
    apiRequest<void>(`/api/creator/storage/${assetId}`, { method: "DELETE" }),

  billingPackages: () => apiRequest<PackageOffer[]>("/api/creator/billing/packages"),
  createOrder: (packageId: string) =>
    apiRequest<{ order: Order; redirectUrl: string | null }>("/api/creator/billing/orders", {
      method: "POST",
      body: { id: packageId },
    }),
  billingOrders: () => apiRequest<Order[]>("/api/creator/billing/orders"),
};

export const cmsApi = {
  accounts: () => apiRequest<User[]>("/api/cms/accounts"),
  createAccount: (input: CreateAccountInput) =>
    apiRequest<{ account: User; temporaryPassword: string }>("/api/cms/accounts", {
      method: "POST",
      body: input,
    }),
  updateAccount: (
    accountId: string,
    input: { isActive?: boolean; cmsAccess?: boolean; defaultWorkspaceId?: string },
  ) => apiRequest<User>(`/api/cms/accounts/${accountId}`, { method: "PATCH", body: input }),
  addAccountWorkspaces: (accountId: string, workspaceIds: string[]) =>
    apiRequest<WorkspaceMembership[]>(`/api/cms/accounts/${accountId}/workspaces`, {
      method: "POST",
      body: { workspaceIds },
    }),
  removeAccountWorkspace: (accountId: string, workspaceId: string) =>
    apiRequest<void>(`/api/cms/accounts/${accountId}/workspaces/${workspaceId}`, {
      method: "DELETE",
    }),

  workspaces: () => apiRequest<AdminWorkspacesPayload>("/api/cms/workspaces"),
  createWorkspace: (input: CreateAdminWorkspaceInput) =>
    apiRequest<Workspace>("/api/cms/workspaces", { method: "POST", body: input }),
  updateWorkspace: (workspaceId: string, input: { name?: string; isActive?: boolean }) =>
    apiRequest<Workspace>(`/api/cms/workspaces/${workspaceId}`, { method: "PATCH", body: input }),
  topUpWorkspace: (workspaceId: string, input: { tokens: number; plan: number }) =>
    apiRequest<Workspace>(`/api/cms/workspaces/${workspaceId}/topup`, { method: "POST", body: input }),

  providers: () => apiRequest<AiProvider[]>("/api/cms/providers"),
  createProvider: (input: CreateProviderInput) =>
    apiRequest<AiProvider>("/api/cms/providers", { method: "POST", body: input }),
  updateProvider: (providerId: string, input: UpdateProviderInput) =>
    apiRequest<AiProvider>(`/api/cms/providers/${providerId}`, { method: "PATCH", body: input }),
  deleteProvider: (providerId: string) =>
    apiRequest<void>(`/api/cms/providers/${providerId}`, { method: "DELETE" }),
  testProvider: (providerId: string) =>
    apiRequest<{ ok: boolean; message: string }>(`/api/cms/providers/${providerId}/test`, {
      method: "POST",
    }),
  syncProviderModels: (providerId: string) =>
    apiRequest<SyncResult>(`/api/cms/providers/${providerId}/sync-models`, { method: "POST" }),
  remoteModels: (providerId: string) =>
    apiRequest<{ models: RemoteModel[] }>(`/api/cms/providers/${providerId}/remote-models`),

  models: (filters: ModelFilters = {}) =>
    apiRequest<AiModel[]>(`/api/cms/models${modelQuery(filters)}`),
  createModel: (input: CreateModelInput) =>
    apiRequest<AiModel>("/api/cms/models", { method: "POST", body: input }),
  updateModel: (modelId: string, input: UpdateModelInput) =>
    apiRequest<AiModel>(`/api/cms/models/${modelId}`, { method: "PATCH", body: input }),
  modelTemplates: (providerCode?: string) =>
    apiRequest<ModelTemplate[]>(
      providerCode
        ? `/api/cms/model-templates?providerCode=${encodeURIComponent(providerCode)}`
        : "/api/cms/model-templates",
    ),

  contact: () => apiRequest<AdminContact>("/api/cms/settings/contact"),
  updateContact: (input: AdminContact) =>
    apiRequest<AdminContact>("/api/cms/settings/contact", { method: "PUT", body: input }),

  limits: () => apiRequest<LimitsSettings>("/api/cms/settings/limits"),
  updateLimits: (input: LimitsSettings) =>
    apiRequest<LimitsSettings>("/api/cms/settings/limits", { method: "PUT", body: input }),

  storageSettings: () => apiRequest<StorageSettings>("/api/cms/settings/storage"),
  updateStorageSettings: (input: {
    driver: "local" | "s3";
    retentionDays: number;
    s3: {
      endpoint: string;
      region: string;
      bucket: string;
      accessKeyId: string;
      secretAccessKey?: string;
      publicBaseUrl: string;
      forcePathStyle: boolean;
    };
    gdrive: { clientId: string; clientSecret?: string };
  }) => apiRequest<StorageSettings>("/api/cms/settings/storage", { method: "PUT", body: input }),
  testStorage: (driver: "local" | "s3") =>
    apiRequest<{ ok: boolean; message: string }>("/api/cms/settings/storage/test", {
      method: "POST",
      body: { driver },
    }),
  storageUsage: () => apiRequest<StorageUsage>("/api/cms/settings/storage/usage"),

  mailSettings: () => apiRequest<MailSettings>("/api/cms/settings/mail"),
  updateMailSettings: (input: {
    driver: "smtp" | "log";
    fromName: string;
    fromEmail: string;
    smtp: { host: string; port: number; secure: boolean; user: string; password?: string };
  }) => apiRequest<MailSettings>("/api/cms/settings/mail", { method: "PUT", body: input }),
  testMail: (to: string) =>
    apiRequest<{ ok: boolean; message: string }>("/api/cms/settings/mail/test", {
      method: "POST",
      body: { to },
    }),

  orders: () => apiRequest<CmsOrder[]>("/api/cms/orders"),
  markOrderPaid: (orderId: string) =>
    apiRequest<Workspace>(`/api/cms/orders/${orderId}/mark-paid`, { method: "POST" }),

  aiActivity: (filters: AiActivityFilters) =>
    apiRequest<AiActivityPage>(`/api/cms/ai-activity${aiActivityQuery(filters)}`),

  characters: () => apiRequest<AiCharacterReference[]>("/api/cms/higgsfield/characters"),

  auditLogs: (before?: string) =>
    apiRequest<AuditLog[]>(
      before
        ? `/api/cms/audit-logs?limit=50&before=${encodeURIComponent(before)}`
        : "/api/cms/audit-logs?limit=50",
    ),
};

export function fetchPublicConfig(): Promise<PublicConfig> {
  return apiRequest<PublicConfig>("/api/public/config");
}

export type { WorkspaceRole };
