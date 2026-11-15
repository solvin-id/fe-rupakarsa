import { beforeEach, describe, expect, it } from "vitest";

import {
  clearAdminContact,
  DEFAULT_ADMIN_CONTACT,
  normalizeWhatsAppNumber,
  readAdminContact,
  whatsappLink,
  writeAdminContact,
} from "@rupakarsa/shared/lib/contact-settings-cookie";

beforeEach(() => {
  clearAdminContact();
});

describe("admin contact settings", () => {
  it("normalizes WhatsApp numbers to digits", () => {
    expect(normalizeWhatsAppNumber("+62 812-3456 7890")).toBe("6281234567890");
  });

  it("builds an encoded WhatsApp link", () => {
    expect(whatsappLink("62 812-3456", "Halo admin")).toBe(
      "https://wa.me/628123456?text=Halo%20admin",
    );
  });

  it("falls back to the default contact when unset", () => {
    expect(readAdminContact()).toEqual(DEFAULT_ADMIN_CONTACT);
  });

  it("round-trips the admin contact", () => {
    writeAdminContact({
      name: "Admin Rupakarsa",
      whatsapp: "6281234567890",
      email: "admin@rupakarsa.id",
    });
    expect(readAdminContact()).toEqual({
      name: "Admin Rupakarsa",
      whatsapp: "6281234567890",
      email: "admin@rupakarsa.id",
    });
  });

  it("clears back to the default contact", () => {
    writeAdminContact({
      name: "Admin Rupakarsa",
      whatsapp: "6281234567890",
      email: "admin@rupakarsa.id",
    });
    clearAdminContact();
    expect(readAdminContact()).toEqual(DEFAULT_ADMIN_CONTACT);
  });
});
