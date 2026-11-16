import { deleteCookie, readJsonCookie, writeJsonCookie } from "./cookies";
import type { SessionCookie } from "./types";

const COOKIE_NAME = "rupakarsa_session";
const MAX_AGE = 60 * 60 * 24 * 7;

export function readSessionCookie(): SessionCookie | null {
  const parsed = readJsonCookie<SessionCookie>(COOKIE_NAME);
  if (!parsed || typeof parsed !== "object") return null;
  if (typeof parsed.userId !== "string" || typeof parsed.workspaceId !== "string") return null;
  return {
    userId: parsed.userId,
    workspaceId: parsed.workspaceId,
    signedInAt: typeof parsed.signedInAt === "string" ? parsed.signedInAt : "",
  };
}

export function writeSessionCookie(cookie: SessionCookie): void {
  writeJsonCookie<SessionCookie>(COOKIE_NAME, cookie, MAX_AGE);
}

export function clearSessionCookie(): void {
  deleteCookie(COOKIE_NAME);
}
