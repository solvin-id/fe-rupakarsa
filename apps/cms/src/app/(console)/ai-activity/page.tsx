import type { Metadata } from "next";

import { AiActivityView } from "@/components/cms/AiActivityView";

export const metadata: Metadata = {
  title: "AI activity",
  description: "Log permintaan AI, submit provider, dan hasil render terbaru.",
};

export default function AiActivityPage() {
  return <AiActivityView />;
}
