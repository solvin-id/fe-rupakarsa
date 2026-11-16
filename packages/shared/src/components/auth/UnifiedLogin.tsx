"use client";

import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  LayoutGrid,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Logo } from "../brand";
import { hasCmsAccess } from "../../lib/auth";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "../../lib/seed";
import { useSessionStore } from "../../stores/session-store";
import { Button, Field, TextInput } from "../ui";

export interface UnifiedLoginProps {
  creatorUrl: string;
  requestAccessUrl?: string;
}

const DEMO_DEMO = DEMO_ACCOUNTS.find((account) => account.userId === "usr_demo");
const DEMO_ADMIN = DEMO_ACCOUNTS.find((account) => account.userId === "usr_admin");
const DEMO_NADIA = DEMO_ACCOUNTS.find((account) => account.userId === "usr_nadia");

export function UnifiedLogin({
  creatorUrl,
  requestAccessUrl = "mailto:halo@rupakarsa.id",
}: UnifiedLoginProps) {
  const session = useSessionStore((state) => state.session);
  const hydrated = useSessionStore((state) => state.hydrated);
  const hydrate = useSessionStore((state) => state.hydrate);
  const refreshAccess = useSessionStore((state) => state.refreshAccess);
  const signIn = useSessionStore((state) => state.signIn);
  const signOut = useSessionStore((state) => state.signOut);
  const errorMessage = useSessionStore((state) => state.errorMessage);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    hydrate();
    refreshAccess();
  }, [hydrate, refreshAccess]);

  function goToCreator(): void {
    window.location.assign(`${creatorUrl}/app/projects`);
  }

  function handleSubmit(event: React.FormEvent): void {
    event.preventDefault();
    const ok = signIn(email, password);
    if (ok) goToCreator();
  }

  function fillDemo(account: typeof DEMO_DEMO): void {
    if (!account) return;
    setEmail(account.email);
    setPassword(DEMO_PASSWORD);
  }

  const canUseCms = session ? hasCmsAccess(session.user) : false;

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
            {[
              { value: "4.000", label: "saldo workspace" },
              { value: "250×", label: "plan gratis" },
              { value: "1", label: "workspace" },
            ].map((item) => (
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
              {session ? "Sesi aktif." : "Selamat datang kembali."}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {session
                ? "Lanjut ke workspace, atau keluar untuk memakai akun lain."
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
                <Button variant="ghost" className="w-full" onClick={signOut}>
                  Keluar dari akun
                </Button>
              </div>

              {canUseCms ? (
                <p className="mt-3 rounded-xl border border-border bg-surface-2/60 px-3 py-2 text-[11px] leading-relaxed text-muted">
                  Akses CMS dapat dibuka dari surface switcher di dalam workspace Creator.
                </p>
              ) : null}
            </div>
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
                icon={<ArrowRight className="size-4" aria-hidden />}
              >
                Masuk ke Creator
              </Button>

              <div className="mt-5 rounded-2xl border border-border bg-surface-2/70 p-3.5">
                <p className="mono-label text-[9px] text-muted">Akun demo</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => fillDemo(DEMO_DEMO)}
                    className="rounded-xl border border-border bg-white px-2.5 py-2 text-left transition-colors hover:border-ink/30"
                  >
                    <span className="block text-[11px] font-medium text-ink">Kreator</span>
                    <span className="mt-0.5 block truncate font-mono text-[9px] text-muted">
                      demo@rupakarsa.id
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fillDemo(DEMO_NADIA)}
                    className="rounded-xl border border-border bg-white px-2.5 py-2 text-left transition-colors hover:border-ink/30"
                  >
                    <span className="block text-[11px] font-medium text-ink">Nadia</span>
                    <span className="mt-0.5 block truncate font-mono text-[9px] text-muted">
                      nadia@alfateve.co.id
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fillDemo(DEMO_ADMIN)}
                    className="rounded-xl border border-border bg-white px-2.5 py-2 text-left transition-colors hover:border-ink/30"
                  >
                    <span className="block text-[11px] font-medium text-ink">Superadmin</span>
                    <span className="mt-0.5 block truncate font-mono text-[9px] text-muted">
                      admin@rupakarsa.id
                    </span>
                  </button>
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-[10px] text-muted">
                  <LockKeyhole className="size-3" aria-hidden />
                  Password demo: <span className="font-mono text-ink">{DEMO_PASSWORD}</span>
                </p>
                <p className="mt-2 text-[10px] leading-relaxed text-muted">
                  Admin: setelah masuk, buka CMS lewat surface switcher di sidebar workspace.
                </p>
              </div>
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
    </main>
  );
}
