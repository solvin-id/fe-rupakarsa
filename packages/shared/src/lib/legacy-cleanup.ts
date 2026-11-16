/**
 * One-time purge of the artefacts the pre-backend frontend left in the browser: the chunked
 * workspace/account cookies, the CMS grant cookie, the admin-contact cookie, and the localStorage
 * catalogue. The current app reads none of them, and the only cookie it keeps is the HttpOnly
 * `rupakarsa_session` token.
 */
const LEGACY_COOKIE_PREFIXES = [
  "rupakarsa_accounts",
  "rupakarsa_workspaces",
  "rupakarsa_cms_access",
  "rupakarsa_tenant_wallets",
  "rupakarsa_admin_contact",
];

const LEGACY_STORAGE_PREFIXES = [
  "rupakarsa.admin",
  "rupakarsa.workspace",
  "rupakarsa.catalog",
  "rupakarsa.session",
];

export function purgeLegacyClientState(): void {
  if (typeof document !== "undefined") {
    const names = document.cookie
      .split(";")
      .map((part) => part.trim().split("=")[0] ?? "")
      .filter((name) => name.length > 0)
      .filter((name) => LEGACY_COOKIE_PREFIXES.some((prefix) => name.startsWith(prefix)));

    for (const name of names) {
      document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
    }
  }

  if (typeof window !== "undefined") {
    try {
      const keys: string[] = [];
      for (let index = 0; index < window.localStorage.length; index += 1) {
        const key = window.localStorage.key(index);
        if (key && LEGACY_STORAGE_PREFIXES.some((prefix) => key.startsWith(prefix))) {
          keys.push(key);
        }
      }
      for (const key of keys) window.localStorage.removeItem(key);
    } catch {
      // Private mode or disabled storage: nothing to purge.
    }
  }
}
