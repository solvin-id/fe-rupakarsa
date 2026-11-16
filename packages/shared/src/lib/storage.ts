export const STORAGE_KEYS = {
  workspace: "rupakarsa.workspace.v2",
  catalog: "rupakarsa.catalog",
} as const;

export function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJson<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be unavailable in private mode; the demo keeps working in memory.
  }
}

export function removeKey(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage failures.
  }
}

const LEGACY_KEYS = [
  "rupakarsa.admin",
  "rupakarsa.workspace",
  "rupakarsa.session.creator",
  "rupakarsa.session.cms",
];

export function cleanupLegacyStorage(): void {
  for (const key of LEGACY_KEYS) removeKey(key);
}
