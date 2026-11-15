import { deleteCookie, readCookie, writeCookie } from "./cookies";

const COOKIE_NAME = "rupakarsa_admin_contact";
const MAX_AGE = 60 * 60 * 24 * 365;

export interface AdminContact {
  name: string;
  whatsapp: string;
  email: string;
}

export const DEFAULT_ADMIN_CONTACT: AdminContact = {
  name: "Tim Rupakarsa",
  whatsapp: "",
  email: "halo@rupakarsa.id",
};

export function readAdminContact(): AdminContact {
  const raw = readCookie(COOKIE_NAME);
  if (!raw) return DEFAULT_ADMIN_CONTACT;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as Partial<AdminContact>;
    return {
      name: parsed.name?.trim() || DEFAULT_ADMIN_CONTACT.name,
      whatsapp: parsed.whatsapp?.trim() ?? "",
      email: parsed.email?.trim() || DEFAULT_ADMIN_CONTACT.email,
    };
  } catch {
    return DEFAULT_ADMIN_CONTACT;
  }
}

export function writeAdminContact(contact: AdminContact): void {
  writeCookie(COOKIE_NAME, encodeURIComponent(JSON.stringify(contact)), MAX_AGE);
}

export function clearAdminContact(): void {
  deleteCookie(COOKIE_NAME);
}

export function normalizeWhatsAppNumber(value: string): string {
  return value.replace(/[^\d]/g, "");
}

export function whatsappLink(number: string, message: string): string {
  const normalized = normalizeWhatsAppNumber(number);
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}
