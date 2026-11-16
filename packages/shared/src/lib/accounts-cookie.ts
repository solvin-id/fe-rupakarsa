import { readChunkedJsonCookie, writeChunkedJsonCookie } from "./cookies";
import type { User } from "./types";

const COOKIE_NAME = "rupakarsa_accounts";
const MAX_AGE = 60 * 60 * 24 * 365;

export function readAccountsCookie(): User[] | null {
  const parsed = readChunkedJsonCookie<User[]>(COOKIE_NAME);
  if (!Array.isArray(parsed)) return null;
  const accounts = parsed.filter(
    (account) => typeof account?.id === "string" && typeof account?.email === "string",
  );
  return accounts.length > 0 ? accounts : null;
}

export function writeAccountsCookie(accounts: User[]): boolean {
  return writeChunkedJsonCookie<User[]>(COOKIE_NAME, accounts, MAX_AGE);
}
