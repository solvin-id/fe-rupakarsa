import type { Metadata } from "next";

import { SecurityView } from "@/components/app/SecurityView";

export const metadata: Metadata = {
  title: "Keamanan",
  description: "Kelola dua faktor (TOTP) dan keamanan akun Rupakarsa.",
};

export default function SecurityPage() {
  return <SecurityView />;
}
