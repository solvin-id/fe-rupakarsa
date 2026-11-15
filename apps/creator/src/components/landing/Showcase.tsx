import { ArrowUpRight, Image as ImageIcon, Play } from "lucide-react";
import Link from "next/link";

import { GradientArt, type GradientVariant } from "@rupakarsa/shared/brand";

interface ShowcaseItem {
  title: string;
  category: string;
  meta: string;
  variant: GradientVariant;
  media: "video" | "image";
  className?: string;
}

const ITEMS: ShowcaseItem[] = [
  {
    title: "Rasa Nusantara",
    category: "Food campaign",
    meta: "10s · 1080p · Wan Qwen",
    variant: "sunset",
    media: "video",
    className: "md:col-span-2 md:row-span-2",
  },
  {
    title: "Senja di Tegalsari",
    category: "Short film",
    meta: "4 shot · 16:9",
    variant: "night",
    media: "video",
  },
  {
    title: "Lumiere",
    category: "Product launch",
    meta: "10s · 1080p",
    variant: "ocean",
    media: "video",
  },
  {
    title: "Queen Bella",
    category: "Character anchor",
    meta: "2k · 9:16",
    variant: "violet",
    media: "image",
  },
  {
    title: "Neon Jakarta",
    category: "Look development",
    meta: "5s · 9:16",
    variant: "peach",
    media: "video",
  },
  {
    title: "Arsip 04",
    category: "Material study",
    meta: "1k · 1:1",
    variant: "sand",
    media: "image",
  },
];

export function Showcase() {
  return (
    <section id="showcase" className="relative overflow-hidden bg-canvas-2/60 py-20 lg:py-28">
      <div className="pointer-events-none absolute inset-0 dot-bg opacity-40" aria-hidden />
      <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="mono-label text-accent-strong">Showcase</span>
            <h2 className="display mt-3 text-[clamp(2.4rem,4.6vw,4rem)] text-ink">
              Karya dari <span className="serif text-accent-strong">karsa</span>.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-muted">
            Setiap kartu adalah hasil dari satu folder proyek: brief, plan, parameter, dan render
            yang bisa ditelusuri kembali.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 md:auto-rows-[17rem] md:grid-cols-3">
          {ITEMS.map((item) => (
            <article
              key={item.title}
              className={`group relative overflow-hidden rounded-[1.75rem] border border-border bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift ${item.className ?? ""}`}
            >
              <GradientArt
                variant={item.variant}
                rounded="rounded-none"
                className="h-full min-h-[18rem] w-full"
              >
                <div className="relative z-10 flex h-full flex-col justify-between p-5 text-white">
                  <div className="flex items-start justify-between gap-3">
                    <span className="rounded-full border border-white/25 bg-black/20 px-2.5 py-1 text-[10px] backdrop-blur">
                      {item.category}
                    </span>
                    <span className="flex size-8 items-center justify-center rounded-full border border-white/25 bg-white/15 backdrop-blur">
                      {item.media === "video" ? (
                        <Play className="ml-0.5 size-3.5 fill-white" aria-hidden />
                      ) : (
                        <ImageIcon className="size-3.5" aria-hidden />
                      )}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold tracking-[-0.03em] sm:text-2xl">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-[11px] text-white/70">{item.meta}</p>
                  </div>
                </div>
              </GradientArt>
            </article>
          ))}
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-4 rounded-[1.75rem] border border-border bg-white/70 px-6 py-5 sm:flex-row sm:items-center">
          <p className="text-sm text-muted">
            Galeri publik hanya menampilkan sebagian. Workspace lengkap tersedia setelah masuk.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink transition-colors hover:text-accent-strong"
          >
            Masuk ke workspace
            <ArrowUpRight className="size-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
