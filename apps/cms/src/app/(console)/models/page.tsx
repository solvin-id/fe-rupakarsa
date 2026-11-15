import type { Metadata } from "next";

import { ModelsView } from "@/components/cms/ModelsView";

export const metadata: Metadata = {
  title: "Models & tarif",
  description: "Aktivasi model AI, parameter, dan tarif token per render.",
};

export default function ModelsPage() {
  return <ModelsView />;
}
