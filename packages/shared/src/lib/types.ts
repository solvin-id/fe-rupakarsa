export type Role = "USER" | "SUPERADMIN";
export type WorkspaceRole = "OWNER" | "ADMIN" | "MEMBER";
export type JoinRequestStatus = "PENDING" | "APPROVED" | "REJECTED";
export type MediaType = "VIDEO" | "IMAGE";
/** Catalog models also cover plan/analysis models, which carry no render output. */
export type ModelMediaType = "VIDEO" | "IMAGE" | "TEXT";
export type MediaCapability = "TEXT" | "IMAGE" | "VIDEO";
export type GenerationStatus = "QUEUED" | "RENDERING" | "COMPLETED" | "FAILED";
export type ProviderCode = string;
export type ProviderKind = "HIGGSFIELD" | "OPENAI_COMPATIBLE";
export type ContextSource = "TEXT" | "UPLOAD" | "GENERATION";
export type StorageKind = "local" | "s3" | "gdrive";
export type OrderStatus = "PENDING" | "PAID" | "EXPIRED" | "FAILED";

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
  totpEnabled: boolean;
  createdAt: string;
}

export interface SessionPayload {
  user: User;
  workspace: Workspace;
  memberships: WorkspaceMembership[];
  workspaces: Workspace[];
  activeWorkspaceRole: WorkspaceRole;
}

export interface LoginChallenge {
  totpRequired: true;
  challengeToken: string;
}

export type LoginResponse = SessionPayload | LoginChallenge;

export function isLoginChallenge(value: LoginResponse): value is LoginChallenge {
  return "totpRequired" in value && value.totpRequired === true;
}

export interface TotpEnrollment {
  secret: string;
  otpauthUrl: string;
  qrDataUrl: string;
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

export interface FolderContext {
  id: string;
  workspaceId: string;
  folderId: string;
  source: ContextSource;
  label: string;
  text: string;
  mediaAssetId: string | null;
  generationId: string | null;
  createdByUserId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AssetAnalysis {
  sourceKind: "UPLOAD" | "GENERATION";
  sourceId: string;
  text: string;
  structured: Record<string, unknown>;
  modelId: string | null;
  cached: boolean;
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
  planMode: boolean;
  finalPrompt: string;
  analysisSnapshot: string;
  preContextSnapshot: string;
  referenceImageUrl: string | null;
  selectedParams: GenerationParams;
  tokensCharged: number;
  status: GenerationStatus;
  externalJobId: string | null;
  outputUrl: string | null;
  outputMime: string | null;
  outputSize: number;
  outputPurgedAt: string | null;
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
  kind: ProviderKind;
  isFixed: boolean;
  modelsPath: string;
  supportsVideoInput: boolean;
  lastSyncedAt: string | null;
  syncError: string | null;
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
  providerModelId: string;
  mediaType: ModelMediaType;
  inputCapabilities: MediaCapability[];
  outputCapabilities: MediaCapability[];
  source: string;
  allowedParams: ModelAllowedParams;
  tokenCost: number;
  isActive: boolean;
  isDefault: boolean;
}

export interface RemoteModel {
  providerModelId: string;
  displayName: string;
  inputCapabilities: MediaCapability[];
  outputCapabilities: MediaCapability[];
  mediaType: ModelMediaType;
}

export interface SyncResult {
  added: number;
  updated: number;
  skipped: number;
  models: AiModel[];
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
  mediaType: ModelMediaType;
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

export interface PlanModelConfig {
  id: string;
  name: string;
  inputCapabilities: MediaCapability[];
}

export interface PublicConfig {
  contact: AdminContact;
  pricing: Pricing;
  features: { simulation: boolean };
  planModel: PlanModelConfig | null;
  defaults: { videoModelId: string | null };
}

export interface PlanResponse {
  blueprint: PlanBlueprint;
  cost: { tokens: number; usesFreeQuota: boolean };
  workspace: Workspace;
  analysis: { attachments: { key: string; text: string }[]; preContext: string };
}

export interface CreatedGeneration {
  generation: Generation;
  workspace: Workspace;
}

export interface UploadedAsset {
  id: string;
  url: string;
  key: string;
  mime: string;
  size: number;
  durationMs: number | null;
}

export interface AdminWorkspacesPayload {
  workspaces: Workspace[];
  memberships: WorkspaceMemberSummary[];
}

export interface WorkspaceDrive {
  connected: boolean;
  oauthConfigured: boolean;
  googleEmail: string;
  folderId: string;
  folderName: string;
  folderUrl: string;
  connectedAt: string | null;
  lastError: string | null;
  defaultStorage: { kind: "s3" | "local"; retentionDays: number };
}

export interface StorageItem {
  id: string;
  key: string;
  name: string;
  mime: string;
  size: number;
  width: number | null;
  height: number | null;
  durationMs: number | null;
  driver: StorageKind;
  source: "UPLOAD" | "GENERATION";
  url: string;
  generationId: string | null;
  modelName: string | null;
  createdAt: string;
  purgedAt: string | null;
}

export interface StorageTotals {
  count: number;
  bytes: number;
  images: number;
  videos: number;
}

export interface StorageList {
  items: StorageItem[];
  nextCursor: string | null;
  totals: StorageTotals;
}

export interface StorageSettings {
  driver: "local" | "s3";
  retentionDays: number;
  s3: {
    endpoint: string;
    region: string;
    bucket: string;
    accessKeyId: string;
    publicBaseUrl: string;
    forcePathStyle: boolean;
    secretAccessKeyMasked: string;
  };
  gdrive: {
    clientId: string;
    clientSecretMasked: string;
    redirectUri: string;
    configured: boolean;
  };
  workspaces: Array<{
    id: string;
    name: string;
    driveConnected: boolean;
    googleEmail: string;
    folderIdMasked: string;
    folderUrl: string;
    lastError: string | null;
    connectedAt: string | null;
  }>;
}

export interface StorageUsage {
  active: number;
  bytes: number;
  expired: number;
}

export interface MailSettings {
  driver: "smtp" | "log";
  fromName: string;
  fromEmail: string;
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    passwordMasked: string;
  };
}

export interface PackageOffer {
  id: string;
  tokens: number;
  planQuota: number;
  priceRupiah: number;
}

export interface Order {
  id: string;
  workspaceId: string;
  userId: string | null;
  tokens: number;
  planQuota: number;
  amountRupiah: number;
  provider: string;
  providerRef: string | null;
  status: OrderStatus;
  paidAt: string | null;
  createdAt: string;
}

export interface CmsOrder extends Order {
  workspaceName: string;
}

export interface AuditLog {
  id: string;
  actorUserId: string | null;
  action: string;
  targetType: string;
  targetId: string;
  metadata: Record<string, unknown>;
  ip: string;
  createdAt: string;
}
