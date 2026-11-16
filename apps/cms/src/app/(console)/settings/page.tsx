import type { Metadata } from "next";

import { SettingsView } from "@/components/cms/SettingsView";

export const metadata: Metadata = {
  title: "Settings",
  description: "Atur kontak admin untuk request akses calon workspace.",
};

export default function SettingsPage() {
  return <SettingsView />;
}
