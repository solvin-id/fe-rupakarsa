import type {} from "../api-contract";
import { apiRequest, apiUpload } from "./client";
import type {
  AdminContact,
  AdminWorkspacesPayload,
  AiModel,
  AiProvider,
  CreatedGeneration,
  Folder,
  FolderWithStats,
  Generation,
  GenerationParams,
  ModelAllowedParams,
  ModelTemplate,
  PlanResponse,
  PublicConfig,
  Role,
  SessionPayload,
  UploadedAsset,
  User,
  Workspace,
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
  modelId: string;
  rawPrompt: string;
  durationSec?: number;
  resolution: string;
  aspectRatio: string;
  hasReference: boolean;
}

export interface CreateGenerationInput {
  folderId: string;
  modelId: string;
  rawPrompt: string;
  plannedPrompt: string;
  referenceImageUrl: string | null;
  selectedParams: GenerationParams;
  simulateFailure: boolean;
}

export interface CreateAccountInput {
  fullName: string;
  email: string;
  role: Role;
  cmsAccess: boolean;
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
  isActive: boolean;
}

export interface UpdateProviderInput {
  name?: string;
  baseUrl?: string;
  apiKey?: string;
  isActive?: boolean;
}

export interface CreateModelInput {
  providerId: string;
  code: string;
  displayName: string;
  mediaType: "VIDEO" | "IMAGE";
  allowedParams: ModelAllowedParams;
  tokenCost: number;
  isActive: boolean;
}

export interface UpdateModelInput {
  tokenCost?: number;
  allowedParams?: ModelAllowedParams;
  isActive?: boolean;
}

export const creatorApi = {
  login: (input: LoginInput) =>
    apiRequest<SessionPayload>("/api/creator/auth/login", { method: "POST", body: input }),
  logout: () => apiRequest<void>("/api/creator/auth/logout", { method: "POST" }),
  changePassword: (input: { currentPassword: string; newPassword: string }) =>
    apiRequest<void>("/api/creator/auth/password", { method: "POST", body: input }),
  session: () => apiRequest<SessionPayload>("/api/creator/session"),

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

  models: () => apiRequest<AiModel[]>("/api/creator/models"),

  folders: () => apiRequest<FolderWithStats[]>("/api/creator/folders"),
  createFolder: (input: { name: string; description?: string }) =>
    apiRequest<Folder>("/api/creator/folders", { method: "POST", body: input }),
  updateFolder: (folderId: string, input: { name?: string; description?: string }) =>
    apiRequest<Folder>(`/api/creator/folders/${folderId}`, { method: "PATCH", body: input }),
  deleteFolder: (folderId: string) =>
    apiRequest<void>(`/api/creator/folders/${folderId}`, { method: "DELETE" }),
  folderGenerations: (folderId: string) =>
    apiRequest<Generation[]>(`/api/creator/folders/${folderId}/generations`),

  planGeneration: (input: PlanGenerationInput) =>
    apiRequest<PlanResponse>("/api/creator/generations/plan", { method: "POST", body: input }),
  createGeneration: (input: CreateGenerationInput) =>
    apiRequest<CreatedGeneration>("/api/creator/generations", { method: "POST", body: input }),
  generation: (generationId: string) =>
    apiRequest<Generation>(`/api/creator/generations/${generationId}`),
  deleteGeneration: (generationId: string) =>
    apiRequest<void>(`/api/creator/generations/${generationId}`, { method: "DELETE" }),
  uploadReference: (file: File) => apiUpload<UploadedAsset>("/api/creator/uploads", file),
};

export const cmsApi = {
  accounts: () => apiRequest<User[]>("/api/cms/accounts"),
  createAccount: (input: CreateAccountInput) =>
    apiRequest<{ account: User; temporaryPassword: string }>("/api/cms/accounts", {
      method: "POST",
      body: input,
    }),
  updateAccount: (accountId: string, input: { isActive?: boolean; cmsAccess?: boolean }) =>
    apiRequest<User>(`/api/cms/accounts/${accountId}`, { method: "PATCH", body: input }),

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
  testProvider: (providerId: string) =>
    apiRequest<{ ok: boolean; message: string }>(`/api/cms/providers/${providerId}/test`, {
      method: "POST",
    }),

  models: () => apiRequest<AiModel[]>("/api/cms/models"),
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
};

export function fetchPublicConfig(): Promise<PublicConfig> {
  return apiRequest<PublicConfig>("/api/public/config");
}

export type { WorkspaceRole };
