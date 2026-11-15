import type { Metadata } from "next";

import { ProjectsView } from "@/components/app/ProjectsView";

export const metadata: Metadata = {
  title: "Proyek",
  description: "Drive workspace Rupakarsa: kelola folder proyek, aset, dan riwayat render.",
};

export default function ProjectsPage() {
  return <ProjectsView />;
}
