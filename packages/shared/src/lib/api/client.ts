export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8787";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export interface ApiRequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
}

interface ErrorPayload {
  error?: { code?: unknown; message?: unknown };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function errorFromBody(body: unknown): { code: string; message: string } {
  const fallback = { code: "INTERNAL", message: "Terjadi kesalahan pada server." };
  if (!isObject(body)) return fallback;
  const payload = body as ErrorPayload;
  const error = payload.error;
  if (!isObject(error)) return fallback;
  return {
    code: typeof error.code === "string" ? error.code : fallback.code,
    message: typeof error.message === "string" ? error.message : fallback.message,
  };
}

function readCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  for (const part of document.cookie.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === "rupakarsa_csrf") return rest.join("=");
  }
  return null;
}

function csrfHeaders(method: string): Record<string, string> {
  if (method === "GET") return {};
  const csrf = readCsrfToken();
  return csrf ? { "x-csrf-token": csrf } : {};
}

/**
 * A CSRF rejection is refused before any handler runs, so one retry is safe — but only when the
 * rejection actually handed out a token we did not send (the healing case). A mismatched token means
 * the browser already had one and the retry would be an identical request.
 */
function shouldRetryCsrf(status: number, code: string, attempt: number, sent: string): boolean {
  if (attempt !== 0 || status !== 403 || code !== "CSRF_INVALID") return false;
  const issued = readCsrfToken();
  return issued !== null && issued !== sent;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { method = "GET", body, signal } = options;

  // The rejection carries a fresh csrf cookie for browsers that had none (sessions older than the
  // cookie itself), so a single retry completes the action instead of asking for a page reload.
  for (let attempt = 0; ; attempt += 1) {
    const headers: Record<string, string> = {};
    if (body !== undefined) headers["Content-Type"] = "application/json";
    Object.assign(headers, csrfHeaders(method));
    const sentCsrf = headers["x-csrf-token"] ?? "";

    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}${path}`, {
        method,
        credentials: "include",
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal,
      });
    } catch {
      throw new ApiError(0, "NETWORK_ERROR", "Tidak dapat menghubungi server.");
    }

    if (response.status === 204) return undefined as T;

    const text = await response.text();
    const parsed: unknown = text.length > 0 ? safeJson(text) : undefined;

    if (response.ok) return parsed as T;

    const { code, message } = errorFromBody(parsed);
    if (shouldRetryCsrf(response.status, code, attempt, sentCsrf)) continue;
    throw new ApiError(response.status, code, message);
  }
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

export async function apiUpload<T>(path: string, file: File): Promise<T> {
  const form = new FormData();
  form.append("file", file);

  for (let attempt = 0; ; attempt += 1) {
    const headers = csrfHeaders("POST");
    const sentCsrf = headers["x-csrf-token"] ?? "";
    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}${path}`, {
        method: "POST",
        credentials: "include",
        headers,
        body: form,
      });
    } catch {
      throw new ApiError(0, "NETWORK_ERROR", "Tidak dapat menghubungi server.");
    }

    const text = await response.text();
    const parsed: unknown = text.length > 0 ? safeJson(text) : undefined;

    if (response.ok) return parsed as T;

    const { code, message } = errorFromBody(parsed);
    if (shouldRetryCsrf(response.status, code, attempt, sentCsrf)) continue;
    throw new ApiError(response.status, code, message);
  }
}
