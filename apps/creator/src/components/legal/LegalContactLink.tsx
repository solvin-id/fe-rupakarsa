"use client";

import { usePublicConfigQuery } from "@rupakarsa/shared/hooks/use-session";

const FALLBACK_EMAIL = "halo@rupakarsa.id";

export function LegalContactLink() {
  const configQuery = usePublicConfigQuery();
  const email = configQuery.data?.contact.email?.trim() || FALLBACK_EMAIL;

  return (
    <a
      href={`mailto:${email}`}
      className="font-medium text-accent-strong underline decoration-accent/40 underline-offset-2 transition-colors hover:decoration-accent"
    >
      {email}
    </a>
  );
}
