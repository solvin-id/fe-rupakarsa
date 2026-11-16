import type { User, WorkspaceRole } from "./types";

export function isActiveUser(user: User | null | undefined): user is User {
  return Boolean(user?.isActive);
}

export function isWorkspaceOwner(role: WorkspaceRole | null | undefined): boolean {
  return role === "OWNER";
}

export function canManageWorkspace(role: WorkspaceRole | null | undefined): boolean {
  return role === "OWNER" || role === "ADMIN";
}

export function hasCmsAccess(user: User | null | undefined): boolean {
  return Boolean(user?.isActive && (user.role === "SUPERADMIN" || user.cmsAccess));
}

export type SignInAuthorization = { ok: true } | { ok: false; message: string };

export function authorizeSignIn(user: User | null | undefined): SignInAuthorization {
  if (!user) {
    return {
      ok: false,
      message:
        "Akun tidak ditemukan atau password salah. Akun dibuat oleh Superadmin Rupakarsa.",
    };
  }
  if (!user.isActive) {
    return { ok: false, message: "Akun ini sedang tidak aktif. Hubungi Superadmin." };
  }
  return { ok: true };
}
