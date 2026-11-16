import { describe, expect, it } from "vitest";

import { normalizeWhatsAppNumber, whatsappLink } from "@rupakarsa/shared/lib/whatsapp";

describe("admin contact helpers", () => {
  it("normalizes WhatsApp numbers to digits", () => {
    expect(normalizeWhatsAppNumber("+62 812-3456 7890")).toBe("6281234567890");
  });

  it("builds an encoded WhatsApp link", () => {
    expect(whatsappLink("62 812-3456", "Halo admin")).toBe(
      "https://wa.me/628123456?text=Halo%20admin",
    );
  });
});
