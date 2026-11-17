import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError, apiRequest } from "@rupakarsa/shared/lib/api/client";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  document.cookie = "rupakarsa_csrf=; Max-Age=0; Path=/";
});

describe("apiRequest", () => {
  it("sends cookies and the JSON content type", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await apiRequest<{ ok: boolean }>("/api/creator/auth/login", {
      method: "POST",
      body: { email: "demo@rupakarsa.id" },
    });

    expect(result).toEqual({ ok: true });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain("/api/creator/auth/login");
    expect(init.credentials).toBe("include");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({ "Content-Type": "application/json" });
    expect(init.body).toBe(JSON.stringify({ email: "demo@rupakarsa.id" }));
  });

  it("does not set a content type for GET requests", async () => {
    const fetchMock = vi.fn(async () => jsonResponse([]));
    vi.stubGlobal("fetch", fetchMock);

    await apiRequest("/api/creator/folders");

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(init.headers).toEqual({});
    expect(init.body).toBeUndefined();
  });

  it("returns undefined for 204 responses", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 204 })));

    await expect(apiRequest("/api/creator/auth/logout", { method: "POST" })).resolves.toBeUndefined();
  });

  it("throws an ApiError with the server message and code", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({ error: { code: "CONFLICT", message: "Saldo token tidak cukup." } }, 409),
      ),
    );

    await expect(apiRequest("/api/creator/generations")).rejects.toMatchObject({
      name: "ApiError",
      status: 409,
      code: "CONFLICT",
      message: "Saldo token tidak cukup.",
    });
  });

  it("retries once with the csrf cookie a rejection issued", async () => {
    const seen: Array<string | undefined> = [];
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      seen.push((init.headers as Record<string, string> | undefined)?.["x-csrf-token"]);
      if (seen.length === 1) {
        // The server refused before running anything and handed out a token for the retry.
        document.cookie = "rupakarsa_csrf=fresh-token";
        return jsonResponse(
          { error: { code: "CSRF_INVALID", message: "Token CSRF tidak valid. Muat ulang halaman." } },
          403,
        );
      }
      return jsonResponse({ id: "folder-1" });
    });
    vi.stubGlobal("fetch", fetchMock);

    const created = await apiRequest<{ id: string }>("/api/creator/folders", {
      method: "POST",
      body: { name: "Folder" },
    });

    expect(created).toEqual({ id: "folder-1" });
    expect(seen).toEqual([undefined, "fresh-token"]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry a csrf rejection that carried a token", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(
        { error: { code: "CSRF_INVALID", message: "Token CSRF tidak valid. Muat ulang halaman." } },
        403,
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    document.cookie = "rupakarsa_csrf=stale";

    await expect(
      apiRequest("/api/creator/folders", { method: "POST", body: { name: "Folder" } }),
    ).rejects.toMatchObject({ status: 403, code: "CSRF_INVALID" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not retry other forbidden responses", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ error: { code: "FORBIDDEN", message: "Akun ini tidak memiliki akses CMS." } }, 403),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiRequest("/api/cms/accounts", { method: "POST", body: {} })).rejects.toMatchObject({
      status: 403,
      code: "FORBIDDEN",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("maps a network failure to status 0", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      }),
    );

    const error = await apiRequest("/api/creator/session").catch((reason: unknown) => reason);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 0, code: "NETWORK_ERROR" });
    expect((error as ApiError).message).toBe("Tidak dapat menghubungi server.");
  });
});
