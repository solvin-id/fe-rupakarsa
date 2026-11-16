import { beforeEach, describe, expect, it } from "vitest";

import { deleteChunkedJsonCookie, deleteCookie } from "@rupakarsa/shared/lib/cookies";
import { SEED_ACCOUNTS } from "@rupakarsa/shared/lib/seed";
import type { Result, User } from "@rupakarsa/shared/lib/types";
import {
  readWorkspaceRegistry,
  writeWorkspaceRegistry,
} from "@rupakarsa/shared/lib/workspaces-cookie";
import { useAdminStore } from "@rupakarsa/shared/stores/admin-store";
import { useProjectStore } from "@rupakarsa/shared/stores/project-store";
import { useSessionStore } from "@rupakarsa/shared/stores/session-store";
import { useWorkspaceStore } from "@rupakarsa/shared/stores/workspace-store";

const COOKIE_NAMES = ["rupakarsa_session"];

const demoAccount = SEED_ACCOUNTS.find((account) => account.id === "usr_demo");
if (!demoAccount) throw new Error("Demo account missing");

function resetStores(): void {
  window.localStorage.clear();
  deleteChunkedJsonCookie("rupakarsa_accounts");
  deleteChunkedJsonCookie("rupakarsa_workspaces");
  for (const name of COOKIE_NAMES) deleteCookie(name);
  useSessionStore.setState({ session: null, hydrated: false, errorMessage: null });
  useProjectStore.setState({ folders: [], generations: [], hydrated: false });
  useAdminStore.setState({ accounts: [], providers: [], models: [], hydrated: false });
  useWorkspaceStore.setState({ workspaces: [], memberships: [], requests: [], hydrated: false });
}

function unwrap<T>(result: Result<T>): T {
  if (!result.ok) throw new Error(result.message);
  return result.value;
}

function createAccount(label: string): User {
  useAdminStore.getState().hydrate();
  return unwrap(
    useAdminStore.getState().createAccount({
      fullName: label,
      email: `${label.toLowerCase().replace(/[^a-z0-9]+/g, ".")}@test.id`,
      role: "USER",
      cmsAccess: false,
    }),
  );
}

function dropMembership(workspaceId: string, userId: string): void {
  const registry = readWorkspaceRegistry();
  if (!registry) throw new Error("Workspace registry missing");
  writeWorkspaceRegistry({
    ...registry,
    memberships: registry.memberships.filter(
      (membership) =>
        !(membership.workspaceId === workspaceId && membership.userId === userId),
    ),
  });
  useWorkspaceStore.getState().refresh();
}

beforeEach(resetStores);

describe("workspace seed", () => {
  it("hydrates six workspaces, eight memberships, and one pending request", () => {
    useWorkspaceStore.getState().hydrate();
    const store = useWorkspaceStore.getState();

    expect(store.workspaces).toHaveLength(6);
    expect(store.memberships).toHaveLength(8);
    expect(store.requests).toHaveLength(1);
    expect(store.requests[0]?.status).toBe("PENDING");
    expect(store.getMembership("ws_alfateve", "usr_demo")?.role).toBe("OWNER");
    expect(store.getMembership("ws_alfateve", "usr_nadia")?.role).toBe("ADMIN");
    expect(store.getMembership("ws_alfateve", "usr_bagas")?.role).toBe("MEMBER");
  });
});

describe("createWorkspace", () => {
  it("creates the workspace with an owner membership", () => {
    const workspace = unwrap(
      useWorkspaceStore.getState().createWorkspace({ name: "Test Lab", ownerId: "usr_demo" }),
    );
    expect(workspace.slug).toBe("test-lab");
    const membership = useWorkspaceStore.getState().getMembership(workspace.id, "usr_demo");
    expect(membership?.role).toBe("OWNER");
  });

  it("suffixes an auto slug and rejects an explicit duplicate", () => {
    const first = unwrap(
      useWorkspaceStore.getState().createWorkspace({ name: "Test Lab", ownerId: "usr_demo" }),
    );
    const second = unwrap(
      useWorkspaceStore.getState().createWorkspace({ name: "Test Lab", ownerId: "usr_demo" }),
    );
    expect(first.slug).toBe("test-lab");
    expect(second.slug).toBe("test-lab-2");

    const duplicate = useWorkspaceStore
      .getState()
      .createWorkspace({ name: "Another Lab", slug: "test-lab", ownerId: "usr_demo" });
    expect(duplicate.ok).toBe(false);
    if (!duplicate.ok) expect(duplicate.message).toContain("sudah dipakai");
  });

  it("rejects an unknown owner", () => {
    const result = useWorkspaceStore
      .getState()
      .createWorkspace({ name: "Ghost Lab", ownerId: "usr_ghost" });
    expect(result.ok).toBe(false);
  });
});

