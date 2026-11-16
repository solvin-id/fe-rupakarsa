import type { Metadata } from "next";

import { WorkspaceHubView } from "@/components/workspace/WorkspaceHubView";

export const metadata: Metadata = {
  title: "Workspace",
  description: "Kelola workspace, anggota tim, dan permintaan bergabung.",
};

export default function WorkspacesPage() {
  return <WorkspaceHubView />;
}
