import { readAccountsCookie, writeAccountsCookie } from "./accounts-cookie";
import { SEED_ACCOUNTS, SEED_JOIN_REQUESTS, SEED_MEMBERSHIPS, SEED_WORKSPACES } from "./seed";
import { readWorkspaceRegistry, writeWorkspaceRegistry } from "./workspaces-cookie";

export function ensurePlatformSeeded(): void {
  if (!readAccountsCookie()) writeAccountsCookie(SEED_ACCOUNTS);
  if (!readWorkspaceRegistry()) {
    writeWorkspaceRegistry({
      workspaces: SEED_WORKSPACES,
      memberships: SEED_MEMBERSHIPS,
      requests: SEED_JOIN_REQUESTS,
    });
  }
}
