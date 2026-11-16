import type { Metadata } from "next";

import { StorageView } from "@/components/cms/StorageView";

export const metadata: Metadata = {
  title: "Storage",
  description: "Driver storage global, retensi media, dan status Google Drive per workspace.",
};

export default function StoragePage() {
  return <StorageView />;
}
