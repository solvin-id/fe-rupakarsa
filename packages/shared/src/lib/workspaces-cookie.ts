import { readChunkedJsonCookie, writeChunkedJsonCookie } from "./cookies";
import type { WorkspaceRegistry } from "./types";

const COOKIE_NAME = "rupakarsa_workspaces";
const MAX_AGE = 60 * 60 * 24 * 30;

export function readWorkspaceRegistry(): WorkspaceRegistry | null {
  const parsed = readChunkedJsonCookie<WorkspaceRegistry>(COOKIE_NAME);
  if (!parsed || typeof parsed !== "object") return null;
  const { workspaces, memberships, requests } = parsed;
  if (!Array.isArray(workspaces) || !Array.isArray(memberships) || !Array.isArray(requests)) {
    return null;
  }
  return { workspaces, memberships, requests };
}

export function writeWorkspaceRegistry(registry: WorkspaceRegistry): boolean {
  return writeChunkedJsonCookie<WorkspaceRegistry>(COOKIE_NAME, registry, MAX_AGE);
}
