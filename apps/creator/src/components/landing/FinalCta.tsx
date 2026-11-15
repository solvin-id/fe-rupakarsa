import { ArrowUpRight, Sparkles } from "lucide-react";
import Link from "next/link";

import { Button } from "@rupakarsa/shared/ui";

export function FinalCta() {
  return (
    <section className="mx-auto w-full max-w-7xl px-5 pb-20 sm:px-8 lg:pb-28">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-ink px-6 py-14 text-canvas sm:px-10 lg:px-16 lg:py-20">
        <div
          className="pointer-events-none absolute -right-20 -top-24 size-80 rounded-full bg-accent/30 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-28 left-1/3 size-72 rounded-full bg-accent-2/25 blur-3xl"
          aria-hidden
        />
        <div className="relative grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <span className="pill border-white/15 bg-white/5 text-canvas/70">
              <Sparkles className="size-3.5 text-accent" aria-hidden />
              Siap untuk produksi
            </span>
            <h2 className="display mt-5 text-[clamp(2.6rem,5.4vw,4.8rem)] text-canvas">
              Siap memproduksi
              <br />
              lebih <span className="serif text-accent">rapi</span>?
            </h2>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-canvas/60 sm:text-base">
              Masuk ke workspace, buka folder proyek, dan mulai dari satu brief. Rupakarsa menjaga
              konteks, biaya, dan hasil tetap terhubung.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/login">
                <Button
                  variant="primary"
                  size="lg"
                  icon={<ArrowUpRight className="size-4" aria-hidden />}
                >
                  Masuk ke workspace
                </Button>
              </Link>
              <Link
                href="/request-access"
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-5 py-3 text-sm text-canvas/70 transition-colors hover:border-white/30 hover:text-canvas"
              >
                Hubungi tim
              </Link>
            </div>
            <p className="mt-4 text-xs text-canvas/40">
              Akun dibuat oleh Superadmin. Hubungi tim untuk mendapatkan akses.
            </p>
          </div>

          <div className="relative hidden justify-center lg:flex">
            <div className="relative flex size-64 items-center justify-center rounded-full border border-white/10">
              <div className="absolute inset-6 rounded-full border border-white/10" />
              <div className="absolute inset-12 rounded-full border border-white/10" />
              <div className="flex size-28 items-center justify-center rounded-full bg-accent text-white shadow-[0_0_80px_rgba(240,78,35,0.55)]">
                <span className="display text-3xl">R</span>
              </div>
              <span className="absolute -right-2 top-8 rounded-full border border-white/15 bg-ink px-3 py-1.5 text-[10px] text-canvas/70">
                Plan → Implement
              </span>
              <span className="absolute -left-4 bottom-10 rounded-full border border-white/15 bg-ink px-3 py-1.5 text-[10px] text-canvas/70">
                Token aman
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
