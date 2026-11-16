"use client";

import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  LayoutGrid,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Logo } from "../brand";
import { hasCmsAccess } from "../../lib/auth";
import {
  useLoginMutation,
  useLogoutMutation,
  useSessionQuery,
  useTotpChallengeMutation,
} from "../../hooks/use-session";
import { isLoginChallenge } from "../../lib/types";
import type { LoginChallenge } from "../../lib/types";
import { useUiStore } from "../../stores/ui-store";
import { Button, Field, TextInput, ToastViewport } from "../ui";

export interface UnifiedLoginProps {
  creatorUrl: string;
  requestAccessUrl?: string;
}

const PRICING_HIGHLIGHTS = [
  { value: "4.000", label: "token per paket" },
  { value: "250×", label: "plan gratis" },
  { value: "Rp 2 jt", label: "paket awal" },
];

export function UnifiedLogin({
  creatorUrl,
  requestAccessUrl = "mailto:halo@rupakarsa.id",
}: UnifiedLoginProps) {
  const sessionQuery = useSessionQuery();
  const loginMutation = useLoginMutation();
  const totpMutation = useTotpChallengeMutation();
  const logoutMutation = useLogoutMutation();
  const pushToast = useUiStore((state) => state.pushToast);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [challenge, setChallenge] = useState<LoginChallenge | null>(null);
  const [code, setCode] = useState("");

  const session = sessionQuery.data ?? null;

  function goToCreator(): void {
    window.location.assign(`${creatorUrl}/app/projects`);
  }

  function handleSubmit(event: React.FormEvent): void {
    event.preventDefault();
    loginMutation.mutate(
      { email: email.trim(), password },
      {
        onSuccess: (result) => {
          if (isLoginChallenge(result)) {
            setChallenge(result);
            setCode("");
            return;
          }
          goToCreator();
        },
        onError: (error) => pushToast("error", error.message),
      },
    );
  }

  function handleChallengeSubmit(event: React.FormEvent): void {
    event.preventDefault();
    if (!challenge) return;
    totpMutation.mutate(
      { challengeToken: challenge.challengeToken, code: code.trim() },
      {
        onSuccess: goToCreator,
        onError: (error) => pushToast("error", error.message),
      },
    );
  }

  function resetChallenge(): void {
    setChallenge(null);
    setCode("");
    totpMutation.reset();
  }

  const canUseCms = session ? hasCmsAccess(session.user) : false;
  const errorMessage = loginMutation.error?.message ?? null;
  const challengeError = totpMutation.error?.message ?? null;

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden bg-ink px-10 py-12 text-canvas lg:flex lg:flex-col lg:justify-between">
        <div
          className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-accent/25 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-20 size-96 rounded-full bg-accent-2/20 blur-3xl"
          aria-hidden
        />

        <div className="relative">
          <Logo dark href={creatorUrl} />
        </div>

        <div className="relative max-w-lg">
          <span className="pill border-white/15 bg-white/5 text-canvas/70">
            <Sparkles className="size-3.5 text-accent" aria-hidden />
            Ruang produksi kreator
          </span>
          <h1 className="display mt-6 text-[clamp(2.8rem,4.6vw,4.6rem)] text-canvas">
            Masuk ke
            <br />
            ruang <span className="serif text-accent">karsa</span>.
          </h1>
          <p className="mt-5 text-sm leading-relaxed text-canvas/60">
            Creator untuk produksi. Jika akun Anda memiliki akses CMS, Anda dapat berpindah
            surface dari dalam workspace tanpa login ulang.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-3">
            {PRICING_HIGHLIGHTS.map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3">
                <p className="text-xl font-semibold tracking-[-0.03em] text-canvas">{item.value}</p>
                <p className="mt-0.5 text-[10px] text-canvas/50">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent">
            <ShieldCheck className="size-4" aria-hidden />
          </span>
          <p className="text-xs leading-relaxed text-canvas/60">
            Akses CMS diberikan per akun oleh Superadmin. Admin dapat berpindah surface dari dalam
            workspace.
          </p>
        </div>
      </section>

      <section className="relative flex items-center justify-center px-5 py-12 sm:px-8">
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-60" aria-hidden />
        <div className="relative w-full max-w-md">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <Logo href={creatorUrl} />
            <a
              href={creatorUrl}
              className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-ink"
            >
              <ArrowLeft className="size-3.5" aria-hidden />
              Beranda
            </a>
          </div>

          <div className="mb-8">
            <span className="mono-label text-accent-strong">Creator access</span>
            <h2 className="display mt-3 text-4xl text-ink">
              {session ? "Sesi aktif." : challenge ? "Verifikasi 2FA." : "Selamat datang kembali."}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {session
                ? "Lanjut ke workspace, atau keluar untuk memakai akun lain."
                : challenge
                  ? "Akun Anda dilindungi verifikasi dua langkah. Masukkan kode dari aplikasi authenticator."
                  : "Masuk dengan akun kreator yang diberikan Superadmin Rupakarsa."}
            </p>
          </div>

          {session ? (
            <div className="card p-6 sm:p-7">
              <p className="mono-label text-[9px] text-muted">Sesi aktif</p>
              <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-ink">
                Halo, {session.user.fullName}.
              </h3>
              <p className="mt-1 text-sm text-muted">
                {session.user.email} · {session.workspace.name}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="pill">
                  <LayoutGrid className="size-3.5 text-accent" aria-hidden />
                  Creator
                </span>
                {canUseCms ? (
                  <span className="pill border-success/25 bg-success/10 text-success">
                    <ShieldCheck className="size-3.5" aria-hidden />
                    CMS tersedia
                  </span>
                ) : null}
              </div>

              <div className="mt-5 flex flex-col gap-2">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  icon={<ArrowRight className="size-4" aria-hidden />}
                  onClick={goToCreator}
                >
                  Lanjut ke Creator
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  loading={logoutMutation.isPending}
                  onClick={() => logoutMutation.mutate()}
                >
                  Keluar dari akun
                </Button>
              </div>

              {canUseCms ? (
                <p className="mt-3 rounded-xl border border-border bg-surface-2/60 px-3 py-2 text-[11px] leading-relaxed text-muted">
                  Akses CMS dapat dibuka dari surface switcher di dalam workspace Creator.
                </p>
              ) : null}
            </div>
          ) : challenge ? (
            <form onSubmit={handleChallengeSubmit} className="card p-6 sm:p-7">
              <div className="flex items-start gap-3 rounded-2xl border border-border bg-surface-2/60 px-3.5 py-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-strong">
                  <ShieldCheck className="size-4" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-medium text-ink">Verifikasi dua langkah</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted">
                    Masukkan 6 digit kode dari aplikasi authenticator Anda untuk melanjutkan.
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <Field label="Kode 2FA" htmlFor="login-totp">
                  <TextInput
                    id="login-totp"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={code}
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    className="text-center font-mono text-lg tracking-[0.4em]"
                    required
                  />
                </Field>
              </div>

              {challengeError ? (
                <p className="mt-4 rounded-xl border border-danger/20 bg-danger/5 px-3.5 py-2.5 text-sm leading-relaxed text-danger">
                  {challengeError}
                </p>
              ) : null}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="mt-5 w-full"
                loading={totpMutation.isPending}
                disabled={code.length !== 6}
                icon={<ArrowRight className="size-4" aria-hidden />}
              >
                Verifikasi & masuk
              </Button>

              <Button
                variant="ghost"
                className="mt-2 w-full"
                onClick={resetChallenge}
                disabled={totpMutation.isPending}
              >
                Kembali
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="card p-6 sm:p-7">
              <div className="flex flex-col gap-4">
                <Field label="Email" htmlFor="login-email">
                  <TextInput
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="nama@alfateve.co.id"
                    required
                  />
                </Field>

                <Field label="Password" htmlFor="login-password">
                  <div className="relative">
                    <TextInput
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="••••••••"
                      className="pr-11"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                      className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-muted transition-colors hover:bg-ink/5 hover:text-ink"
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" aria-hidden />
                      ) : (
                        <Eye className="size-4" aria-hidden />
                      )}
                    </button>
                  </div>
                </Field>
                <div className="flex justify-end">
                  <Link
                    href="/reset-password"
                    className="text-xs font-medium text-accent-strong transition-colors hover:text-accent"
                  >
                    Lupa password?
                  </Link>
                </div>
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
                loading={loginMutation.isPending}
                icon={<ArrowRight className="size-4" aria-hidden />}
              >
                Masuk ke Creator
              </Button>

              <p className="mt-4 text-center text-[11px] leading-relaxed text-muted">
                Dengan masuk, Anda menyetujui{" "}
                <Link
                  href="/terms"
                  className="font-medium text-ink underline decoration-border-strong underline-offset-2 transition-colors hover:text-accent-strong"
                >
                  Ketentuan
                </Link>{" "}
                dan{" "}
                <Link
                  href="/privacy"
                  className="font-medium text-ink underline decoration-border-strong underline-offset-2 transition-colors hover:text-accent-strong"
                >
                  Kebijakan Privasi
                </Link>
                .
              </p>

              <p className="mt-4 rounded-xl border border-border bg-surface-2/60 px-3.5 py-2.5 text-[11px] leading-relaxed text-muted">
                Akun dibuat oleh Superadmin Rupakarsa. Hubungi admin bila Anda belum memiliki
                kredensial masuk.
              </p>
            </form>
          )}

          <div className="mt-6 flex items-center justify-between gap-3 text-xs text-muted">
            <a href={creatorUrl} className="inline-flex items-center gap-1.5 hover:text-ink">
              <ArrowLeft className="size-3.5" aria-hidden />
              Kembali ke beranda
            </a>
            <a href={requestAccessUrl} className="hover:text-ink">
              Butuh akses?
            </a>
          </div>
        </div>
      </section>
      <ToastViewport />
    </main>
  );
}
