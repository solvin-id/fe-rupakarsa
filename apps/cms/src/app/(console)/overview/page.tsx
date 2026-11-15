import type { Metadata } from "next";

import { OverviewView } from "@/components/cms/OverviewView";

export const metadata: Metadata = {
  title: "Overview",
  description: "Ringkasan tenant, akses CMS, token, dan model aktif.",
};

export default function OverviewPage() {
  return <OverviewView />;
}
