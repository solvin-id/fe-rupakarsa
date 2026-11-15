import type { Metadata } from "next";

import { StudioView } from "@/components/workspace/StudioView";

export const metadata: Metadata = {
  title: "Studio",
  description: "Plan Mode, Implement Mode, dan riwayat render di dalam folder proyek.",
};

export default async function FolderStudioPage({
  params,
}: {
  params: Promise<{ folderId: string }>;
}) {
  const { folderId } = await params;
  return <StudioView folderId={folderId} />;
}
