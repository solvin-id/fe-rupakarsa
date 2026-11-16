export type Role = "USER" | "SUPERADMIN";
export type WorkspaceRole = "OWNER" | "ADMIN" | "MEMBER";
export type JoinRequestStatus = "PENDING" | "APPROVED" | "REJECTED";
export type MediaType = "VIDEO" | "IMAGE";
export type GenerationStatus = "QUEUED" | "RENDERING" | "COMPLETED" | "FAILED";
export type ProviderCode = string;

export type ActionResult = { ok: true } | { ok: false; message: string };
export type Result<T> = { ok: true; value: T } | { ok: false; message: string };

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  tokenBalance: number;
  freePlanRemaining: number;
  isActive: boolean;
  createdAt: string;
}

export interface WorkspaceMembership {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  joinedAt: string;
}

export interface WorkspaceJoinRequest {
  id: string;
  workspaceId: string;
  userId: string;
  message: string;
  status: JoinRequestStatus;
  createdAt: string;
  resolvedAt: string | null;
  resolvedByUserId: string | null;
}

export interface WorkspaceRegistry {
  workspaces: Workspace[];
  memberships: WorkspaceMembership[];
  requests: WorkspaceJoinRequest[];
}

export interface User {
  id: string;
  defaultWorkspaceId: string;
  email: string;
  fullName: string;
  role: Role;
  cmsAccess: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface Session {
  user: User;
  workspace: Workspace;
  signedInAt: string;
}

export interface SessionCookie {
  userId: string;
  workspaceId: string;
  signedInAt: string;
}

export interface Folder {
  id: string;
  workspaceId: string;
  userId: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface GenerationParams {
  durationSec?: number;
  resolution: string;
  aspectRatio: string;
}

export interface Generation {
  id: string;
  workspaceId: string;
  folderId: string;
  userId: string;
  modelId: string;
  modelName: string;
  mediaType: MediaType;
  rawPrompt: string;
  plannedPrompt: string;
  referenceImageUrl: string | null;
  selectedParams: GenerationParams;
  tokensCharged: number;
  status: GenerationStatus;
  externalJobId: string | null;
  outputUrl: string | null;
  errorMessage: string | null;
  refunded: boolean;
  createdAt: string;
  completedAt: string | null;
}

export interface AiProvider {
  id: string;
  code: ProviderCode;
  name: string;
  baseUrl: string;
  apiKeyMasked: string;
  isActive: boolean;
  updatedAt: string;
}

export interface ModelAllowedParams {
  durations?: number[];
  resolutions: string[];
  aspectRatios: string[];
}

export interface AiModel {
  id: string;
  providerId: string;
  code: string;
  displayName: string;
  mediaType: MediaType;
  allowedParams: ModelAllowedParams;
  tokenCost: number;
  isActive: boolean;
}

export interface PlanBlueprint {
  prompt: string;
  direction: string;
  negativePrompt: string;
}

export interface DemoAccount {
  email: string;
  password: string;
  userId: string;
}

export interface WorkspaceSnapshot {
  folders: Folder[];
  generations: Generation[];
}

export interface CatalogSnapshot {
  providers: AiProvider[];
  models: AiModel[];
}
