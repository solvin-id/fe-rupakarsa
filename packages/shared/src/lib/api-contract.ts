import type { components } from "./api-schema";
import type {
  AdminContact,
  AiModel,
  AiProvider,
  Folder,
  Generation,
  SessionPayload,
  User,
  Workspace,
  WorkspaceMembership,
  WorkspacesPayload,
} from "./types";

/**
 * Type-level drift guard between the hand-written DTOs in `types.ts` and the committed OpenAPI
 * schema (`npm run api:types`). Nothing here emits runtime code; a mismatch fails `npm run typecheck`.
 */
type Assert<T extends true> = T;
type IsSame<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

type ApiUser = components["schemas"]["User"];
type ApiWorkspace = components["schemas"]["Workspace"];
type ApiMembership = components["schemas"]["WorkspaceMembership"];
type ApiFolder = components["schemas"]["Folder"];
type ApiGeneration = components["schemas"]["Generation"];
type ApiModel = components["schemas"]["AiModel"];
type ApiProvider = components["schemas"]["AiProvider"];
type ApiContact = components["schemas"]["AdminContact"];
type ApiSession = components["schemas"]["SessionPayload"];
type ApiWorkspaces = components["schemas"]["WorkspacesPayload"];

export type _User = Assert<IsSame<User, ApiUser>>;
export type _Workspace = Assert<IsSame<Workspace, ApiWorkspace>>;
export type _Membership = Assert<IsSame<WorkspaceMembership, ApiMembership>>;
export type _Folder = Assert<IsSame<Folder, ApiFolder>>;
export type _Generation = Assert<IsSame<Generation, ApiGeneration>>;
export type _Model = Assert<IsSame<AiModel, ApiModel>>;
export type _Provider = Assert<IsSame<AiProvider, ApiProvider>>;
export type _Contact = Assert<IsSame<AdminContact, ApiContact>>;
export type _Session = Assert<IsSame<SessionPayload, ApiSession>>;
export type _Workspaces = Assert<IsSame<WorkspacesPayload, ApiWorkspaces>>;
