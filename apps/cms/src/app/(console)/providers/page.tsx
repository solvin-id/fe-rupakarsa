import type { Metadata } from "next";

import { ProvidersView } from "@/components/cms/ProvidersView";

export const metadata: Metadata = {
  title: "Providers",
  description: "Kelola API key Kenari AI, Higgsfield, dan Cloudflare R2.",
};

export default function ProvidersPage() {
  return <ProvidersView />;
}
