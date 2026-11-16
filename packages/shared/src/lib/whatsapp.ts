export function normalizeWhatsAppNumber(value: string): string {
  return value.replace(/[^\d]/g, "");
}

export function whatsappLink(number: string, message: string): string {
  const normalized = normalizeWhatsAppNumber(number);
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}
