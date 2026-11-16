import { beforeEach, describe, expect, it } from "vitest";

import { readAccountsCookie, writeAccountsCookie } from "@rupakarsa/shared/lib/accounts-cookie";
import { deleteChunkedJsonCookie, deleteCookie, writeCookie } from "@rupakarsa/shared/lib/cookies";
import {
  SEED_ACCOUNTS,
  SEED_JOIN_REQUESTS,
  SEED_MEMBERSHIPS,
  SEED_WORKSPACES,
} from "@rupakarsa/shared/lib/seed";
import {
  clearSessionCookie,
  readSessionCookie,
  writeSessionCookie,
} from "@rupakarsa/shared/lib/session-cookie";
import { readWorkspaceRegistry, writeWorkspaceRegistry } from "@rupakarsa/shared/lib/workspaces-cookie";

beforeEach(() => {
  deleteChunkedJsonCookie("rupakarsa_accounts");
  deleteChunkedJsonCookie("rupakarsa_workspaces");
  deleteCookie("rupakarsa_session");
});

describe("accounts cookie", () => {
  it("round-trips accounts across surfaces", () => {
    expect(writeAccountsCookie(SEED_ACCOUNTS)).toBe(true);
    const accounts = readAccountsCookie();
    expect(accounts?.map((account) => account.id)).toEqual(
      SEED_ACCOUNTS.map((account) => account.id),
    );
    expect(accounts?.find((account) => account.id === "usr_demo")?.defaultWorkspaceId).toBe(
      "ws_alfateve",
    );
  });

  it("spreads a growing account list over several cookies", () => {
    const accounts = Array.from({ length: 60 }, (_, index) => ({
      ...SEED_ACCOUNTS[0],
      id: `usr_bulk_${index}`,
      email: `bulk-${index}@rupakarsa.id`,
      fullName: `Bulk Account ${index}`,
    }));
    expect(writeAccountsCookie(accounts)).toBe(true);
    expect(readAccountsCookie()).toHaveLength(60);
  });

  it("refuses a payload above the demo cookie budget", () => {
    const oversized = Array.from({ length: 400 }, (_, index) => ({
      ...SEED_ACCOUNTS[0],
      id: `usr_huge_${index}`,
      email: `huge-${index}@rupakarsa.id`,
      fullName: "x".repeat(200),
    }));
    expect(writeAccountsCookie(oversized)).toBe(false);
  });

  it("returns null when a chunk is corrupt or missing", () => {
    expect(readAccountsCookie()).toBeNull();
    writeCookie("rupakarsa_accounts.count", "1");
    writeCookie("rupakarsa_accounts.0", "not-json");
    expect(readAccountsCookie()).toBeNull();

    writeCookie("rupakarsa_accounts.count", "2");
    writeCookie("rupakarsa_accounts.0", encodeURIComponent("["));
    expect(readAccountsCookie()).toBeNull();
  });
});

describe("workspace registry cookie", () => {
  it("round-trips workspaces, memberships, and requests", () => {
    expect(
      writeWorkspaceRegistry({
        workspaces: SEED_WORKSPACES,
        memberships: SEED_MEMBERSHIPS,
        requests: SEED_JOIN_REQUESTS,
      }),
    ).toBe(true);

    const registry = readWorkspaceRegistry();
    expect(registry?.workspaces).toHaveLength(6);
    expect(registry?.memberships).toHaveLength(8);
    expect(registry?.requests).toHaveLength(1);
  });

  it("returns null when the payload is missing or incomplete", () => {
    expect(readWorkspaceRegistry()).toBeNull();
    writeCookie("rupakarsa_workspaces.count", "1");
    writeCookie("rupakarsa_workspaces.0", encodeURIComponent(JSON.stringify({ workspaces: [] })));
    expect(readWorkspaceRegistry()).toBeNull();
  });
});

describe("session cookie", () => {
  it("round-trips the active workspace pointer", () => {
    writeSessionCookie({
      userId: "usr_demo",
      workspaceId: "ws_demo",
      signedInAt: "2026-11-16T09:00:00.000Z",
    });
    expect(readSessionCookie()).toEqual({
      userId: "usr_demo",
      workspaceId: "ws_demo",
      signedInAt: "2026-11-16T09:00:00.000Z",
    });
  });

  it("clears the session", () => {
    writeSessionCookie({
      userId: "usr_demo",
      workspaceId: "ws_demo",
      signedInAt: "2026-11-16T09:00:00.000Z",
    });
    clearSessionCookie();
    expect(readSessionCookie()).toBeNull();
  });

  it("ignores the legacy embedded-session payload", () => {
    writeCookie(
      "rupakarsa_session",
      encodeURIComponent(JSON.stringify({ user: { email: "demo@rupakarsa.id" } })),
    );
    expect(readSessionCookie()).toBeNull();
  });
});
