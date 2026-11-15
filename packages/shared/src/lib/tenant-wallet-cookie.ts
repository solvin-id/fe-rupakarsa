import { deleteCookie, readCookie, writeCookie } from "./cookies";

const COOKIE_NAME = "rupakarsa_tenant_wallets";
const MAX_AGE = 60 * 60 * 24 * 30;

export interface TenantWallet {
  tokenBalance: number;
  freePlanRemaining: number;
  isActive: boolean;
}

export type TenantWalletMap = Record<string, TenantWallet>;

export function readTenantWallets(): TenantWalletMap {
  const raw = readCookie(COOKIE_NAME);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as TenantWalletMap;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed;
  } catch {
    return {};
  }
}

export function writeTenantWallets(wallets: TenantWalletMap): void {
  if (Object.keys(wallets).length === 0) {
    deleteCookie(COOKIE_NAME);
    return;
  }
  writeCookie(COOKIE_NAME, encodeURIComponent(JSON.stringify(wallets)), MAX_AGE);
}

export function upsertTenantWallet(tenantId: string, wallet: TenantWallet): void {
  const wallets = readTenantWallets();
  wallets[tenantId] = wallet;
  writeTenantWallets(wallets);
}

export function readTenantWallet(tenantId: string): TenantWallet | null {
  return readTenantWallets()[tenantId] ?? null;
}
