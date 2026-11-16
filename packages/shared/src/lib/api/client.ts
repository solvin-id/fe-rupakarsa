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

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { method = "GET", body, signal } = options;
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (method !== "GET") {
    const csrf = readCsrfToken();
    if (csrf) headers["x-csrf-token"] = csrf;
  }

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

  if (!response.ok) {
    const { code, message } = errorFromBody(parsed);
    throw new ApiError(response.status, code, message);
  }

  return parsed as T;
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

  const headers: Record<string, string> = {};
  const csrf = readCsrfToken();
  if (csrf) headers["x-csrf-token"] = csrf;

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

  if (!response.ok) {
    const { code, message } = errorFromBody(parsed);
    throw new ApiError(response.status, code, message);
  }

  return parsed as T;
}
