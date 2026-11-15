import { describe, expect, it } from "vitest";

import { authorizeSignIn, hasCmsAccess } from "@rupakarsa/shared/lib/auth";
import { SEED_USERS } from "@rupakarsa/shared/lib/seed";

const admin = SEED_USERS.find((user) => user.id === "usr_admin");
const creator = SEED_USERS.find((user) => user.id === "usr_demo");

if (!admin || !creator) throw new Error("Seed users are missing");

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
