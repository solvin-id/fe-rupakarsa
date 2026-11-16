import {
  ArrowUpRight,
  Check,
  Clapperboard,
  Play,
  PlayCircle,
  Sparkles,
  Wand2,
} from "lucide-react";
import Link from "next/link";

import { GradientArt } from "@rupakarsa/shared/brand";
import { Button } from "@rupakarsa/shared/ui";

const STATS = [
  { value: "3×", label: "lebih cepat dari alur manual" },
  { value: "1", label: "workspace untuk seluruh tim" },
  { value: "100%", label: "token gagal direfund otomatis" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-80" aria-hidden />
      <div
        className="pointer-events-none absolute -left-24 top-24 size-72 rounded-full bg-accent/15 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-20 top-1/3 size-80 rounded-full bg-accent-2/15 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto w-full max-w-7xl px-5 pb-20 pt-14 sm:px-8 lg:pb-28 lg:pt-20">
        <div className="grid items-center gap-14 lg:grid-cols-[1.02fr_0.98fr]">
          <div className="animate-fade-up">
            <span className="pill">
              <Sparkles className="size-3.5 text-accent" aria-hidden />
              AI production workspace untuk tim
            </span>

            <h1 className="display mt-6 text-[clamp(3.1rem,7.2vw,6.2rem)] text-ink">
              Dari <span className="serif text-accent-strong">karsa</span>
              <br />
              menjadi <span className="highlight">karya</span>.
            </h1>

            <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-muted sm:text-lg">
              Rupakarsa menyatukan folder proyek, Plan Mode, render AI, dan token dalam satu
              workspace. Untuk tim yang memproduksi visual setiap hari, dengan seluruh aset
              tersimpan rapi di workspace.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/login">
                <Button
                  variant="primary"
                  size="lg"
                  icon={<ArrowUpRight className="size-4" aria-hidden />}
                >
                  Mulai produksi
                </Button>
              </Link>
              <a href="#alur">
                <Button
                  variant="secondary"
                  size="lg"
                  icon={<PlayCircle className="size-4" aria-hidden />}
                >
                  Lihat alur
                </Button>
              </a>
            </div>

            <p className="mt-4 text-xs text-muted">
              Akun dibuat oleh Superadmin. Hubungi tim untuk mendapatkan akses.
            </p>

            <dl className="mt-10 grid grid-cols-3 gap-4 border-t border-border pt-6">
              {STATS.map((stat) => (
                <div key={stat.label}>
                  <dt className="display text-3xl text-ink sm:text-4xl">{stat.value}</dt>
                  <dd className="mt-1 text-[11px] leading-snug text-muted">{stat.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative mx-auto w-full max-w-[34rem] lg:max-w-none">
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 size-[24rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-soft blur-3xl sm:size-[30rem]"
              aria-hidden
            />

            <svg
              className="pointer-events-none absolute -left-6 top-6 hidden h-24 w-24 text-accent sm:block"
              viewBox="0 0 100 100"
              fill="none"
              aria-hidden
            >
              <path
                d="M12 62c14-30 34-42 58-36 12 3 18 12 16 22-2 9-12 14-22 10-9-4-10-16-2-24 10-10 26-8 34 4"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>

            <div
              className="animate-float relative z-10 mx-auto w-full max-w-[24rem] rotate-[-3deg] sm:max-w-[26rem]"
              style={{ "--float-rotate": "-3deg" } as React.CSSProperties}
            >
              <GradientArt variant="sunset" className="aspect-[4/5] p-5 shadow-lift">
                <div className="relative z-10 flex h-full flex-col justify-between text-white">
                  <div>
                    <p className="mono-label text-white/70">Rasa Nusantara</p>
                    <p className="mt-1 text-sm font-medium">Close-up uap rendang</p>
                    <p className="mt-1 text-[10px] text-white/60">Wan Qwen · 16:9 · 1080p</p>
                  </div>

                  <div className="flex items-center justify-center">
                    <span className="flex size-16 items-center justify-center rounded-full border border-white/30 bg-white/15 backdrop-blur-md">
                      <Play className="ml-0.5 size-6 fill-white text-white" aria-hidden />
                    </span>
                  </div>

                  <div className="pl-48">
                    <div className="flex items-center justify-end text-[10px] text-white/70">
                      <span>00:10</span>
                    </div>
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/20">
                      <div className="h-full w-2/3 rounded-full bg-white" />
                    </div>
                  </div>
                </div>
              </GradientArt>
            </div>

            <div
              className="animate-float absolute -right-1 top-2 z-20 hidden w-44 rotate-[4deg] rounded-2xl border border-border bg-white p-3.5 shadow-card sm:block"
              style={{ "--float-rotate": "4deg", animationDelay: "1.2s" } as React.CSSProperties}
            >
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-full bg-accent-2-soft text-accent-2">
                  <Wand2 className="size-3.5" aria-hidden />
                </span>
                <div>
                  <p className="mono-label text-[9px] text-muted">Plan Mode</p>
                  <p className="text-[11px] font-medium text-ink">Blueprint siap</p>
                </div>
              </div>
              <div className="mt-3 space-y-1.5">
                <div className="h-1.5 w-full rounded-full bg-ink/10" />
                <div className="h-1.5 w-4/5 rounded-full bg-ink/10" />
                <div className="h-1.5 w-3/5 rounded-full bg-accent/30" />
              </div>
              <p className="mt-2.5 flex items-center gap-1 text-[10px] text-success">
                <Check className="size-3" aria-hidden />
                DeepSeek-V3
              </p>
            </div>

            <div
              className="animate-float absolute -left-2 bottom-4 z-20 hidden w-48 rotate-[2deg] rounded-2xl border border-border bg-white p-3.5 shadow-card sm:block"
              style={{ "--float-rotate": "2deg", animationDelay: "0.6s" } as React.CSSProperties}
            >
              <div className="flex items-center justify-between">
                <p className="mono-label text-[9px] text-muted">Paket standar</p>
                <span className="rounded-full bg-accent-3-soft px-2 py-0.5 text-[9px] font-medium text-[#3f6212]">
                  Aktif
                </span>
              </div>
              <p className="mt-1.5 text-2xl font-semibold tracking-[-0.04em] text-ink">
                4.000 <span className="text-xs font-medium text-muted">token</span>
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink/10">
                <div className="h-full w-[78%] rounded-full bg-accent" />
              </div>
              <p className="mt-2 text-[10px] text-muted">Rp 2.000.000 · 250 Plan Mode gratis</p>
            </div>

            <div className="absolute -bottom-2 right-4 z-20 hidden items-center gap-2 rounded-full border border-border bg-white px-3 py-2 shadow-card sm:flex">
              <span className="flex size-6 items-center justify-center rounded-full bg-success/10 text-success">
                <Check className="size-3.5" aria-hidden />
              </span>
              <span className="text-[11px] font-medium text-ink">Render selesai</span>
            </div>

            <div className="absolute -right-4 bottom-24 z-0 hidden size-20 items-center justify-center rounded-full border border-ink/10 bg-canvas text-ink sm:flex">
              <Clapperboard className="size-6" aria-hidden />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
