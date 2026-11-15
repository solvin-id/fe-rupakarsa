import { beforeEach, describe, expect, it } from "vitest";

import { hasCmsAccess } from "@rupakarsa/shared/lib/auth";
import { writeCmsAccessOverrides } from "@rupakarsa/shared/lib/cms-access-cookie";
import { SEED_USERS } from "@rupakarsa/shared/lib/seed";
import { clearSessionCookie } from "@rupakarsa/shared/lib/session-cookie";
import { useAdminStore } from "@rupakarsa/shared/stores/admin-store";
import { useProjectStore } from "@rupakarsa/shared/stores/project-store";
import { useSessionStore } from "@rupakarsa/shared/stores/session-store";

function resetStores(): void {
  window.localStorage.clear();
  clearSessionCookie();
  writeCmsAccessOverrides([]);
  useSessionStore.setState({ session: null, hydrated: false, errorMessage: null });
  useProjectStore.setState({ folders: [], generations: [], hydrated: false });
  useAdminStore.setState({
    tenants: [],
    users: [],
    providers: [],
    models: [],
    hydrated: false,
  });
}

beforeEach(resetStores);

describe("unified session", () => {
  it("signs in once and exposes the same session to both surfaces", () => {
    const ok = useSessionStore.getState().signIn("admin@rupakarsa.id", "rupakarsa");
    expect(ok).toBe(true);
    const session = useSessionStore.getState().session;
    expect(session?.user.role).toBe("SUPERADMIN");
    expect(hasCmsAccess(session?.user)).toBe(true);
  });

  it("signs in a default creator without CMS access", () => {
    const ok = useSessionStore.getState().signIn("demo@rupakarsa.id", "rupakarsa");
    expect(ok).toBe(true);
    expect(hasCmsAccess(useSessionStore.getState().session?.user)).toBe(false);
  });

  it("reflects a CMS grant without re-login", () => {
    useSessionStore.getState().signIn("demo@rupakarsa.id", "rupakarsa");
    useAdminStore.getState().hydrate();
    useAdminStore.getState().setCmsAccess("usr_demo", true);
    useSessionStore.getState().refreshAccess();
    expect(hasCmsAccess(useSessionStore.getState().session?.user)).toBe(true);
  });

  it("applies a grant made before login", () => {
    useAdminStore.getState().hydrate();
    useAdminStore.getState().setCmsAccess("usr_demo", true);
    useSessionStore.getState().signIn("demo@rupakarsa.id", "rupakarsa");
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

  it("clears the session on sign out", () => {
    useSessionStore.getState().signIn("demo@rupakarsa.id", "rupakarsa");
    useSessionStore.getState().signOut();
    expect(useSessionStore.getState().session).toBeNull();
  });

  it("consumes free plan quota before charging a token", () => {
    useSessionStore.getState().signIn("demo@rupakarsa.id", "rupakarsa");
    const first = useSessionStore.getState().consumePlanQuota();
    expect(first).toEqual({ tokens: 0, usesFreeQuota: true });
    expect(useSessionStore.getState().session?.tenant.freePlanRemaining).toBe(249);

    const current = useSessionStore.getState().session;
    if (!current) throw new Error("Session missing");
    useSessionStore.setState({
      session: { ...current, tenant: { ...current.tenant, freePlanRemaining: 0 } },
    });

    const second = useSessionStore.getState().consumePlanQuota();
    expect(second).toEqual({ tokens: 1, usesFreeQuota: false });
    expect(useSessionStore.getState().session?.tenant.tokenBalance).toBe(3999);
  });

  it("tops up the tenant pocket and reflects it in the session", () => {
    useSessionStore.getState().signIn("demo@rupakarsa.id", "rupakarsa");
    useAdminStore.getState().hydrate();
    useAdminStore.getState().topUpTenant("ten_alfateve", 1000, 50);
    expect(useSessionStore.getState().session?.tenant.tokenBalance).toBe(5000);
    expect(useSessionStore.getState().session?.tenant.freePlanRemaining).toBe(300);
  });
});

describe("project store", () => {
  it("creates, renames, and deletes a folder", () => {
    useProjectStore.getState().hydrate();
    const user = SEED_USERS.find((item) => item.id === "usr_demo");
    if (!user) throw new Error("Demo user missing");

    const folder = useProjectStore
      .getState()
      .createFolder({ name: "Test Folder", description: "Desc", user });
    expect(useProjectStore.getState().folders[0]?.name).toBe("Test Folder");

    useProjectStore.getState().renameFolder(folder.id, "Renamed", "New desc");
    expect(useProjectStore.getState().getFolder(folder.id)?.name).toBe("Renamed");

    useProjectStore.getState().deleteFolder(folder.id);
    expect(useProjectStore.getState().getFolder(folder.id)).toBeUndefined();
  });
});
