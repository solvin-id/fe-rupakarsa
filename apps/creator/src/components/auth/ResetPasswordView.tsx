"use client";

import { ArrowLeft, ArrowRight, CheckCircle2, KeyRound, Mail } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { Logo } from "@rupakarsa/shared/brand";
import {
  useConfirmPasswordResetMutation,
  useRequestPasswordResetMutation,
} from "@rupakarsa/shared/hooks/use-session";
import { Button, Field, TextInput } from "@rupakarsa/shared/ui";

const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).{10,72}$/;
const PASSWORD_MESSAGE = "Password minimal 10 karakter dan harus memuat huruf dan angka.";

export function ResetPasswordView() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";

  return (
    <main className="relative flex min-h-screen items-center justify-center px-5 py-12 sm:px-8">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-60" aria-hidden />
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex items-center justify-between">
          <Logo />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-ink"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Beranda
          </Link>
        </div>

        <div className="mb-6">
          <span className="mono-label text-accent-strong">Reset password</span>
          <h1 className="display mt-3 text-4xl text-ink">
            {token ? "Buat password baru." : "Lupa password?"}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {token
              ? "Masukkan password baru untuk akun Rupakarsa Anda."
              : "Masukkan email akun Anda. Kami akan mengirim tautan untuk membuat password baru."}
          </p>
        </div>

        {token ? <ConfirmForm token={token} /> : <RequestForm />}

        <p className="mt-6 text-center text-xs text-muted">
          Ingat password Anda?{" "}
          <Link href="/login" className="font-medium text-accent-strong hover:underline">
            Kembali ke halaman masuk
          </Link>
        </p>
      </div>
    </main>
  );
}

function RequestForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const mutation = useRequestPasswordResetMutation();

  function handleSubmit(event: React.FormEvent): void {
    event.preventDefault();
    mutation.mutate(email.trim(), { onSuccess: () => setSent(true) });
  }

  if (sent) {
    return (
      <div className="card p-6 sm:p-7">
        <span className="flex size-11 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircle2 className="size-5" aria-hidden />
        </span>
        <h2 className="mt-4 text-xl font-semibold tracking-[-0.03em] text-ink">Periksa email Anda</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Jika email terdaftar, tautan reset sudah dikirim. Tautan berlaku selama 60 menit.
        </p>
        <Button variant="secondary" className="mt-5 w-full" onClick={() => setSent(false)}>
          Kirim ulang
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6 sm:p-7">
      <Field label="Email" htmlFor="reset-email">
        <TextInput
          id="reset-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="nama@perusahaan.co.id"
          required
        />
      </Field>

      {mutation.error ? (
        <p className="mt-4 rounded-xl border border-danger/20 bg-danger/5 px-3.5 py-2.5 text-sm leading-relaxed text-danger">
          {mutation.error.message}
        </p>
      ) : null}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="mt-5 w-full"
        loading={mutation.isPending}
        icon={<Mail className="size-4" aria-hidden />}
      >
        Kirim link reset
      </Button>
    </form>
  );
}

function ConfirmForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const mutation = useConfirmPasswordResetMutation();

  function handleSubmit(event: React.FormEvent): void {
    event.preventDefault();
    setLocalError(null);

    if (!PASSWORD_PATTERN.test(password)) {
      setLocalError(PASSWORD_MESSAGE);
      return;
    }
    if (password !== confirmation) {
      setLocalError("Konfirmasi password tidak sama.");
      return;
    }

    mutation.mutate({ token, newPassword: password }, { onSuccess: () => setDone(true) });
  }

  if (done) {
    return (
      <div className="card p-6 sm:p-7">
        <span className="flex size-11 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircle2 className="size-5" aria-hidden />
        </span>
        <h2 className="mt-4 text-xl font-semibold tracking-[-0.03em] text-ink">
          Password diperbarui
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Password baru Anda sudah aktif dan seluruh sesi lama dicabut. Masuk kembali untuk
          melanjutkan.
        </p>
        <Link
          href="/login"
          className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-accent-strong px-6 text-[15px] font-medium tracking-[-0.01em] text-white shadow-[0_14px_30px_-16px_rgba(217,62,20,0.9)] transition-all duration-200 hover:bg-accent"
        >
          Masuk ke Creator
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    );
  }

  const errorMessage = localError ?? mutation.error?.message ?? null;

  return (
    <form onSubmit={handleSubmit} className="card p-6 sm:p-7">
      <div className="flex flex-col gap-4">
        <Field
          label="Password baru"
          htmlFor="reset-password"
          hint="Minimal 10 karakter, memuat huruf dan angka."
        >
          <TextInput
            id="reset-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••••"
            required
          />
        </Field>

        <Field label="Ulangi password baru" htmlFor="reset-password-confirmation">
          <TextInput
            id="reset-password-confirmation"
            type="password"
            autoComplete="new-password"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            placeholder="••••••••••"
            required
          />
        </Field>
      </div>

      {errorMessage ? (
        <p className="mt-4 rounded-xl border border-danger/20 bg-danger/5 px-3.5 py-2.5 text-sm leading-relaxed text-danger">
          {errorMessage}
        </p>
      ) : null}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="mt-5 w-full"
        loading={mutation.isPending}
        icon={<KeyRound className="size-4" aria-hidden />}
      >
        Simpan password baru
      </Button>
    </form>
  );
}
