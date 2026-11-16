import type { Metadata } from "next";
import { Suspense } from "react";

import { ResetPasswordView } from "@/components/auth/ResetPasswordView";

export const metadata: Metadata = {
  title: "Reset Password",
  description:
    "Minta tautan reset password Rupakarsa atau buat password baru dengan tautan yang dikirim ke email akun Anda.",
};

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-canvas">
          <span className="size-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      }
    >
      <ResetPasswordView />
    </Suspense>
  );
}
