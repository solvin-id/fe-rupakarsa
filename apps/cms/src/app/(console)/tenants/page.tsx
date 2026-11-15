import type { Metadata } from "next";

import { TenantsView } from "@/components/cms/TenantsView";

export const metadata: Metadata = {
  title: "Tenants",
  description: "Kantong token, kuota Plan Mode, dan status tenant.",
};

export default function TenantsPage() {
  return <TenantsView />;
}
