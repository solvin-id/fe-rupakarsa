import type { Metadata } from "next";

import { UnifiedLogin } from "@rupakarsa/shared/auth";

const CREATOR_URL = process.env.NEXT_PUBLIC_CREATOR_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  title: "Masuk",
  description:
    "Masuk ke workspace kreator Rupakarsa. Admin dapat membuka CMS lewat surface switcher di dalam workspace.",
};

export default function LoginPage() {
  return <UnifiedLogin creatorUrl={CREATOR_URL} requestAccessUrl="/request-access" />;
}
