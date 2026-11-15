import { deleteCookie, readCookie, writeCookie } from "./cookies";
import type { Session } from "./types";

const COOKIE_NAME = "rupakarsa_session";
const MAX_AGE = 60 * 60 * 24 * 7;

export function readSessionCookie(): Session | null {
  const raw = readCookie(COOKIE_NAME);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as Session;
    return parsed?.user?.email ? parsed : null;
  } catch {
    return null;
  }
}

export function writeSessionCookie(session: Session): void {
  writeCookie(COOKIE_NAME, encodeURIComponent(JSON.stringify(session)), MAX_AGE);
}

export function clearSessionCookie(): void {
  deleteCookie(COOKIE_NAME);
}
