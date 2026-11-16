import { beforeEach, describe, expect, it } from "vitest";

import { hasCmsAccess } from "@rupakarsa/shared/lib/auth";
import { deleteChunkedJsonCookie, deleteCookie } from "@rupakarsa/shared/lib/cookies";
import { SEED_ACCOUNTS } from "@rupakarsa/shared/lib/seed";
import { useAdminStore } from "@rupakarsa/shared/stores/admin-store";
import { useProjectStore } from "@rupakarsa/shared/stores/project-store";
import { useSessionStore } from "@rupakarsa/shared/stores/session-store";
import { useWorkspaceStore } from "@rupakarsa/shared/stores/workspace-store";

function resetStores(): void {
  window.localStorage.clear();
  deleteChunkedJsonCookie("rupakarsa_accounts");
  deleteChunkedJsonCookie("rupakarsa_workspaces");
  deleteCookie("rupakarsa_session");
  useSessionStore.setState({ session: null, hydrated: false, errorMessage: null });
  useProjectStore.setState({ folders: [], generations: [], hydrated: false });
  useAdminStore.setState({ accounts: [], providers: [], models: [], hydrated: false });
  useWorkspaceStore.setState({ workspaces: [], memberships: [], requests: [], hydrated: false });
}

beforeEach(resetStores);

describe("workspace session", () => {
  it("signs the creator into the default workspace with its pocket", () => {
    expect(useSessionStore.getState().signIn("demo@rupakarsa.id", "rupakarsa")).toBe(true);
    const session = useSessionStore.getState().session;
    expect(session?.workspace.id).toBe("ws_alfateve");
    expect(session?.workspace.tokenBalance).toBe(4000);
    expect(session?.workspace.freePlanRemaining).toBe(250);
  });

  it("switches workspaces and reads each balance", () => {
    useSessionStore.getState().signIn("demo@rupakarsa.id", "rupakarsa");
    expect(useSessionStore.getState().switchWorkspace("ws_demo")).toBe(true);
    expect(useSessionStore.getState().session?.workspace.tokenBalance).toBe(0);

    expect(useSessionStore.getState().switchWorkspace("ws_alfateve")).toBe(true);
    expect(useSessionStore.getState().session?.workspace.tokenBalance).toBe(4000);
  });

  it("refuses a workspace the account does not belong to", () => {
    useSessionStore.getState().signIn("demo@rupakarsa.id", "rupakarsa");
    expect(useSessionStore.getState().switchWorkspace("ws_lumiere")).toBe(false);
    expect(useSessionStore.getState().session?.workspace.id).toBe("ws_alfateve");
  });

  it("restores the active workspace from the cookie", () => {
    useSessionStore.getState().signIn("demo@rupakarsa.id", "rupakarsa");
    useSessionStore.getState().switchWorkspace("ws_demo");
    useSessionStore.setState({ session: null, hydrated: false });
    useSessionStore.getState().hydrate();
    expect(useSessionStore.getState().session?.workspace.id).toBe("ws_demo");
  });

  it("consumes plan quota per workspace", () => {
    useSessionStore.getState().signIn("demo@rupakarsa.id", "rupakarsa");
    expect(useSessionStore.getState().consumePlanQuota()).toEqual({
      tokens: 0,
      usesFreeQuota: true,
    });
    expect(useSessionStore.getState().session?.workspace.freePlanRemaining).toBe(249);
    expect(useSessionStore.getState().session?.workspace.tokenBalance).toBe(4000);

    useWorkspaceStore.getState().updateWorkspace("ws_demo", { tokenBalance: 5 });
    useSessionStore.getState().refreshAccess();
    expect(useSessionStore.getState().switchWorkspace("ws_demo")).toBe(true);

    expect(useSessionStore.getState().consumePlanQuota()).toEqual({
      tokens: 1,
      usesFreeQuota: false,
    });
    expect(useSessionStore.getState().session?.workspace.tokenBalance).toBe(4);
    expect(useSessionStore.getState().session?.workspace.freePlanRemaining).toBe(0);

    useSessionStore.getState().switchWorkspace("ws_alfateve");
    expect(useSessionStore.getState().session?.workspace.freePlanRemaining).toBe(249);
    expect(useSessionStore.getState().session?.workspace.tokenBalance).toBe(4000);
  });

  it("reflects a CMS top-up after refreshing access", () => {
    useSessionStore.getState().signIn("demo@rupakarsa.id", "rupakarsa");
    useAdminStore.getState().hydrate();

    const updated = useWorkspaceStore
      .getState()
      .updateWorkspace("ws_alfateve", { tokenBalance: 5000, freePlanRemaining: 300 });
    expect(updated.ok).toBe(true);
    useSessionStore.getState().refreshAccess();

    expect(useSessionStore.getState().session?.workspace.tokenBalance).toBe(5000);
    expect(useSessionStore.getState().session?.workspace.freePlanRemaining).toBe(300);
  });

  it("clears the session on sign out", () => {
    useSessionStore.getState().signIn("demo@rupakarsa.id", "rupakarsa");
    useSessionStore.getState().signOut();
    expect(useSessionStore.getState().session).toBeNull();
  });

  it("rejects a wrong password", () => {
    expect(useSessionStore.getState().signIn("demo@rupakarsa.id", "salah")).toBe(false);
    expect(useSessionStore.getState().errorMessage).toContain("password salah");
  });
});

