const DEFAULT_MAX_AGE = 60 * 60 * 24 * 7;

function cookieDomain(): string | undefined {
  const domain = process.env.NEXT_PUBLIC_SESSION_COOKIE_DOMAIN;
  return domain && domain.trim().length > 0 ? domain.trim() : undefined;
}

export function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const prefix = `${name}=`;
  for (const part of document.cookie.split(";")) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) return trimmed.slice(prefix.length);
  }
  return null;
}

export function writeCookie(name: string, value: string, maxAgeSeconds = DEFAULT_MAX_AGE): void {
  if (typeof document === "undefined") return;
  const parts = [`${name}=${value}`, "Path=/", `Max-Age=${maxAgeSeconds}`, "SameSite=Lax"];
  const domain = cookieDomain();
  if (domain) parts.push(`Domain=${domain}`);
  if (typeof window !== "undefined" && window.location.protocol === "https:") parts.push("Secure");
  document.cookie = parts.join("; ");
}

export function deleteCookie(name: string): void {
  if (typeof document === "undefined") return;
  const parts = [`${name}=`, "Path=/", "Max-Age=0", "SameSite=Lax"];
  const domain = cookieDomain();
  if (domain) parts.push(`Domain=${domain}`);
  if (typeof window !== "undefined" && window.location.protocol === "https:") parts.push("Secure");
  document.cookie = parts.join("; ");
}

const MAX_ENCODED_LENGTH = 3600;
const MAX_CHUNK_COUNT = 24;

function chunkName(name: string, index: number): string {
  return `${name}.${index}`;
}

function chunkCountName(name: string): string {
  return `${name}.count`;
}

export function readJsonCookie<T>(name: string): T | null {
  const raw = readCookie(name);
  if (!raw) return null;
  try {
    return JSON.parse(decodeURIComponent(raw)) as T;
  } catch {
    return null;
  }
}

export function writeJsonCookie<T>(name: string, value: T, maxAgeSeconds?: number): boolean {
  let encoded: string;
  try {
    encoded = encodeURIComponent(JSON.stringify(value));
  } catch {
    return false;
  }
  if (encoded.length > MAX_ENCODED_LENGTH) return false;
  writeCookie(name, encoded, maxAgeSeconds);
  return true;
}

export function deleteChunkedJsonCookie(name: string): void {
  deleteCookie(chunkCountName(name));
  for (let index = 0; index < MAX_CHUNK_COUNT; index += 1) {
    deleteCookie(chunkName(name, index));
  }
}

/**
 * Reads a JSON payload spread over numbered cookies. The demo stores the workspace registry
 * and the account list across several cookies because one browser cookie caps out near 4 KB.
 */
export function readChunkedJsonCookie<T>(name: string): T | null {
  const count = Number(readCookie(chunkCountName(name)));
  if (!Number.isInteger(count) || count < 1 || count > MAX_CHUNK_COUNT) return null;

  let encoded = "";
  for (let index = 0; index < count; index += 1) {
    const part = readCookie(chunkName(name, index));
    if (part === null) return null;
    encoded += part;
  }

  try {
    return JSON.parse(decodeURIComponent(encoded)) as T;
  } catch {
    return null;
  }
}

export function writeChunkedJsonCookie<T>(name: string, value: T, maxAgeSeconds?: number): boolean {
  let encoded: string;
  try {
    encoded = encodeURIComponent(JSON.stringify(value));
  } catch {
    return false;
  }

  const chunks: string[] = [];
  for (let offset = 0; offset < encoded.length; offset += MAX_ENCODED_LENGTH) {
    chunks.push(encoded.slice(offset, offset + MAX_ENCODED_LENGTH));
  }
  if (chunks.length > MAX_CHUNK_COUNT) return false;

  deleteChunkedJsonCookie(name);
  writeCookie(chunkCountName(name), String(chunks.length), maxAgeSeconds);
  chunks.forEach((chunk, index) => writeCookie(chunkName(name, index), chunk, maxAgeSeconds));
  return true;
}

export function removeLegacyCookies(): void {
  deleteCookie("rupakarsa_cms_access");
  deleteCookie("rupakarsa_tenant_wallets");
}
