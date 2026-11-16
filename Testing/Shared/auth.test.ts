import { describe, expect, it } from "vitest";

import {
  authorizeSignIn,
  canManageWorkspace,
  hasCmsAccess,
  isWorkspaceOwner,
} from "@rupakarsa/shared/lib/auth";
import { SEED_ACCOUNTS } from "@rupakarsa/shared/lib/seed";

const admin = SEED_ACCOUNTS.find((account) => account.id === "usr_admin");
const creator = SEED_ACCOUNTS.find((account) => account.id === "usr_demo");

if (!admin || !creator) throw new Error("Seed accounts are missing");

describe("CMS access", () => {
  it("gives Superadmin implicit CMS access", () => {
    expect(hasCmsAccess(admin)).toBe(true);
  });

  it("keeps a default USER out of the CMS", () => {
    expect(hasCmsAccess(creator)).toBe(false);
  });

  it("grants a USER CMS access without changing the role", () => {
    const granted = { ...creator, cmsAccess: true };
    expect(granted.role).toBe("USER");
    expect(hasCmsAccess(granted)).toBe(true);
  });

  it("rejects an inactive user even with cmsAccess", () => {
    expect(hasCmsAccess({ ...creator, cmsAccess: true, isActive: false })).toBe(false);
  });
});

describe("authorizeSignIn", () => {
  it("allows an active creator", () => {
    expect(authorizeSignIn(creator)).toEqual({ ok: true });
  });

  it("allows an active Superadmin", () => {
    expect(authorizeSignIn(admin)).toEqual({ ok: true });
  });

  it("rejects an inactive account", () => {
    const result = authorizeSignIn({ ...admin, isActive: false });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain("tidak aktif");
  });

  it("rejects a missing account", () => {
    const result = authorizeSignIn(null);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain("tidak ditemukan");
  });
});

describe("workspace roles", () => {
  it("reserves destructive controls for the owner", () => {
    expect(isWorkspaceOwner("OWNER")).toBe(true);
    expect(isWorkspaceOwner("ADMIN")).toBe(false);
    expect(isWorkspaceOwner("MEMBER")).toBe(false);
    expect(isWorkspaceOwner(null)).toBe(false);
  });

  it("lets owner and admin manage members", () => {
    expect(canManageWorkspace("OWNER")).toBe(true);
    expect(canManageWorkspace("ADMIN")).toBe(true);
    expect(canManageWorkspace("MEMBER")).toBe(false);
    expect(canManageWorkspace(undefined)).toBe(false);
  });
});
