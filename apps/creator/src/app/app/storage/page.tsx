import type { Metadata } from "next";

import { StorageView } from "@/components/app/StorageView";

export const metadata: Metadata = {
  title: "Penyimpanan",
  description: "Grid aset workspace: lampiran, hasil render, dan pemakaian storage.",
};

export default function StoragePage() {
  return <StorageView />;
}
