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
