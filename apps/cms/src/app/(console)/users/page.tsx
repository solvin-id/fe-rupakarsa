import type { Metadata } from "next";

import { UsersView } from "@/components/cms/UsersView";

export const metadata: Metadata = {
  title: "Users & akses",
  description: "Registrasi user dan workspace, akses CMS, saldo token, dan kuota Plan Mode.",
};

export default function UsersPage() {
  return <UsersView />;
}