describe("requestJoin", () => {
  it("rejects an unknown slug", () => {
    const result = useWorkspaceStore
      .getState()
      .requestJoin({ slug: "tidak-ada", userId: "usr_bagas", message: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain("tidak ditemukan");
  });

  it("rejects an inactive workspace", () => {
    useWorkspaceStore.getState().updateWorkspace("ws_nadia", { isActive: false });
    const result = useWorkspaceStore
      .getState()
      .requestJoin({ slug: "nadia-studio", userId: "usr_bagas", message: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain("tidak aktif");
  });

  it("rejects an existing member", () => {
    const result = useWorkspaceStore
      .getState()
      .requestJoin({ slug: "alfateve", userId: "usr_bagas", message: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain("sudah menjadi anggota");
  });

  it("rejects a duplicate pending request", () => {
    const result = useWorkspaceStore
      .getState()
      .requestJoin({ slug: "lumiere-lab", userId: "usr_bagas", message: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain("menunggu persetujuan");
  });

  it("creates a pending request", () => {
    const request = unwrap(
      useWorkspaceStore
        .getState()
        .requestJoin({ slug: "lumiere-lab", userId: "usr_nadia", message: "Butuh akses." }),
    );
    expect(request.status).toBe("PENDING");
    expect(request.workspaceId).toBe("ws_lumiere");
    expect(useWorkspaceStore.getState().getUserRequests("usr_nadia")).toHaveLength(1);
  });
});

describe("approveRequest", () => {
  it("blocks a member and lets an admin approve once", () => {
    const fresh = createAccount("Sari Wulandari");
    const request = unwrap(
      useWorkspaceStore
        .getState()
        .requestJoin({ slug: "alfateve", userId: fresh.id, message: "Join tim." }),
    );

    const blocked = useWorkspaceStore.getState().approveRequest(request.id, "usr_bagas");
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.message).toContain("owner atau admin");

    const approved = useWorkspaceStore.getState().approveRequest(request.id, "usr_nadia");
    expect(approved.ok).toBe(true);

    const membership = useWorkspaceStore.getState().getMembership("ws_alfateve", fresh.id);
    expect(membership?.role).toBe("MEMBER");
    expect(
      useWorkspaceStore.getState().requests.find((item) => item.id === request.id)?.status,
    ).toBe("APPROVED");

    const membershipCount = useWorkspaceStore.getState().memberships.length;
    const again = useWorkspaceStore.getState().approveRequest(request.id, "usr_nadia");
    expect(again.ok).toBe(false);
    expect(useWorkspaceStore.getState().memberships).toHaveLength(membershipCount);
  });

  it("lets the owner approve a request", () => {
    const fresh = createAccount("Tomi Saputra");
    const request = unwrap(
      useWorkspaceStore
        .getState()
        .requestJoin({ slug: "alfateve", userId: fresh.id, message: "" }),
    );
    expect(useWorkspaceStore.getState().approveRequest(request.id, "usr_demo").ok).toBe(true);
    expect(useWorkspaceStore.getState().getMembership("ws_alfateve", fresh.id)?.role).toBe(
      "MEMBER",
    );
  });
});

describe("rejectRequest", () => {
  it("marks the request rejected", () => {
    const fresh = createAccount("Umi Kalsum");
    const request = unwrap(
      useWorkspaceStore
        .getState()
        .requestJoin({ slug: "alfateve", userId: fresh.id, message: "" }),
    );
    expect(useWorkspaceStore.getState().rejectRequest(request.id, "usr_nadia").ok).toBe(true);

    const resolved = useWorkspaceStore
      .getState()
      .requests.find((item) => item.id === request.id);
    expect(resolved?.status).toBe("REJECTED");
    expect(resolved?.resolvedByUserId).toBe("usr_nadia");
    expect(useWorkspaceStore.getState().getMembership("ws_alfateve", fresh.id)).toBeUndefined();
  });
});

describe("setMemberRole", () => {
  it("only the owner can change roles", () => {
    const blocked = useWorkspaceStore
      .getState()
      .setMemberRole("ws_alfateve", "usr_nadia", "usr_bagas", "ADMIN");
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.message).toContain("Hanya owner");

    expect(
      useWorkspaceStore.getState().setMemberRole("ws_alfateve", "usr_demo", "usr_bagas", "ADMIN")
        .ok,
    ).toBe(true);
    expect(useWorkspaceStore.getState().getMembership("ws_alfateve", "usr_bagas")?.role).toBe(
      "ADMIN",
    );

    const ownerBlocked = useWorkspaceStore
      .getState()
      .setMemberRole("ws_alfateve", "usr_demo", "usr_demo", "MEMBER");
    expect(ownerBlocked.ok).toBe(false);
  });
});

describe("removeMember", () => {
  it("stops an admin from removing another admin", () => {
    useWorkspaceStore.getState().setMemberRole("ws_alfateve", "usr_demo", "usr_bagas", "ADMIN");
    const blocked = useWorkspaceStore.getState().removeMember("ws_alfateve", "usr_nadia", "usr_bagas");
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.message).toContain("Admin tidak dapat mengeluarkan admin lain");
  });

  it("lets the owner remove a member", () => {
    expect(useWorkspaceStore.getState().removeMember("ws_alfateve", "usr_demo", "usr_bagas").ok).toBe(
      true,
    );
    expect(
      useWorkspaceStore.getState().getMembership("ws_alfateve", "usr_bagas"),
    ).toBeUndefined();
  });

  it("blocks removing the target's only workspace", () => {
    const fresh = createAccount("Vina Lestari");
    const shared = unwrap(
      useWorkspaceStore.getState().createWorkspace({ name: "Shared Lab", ownerId: "usr_demo" }),
    );
    unwrap(
      useWorkspaceStore
        .getState()
        .requestJoin({ slug: shared.slug, userId: fresh.id, message: "" }),
    );
    const request = useWorkspaceStore
      .getState()
      .getUserRequests(fresh.id)
      .find((item) => item.workspaceId === shared.id);
    if (!request) throw new Error("Join request missing");
    useWorkspaceStore.getState().approveRequest(request.id, "usr_demo");

    dropMembership(fresh.defaultWorkspaceId, fresh.id);

    const blocked = useWorkspaceStore
      .getState()
      .removeMember(shared.id, "usr_demo", fresh.id);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.message).toContain("hanya tergabung");
  });
});

describe("leaveWorkspace", () => {
  it("stops the owner from leaving", () => {
    const blocked = useWorkspaceStore.getState().leaveWorkspace("ws_alfateve", "usr_demo");
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.message).toContain("Owner tidak dapat keluar");
  });

  it("lets a member leave while keeping another workspace", () => {
    expect(useWorkspaceStore.getState().leaveWorkspace("ws_alfateve", "usr_bagas").ok).toBe(true);
    expect(
      useWorkspaceStore.getState().getMembership("ws_alfateve", "usr_bagas"),
    ).toBeUndefined();
    expect(useWorkspaceStore.getState().getMembership("ws_bagas", "usr_bagas")?.role).toBe("OWNER");
  });

  it("blocks leaving the last workspace", () => {
    const fresh = createAccount("Wawan Setiawan");
    const shared = unwrap(
      useWorkspaceStore.getState().createWorkspace({ name: "Solo Lab", ownerId: "usr_demo" }),
    );
    unwrap(
      useWorkspaceStore
        .getState()
        .requestJoin({ slug: shared.slug, userId: fresh.id, message: "" }),
    );
    const request = useWorkspaceStore
      .getState()
      .getUserRequests(fresh.id)
      .find((item) => item.workspaceId === shared.id);
    if (!request) throw new Error("Join request missing");
    useWorkspaceStore.getState().approveRequest(request.id, "usr_demo");

    dropMembership(fresh.defaultWorkspaceId, fresh.id);

    const blocked = useWorkspaceStore.getState().leaveWorkspace(shared.id, fresh.id);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.message).toContain("minimal satu workspace");
  });
});

describe("deleteWorkspace", () => {
  it("only the owner can delete", () => {
    const blocked = useWorkspaceStore.getState().deleteWorkspace("ws_alfateve", "usr_nadia");
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.message).toContain("Hanya owner");
    expect(useWorkspaceStore.getState().getWorkspace("ws_alfateve")).toBeDefined();
  });

  it("blocks a workspace whose member has nowhere else to go", () => {
    const fresh = createAccount("Yudi Pratama");
    const blocked = useWorkspaceStore
      .getState()
      .deleteWorkspace(fresh.defaultWorkspaceId, fresh.id);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.message).toContain(fresh.fullName);
    expect(useWorkspaceStore.getState().getWorkspace(fresh.defaultWorkspaceId)).toBeDefined();
  });

  it("removes the workspace, its memberships, requests, and project data", () => {
    const workspace = unwrap(
      useWorkspaceStore.getState().createWorkspace({ name: "Hapus Saya", ownerId: "usr_demo" }),
    );
    useProjectStore.getState().hydrate();
    const folder = useProjectStore.getState().createFolder({
      name: "Folder sementara",
      description: "",
      user: demoAccount,
      workspaceId: workspace.id,
    });

    unwrap(
      useWorkspaceStore
        .getState()
        .requestJoin({ slug: workspace.slug, userId: "usr_nadia", message: "" }),
    );

    expect(useWorkspaceStore.getState().deleteWorkspace(workspace.id, "usr_demo").ok).toBe(true);

    expect(useWorkspaceStore.getState().getWorkspace(workspace.id)).toBeUndefined();
    expect(
      useWorkspaceStore
        .getState()
        .memberships.some((membership) => membership.workspaceId === workspace.id),
    ).toBe(false);
    expect(
      useWorkspaceStore
        .getState()
        .requests.some((request) => request.workspaceId === workspace.id),
    ).toBe(false);
    expect(useProjectStore.getState().getFolder(folder.id)).toBeUndefined();
  });
});
