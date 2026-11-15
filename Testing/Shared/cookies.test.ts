import { beforeEach, describe, expect, it } from "vitest";

import {
  grantCmsAccessOverride,
  hasCmsAccessOverride,
  readCmsAccessOverrides,
  revokeCmsAccessOverride,
  writeCmsAccessOverrides,
} from "@rupakarsa/shared/lib/cms-access-cookie";
import { SEED_TENANTS, SEED_USERS } from "@rupakarsa/shared/lib/seed";
import {
  clearSessionCookie,
  readSessionCookie,
  writeSessionCookie,
} from "@rupakarsa/shared/lib/session-cookie";

const user = SEED_USERS.find((item) => item.id === "usr_demo");
const tenant = SEED_TENANTS.find((item) => item.id === "ten_alfateve");
if (!user || !tenant) throw new Error("Demo user/tenant missing");

beforeEach(() => {
  clearSessionCookie();
  writeCmsAccessOverrides([]);
});

describe("session cookie", () => {
  it("round-trips a session across surfaces", () => {
    writeSessionCookie({ user, tenant, signedInAt: new Date().toISOString() });
    expect(readSessionCookie()?.user.email).toBe(user.email);
    expect(readSessionCookie()?.tenant.name).toBe("Alfateve");
  });

  it("clears the session", () => {
    writeSessionCookie({ user, tenant, signedInAt: new Date().toISOString() });
    clearSessionCookie();
    expect(readSessionCookie()).toBeNull();
  });
});

describe("CMS access override cookie", () => {
  it("grants and revokes access", () => {
    grantCmsAccessOverride("usr_demo");
    expect(hasCmsAccessOverride("usr_demo")).toBe(true);

    revokeCmsAccessOverride("usr_demo");
    expect(hasCmsAccessOverride("usr_demo")).toBe(false);
  });

  it("deduplicates ids", () => {
    grantCmsAccessOverride("usr_demo");
    grantCmsAccessOverride("usr_demo");
    expect(readCmsAccessOverrides()).toEqual(["usr_demo"]);
  });
});
