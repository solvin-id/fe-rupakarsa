import type { Metadata } from "next";

import { WorkspacesView } from "@/components/cms/WorkspacesView";

export const metadata: Metadata = {
  title: "Workspaces",
  description: "Kantong token, kuota Plan Mode, dan status workspace.",
};

export default function WorkspacesPage() {
  return <WorkspacesView />;
}
