import type { Metadata } from "next";

import { RequestAccessView } from "@/components/auth/RequestAccessView";

export const metadata: Metadata = {
  title: "Request Access",
  description:
    "Ajukan akses workspace Rupakarsa. Tim kami akan menghubungi Anda melalui WhatsApp.",
};

export default function RequestAccessPage() {
  return <RequestAccessView />;
}
