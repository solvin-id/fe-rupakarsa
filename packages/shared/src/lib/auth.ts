import type { User, WorkspaceRole } from "./types";

export function isWorkspaceOwner(role: WorkspaceRole | null | undefined): boolean {
  return role === "OWNER";
}

export function canManageWorkspace(role: WorkspaceRole | null | undefined): boolean {
  return role === "OWNER" || role === "ADMIN";
}

export function hasCmsAccess(user: User | null | undefined): boolean {
  return Boolean(user?.isActive && (user.role === "SUPERADMIN" || user.cmsAccess));
}
