import { deleteCookie, readCookie, writeCookie } from "./cookies";

const COOKIE_NAME = "rupakarsa_cms_access";
const MAX_AGE = 60 * 60 * 24 * 30;

export function readCmsAccessOverrides(): string[] {
  const raw = readCookie(COOKIE_NAME);
  if (!raw) return [];
  try {
    return decodeURIComponent(raw)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

export function writeCmsAccessOverrides(ids: string[]): void {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) {
    deleteCookie(COOKIE_NAME);
    return;
  }
  writeCookie(COOKIE_NAME, encodeURIComponent(unique.join(",")), MAX_AGE);
}

export function grantCmsAccessOverride(id: string): void {
  writeCmsAccessOverrides([...readCmsAccessOverrides(), id]);
}

export function revokeCmsAccessOverride(id: string): void {
  writeCmsAccessOverrides(readCmsAccessOverrides().filter((item) => item !== id));
}

export function hasCmsAccessOverride(id: string): boolean {
  return readCmsAccessOverrides().includes(id);
}