describe("CMS access changes", () => {
  it("reflects a CMS grant without re-login", () => {
    useSessionStore.getState().signIn("demo@rupakarsa.id", "rupakarsa");
    useAdminStore.getState().hydrate();
    useAdminStore.getState().setCmsAccess("usr_demo", true);
    useSessionStore.getState().refreshAccess();
    expect(hasCmsAccess(useSessionStore.getState().session?.user)).toBe(true);
  });

  it("reflects a CMS revoke without re-login", () => {
    useSessionStore.getState().signIn("demo@rupakarsa.id", "rupakarsa");
    useAdminStore.getState().hydrate();
    useAdminStore.getState().setCmsAccess("usr_demo", true);
    useSessionStore.getState().refreshAccess();
    expect(hasCmsAccess(useSessionStore.getState().session?.user)).toBe(true);

    useAdminStore.getState().setCmsAccess("usr_demo", false);
    useSessionStore.getState().refreshAccess();
    expect(hasCmsAccess(useSessionStore.getState().session?.user)).toBe(false);
  });

  it("drops the session when the account is deactivated", () => {
    useSessionStore.getState().signIn("demo@rupakarsa.id", "rupakarsa");
    useAdminStore.getState().hydrate();
    useAdminStore.getState().toggleAccount("usr_demo");
    useSessionStore.getState().refreshAccess();
    expect(useSessionStore.getState().session).toBeNull();
  });
});

describe("account provisioning", () => {
  it("creates a personal workspace that the new account can sign in to", () => {
    useAdminStore.getState().hydrate();
    const created = useAdminStore.getState().createAccount({
      fullName: "Rani Putri",
      email: "rani@alfateve.co.id",
      role: "USER",
      cmsAccess: false,
    });
    expect(created.ok).toBe(true);
    if (!created.ok) throw new Error(created.message);

    const membership = useWorkspaceStore
      .getState()
      .getMembership(created.value.defaultWorkspaceId, created.value.id);
    expect(membership?.role).toBe("OWNER");

    expect(useSessionStore.getState().signIn("rani@alfateve.co.id", "rupakarsa")).toBe(true);
    const session = useSessionStore.getState().session;
    expect(session?.workspace.id).toBe(created.value.defaultWorkspaceId);
    expect(session?.workspace.tokenBalance).toBe(0);
  });

  it("rejects a duplicate email", () => {
    useAdminStore.getState().hydrate();
    const duplicate = useAdminStore.getState().createAccount({
      fullName: "Demo Duplikat",
      email: "demo@rupakarsa.id",
      role: "USER",
      cmsAccess: false,
    });
    expect(duplicate.ok).toBe(false);
    if (!duplicate.ok) expect(duplicate.message).toContain("sudah terdaftar");
  });
});

describe("project store", () => {
  it("creates, renames, and deletes a folder inside a workspace", () => {
    useProjectStore.getState().hydrate();
    const demoAccount = SEED_ACCOUNTS.find((account) => account.id === "usr_demo");
    if (!demoAccount) throw new Error("Demo account missing");

    const folder = useProjectStore.getState().createFolder({
      name: "Test Folder",
      description: "Desc",
      user: demoAccount,
      workspaceId: "ws_alfateve",
    });
    expect(folder.workspaceId).toBe("ws_alfateve");
    expect(useProjectStore.getState().folders[0]?.name).toBe("Test Folder");

    useProjectStore.getState().renameFolder(folder.id, "Renamed", "New desc");
    expect(useProjectStore.getState().getFolder(folder.id)?.name).toBe("Renamed");

    useProjectStore.getState().deleteFolder(folder.id);
    expect(useProjectStore.getState().getFolder(folder.id)).toBeUndefined();
  });

  it("drops every folder and generation of a deleted workspace", () => {
    useProjectStore.getState().hydrate();
    expect(useProjectStore.getState().folders.length).toBeGreaterThan(0);

    useProjectStore.getState().deleteWorkspaceData("ws_alfateve");
    expect(useProjectStore.getState().folders).toHaveLength(0);
    expect(useProjectStore.getState().generations).toHaveLength(0);
  });
});
