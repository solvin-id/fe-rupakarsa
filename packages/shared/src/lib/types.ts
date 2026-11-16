export type Role = "USER" | "SUPERADMIN";
export type WorkspaceRole = "OWNER" | "ADMIN" | "MEMBER";
export type JoinRequestStatus = "PENDING" | "APPROVED" | "REJECTED";
export type MediaType = "VIDEO" | "IMAGE";
export type GenerationStatus = "QUEUED" | "RENDERING" | "COMPLETED" | "FAILED";
export type ProviderCode = string;

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

export interface User {
  id: string;
  defaultWorkspaceId: string | null;
  email: string;
  fullName: string;
  role: Role;
  cmsAccess: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface SessionPayload {
  user: User;
  workspace: Workspace;
  memberships: WorkspaceMembership[];
  workspaces: Workspace[];
  activeWorkspaceRole: WorkspaceRole;
}

export interface UserSummary {
  id: string;
  fullName: string;
  email: string;
}

export interface WorkspaceMemberSummary extends WorkspaceMembership {
  user: UserSummary;
}

export interface WorkspaceRequestSummary extends WorkspaceJoinRequest {
  user: UserSummary;
}

export interface MyJoinRequest extends WorkspaceJoinRequest {
  workspace: { id: string; name: string; slug: string };
}

export interface WorkspacesPayload {
  workspaces: Workspace[];
  memberships: WorkspaceMembership[];
  manageableRequests: WorkspaceRequestSummary[];
  myRequests: MyJoinRequest[];
}

export interface Folder {
  id: string;
  workspaceId: string;
  userId: string | null;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface FolderWithStats extends Folder {
  videoCount: number;
  imageCount: number;
  tokensUsed: number;
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
  userId: string | null;
  modelId: string | null;
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

export interface ModelTemplate {
  providerCode: string;
  code: string;
  displayName: string;
  mediaType: MediaType;
  allowedParams: ModelAllowedParams;
  tokenCost: number;
}

export interface AdminContact {
  name: string;
  whatsapp: string;
  email: string;
}

export interface Pricing {
  tokenValueRupiah: number;
  packageTokens: number;
  packagePlanQuota: number;
  planModeTokenCost: number;
}

export interface PublicConfig {
  contact: AdminContact;
  pricing: Pricing;
  features: { simulation: boolean };
}

export interface PlanResponse {
  blueprint: PlanBlueprint;
  cost: { tokens: number; usesFreeQuota: boolean };
  workspace: Workspace;
}

export interface CreatedGeneration {
  generation: Generation;
  workspace: Workspace;
}

export interface UploadedAsset {
  url: string;
  mime: string;
  size: number;
}

export interface AdminWorkspacesPayload {
  workspaces: Workspace[];
  memberships: WorkspaceMemberSummary[];
}
