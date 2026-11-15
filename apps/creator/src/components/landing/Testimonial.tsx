import { Quote, Star } from "lucide-react";

import { GradientArt } from "@rupakarsa/shared/brand";

const METRICS = [
  { value: "140", label: "video per top-up" },
  { value: "40", label: "aset gambar" },
  { value: "0", label: "token hilang saat gagal" },
];

export function Testimonial() {
  return (
    <section className="mx-auto w-full max-w-7xl px-5 pb-20 sm:px-8 lg:pb-28">
      <div className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <article className="relative overflow-hidden rounded-[2rem] border border-border bg-white p-7 shadow-card sm:p-10">
          <Quote className="size-8 text-accent/30" aria-hidden />
          <blockquote className="mt-5 max-w-3xl text-[clamp(1.5rem,2.6vw,2.4rem)] font-medium leading-[1.2] tracking-[-0.03em] text-ink">
            “Rupakarsa membuat brief, plan, dan hasil render ada di satu tempat. Semua tim bekerja
            dari konteks yang sama.”
          </blockquote>

          <div className="mt-8 flex items-center gap-3">
            <GradientArt variant="violet" className="size-12 shrink-0 rounded-full" />
            <div>
              <p className="text-sm font-semibold text-ink">Nadia Prameswari</p>
              <p className="text-xs text-muted">Creative Lead</p>
            </div>
            <span className="ml-auto hidden items-center gap-1 rounded-full border border-border px-3 py-1.5 text-[10px] text-muted sm:flex">
              <Star className="size-3 fill-accent text-accent" aria-hidden />
              Tim produksi
            </span>
          </div>
        </article>

        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          {METRICS.map((metric) => (
            <div
              key={metric.label}
              className="flex flex-col justify-center rounded-[1.5rem] border border-border bg-canvas-2/60 px-5 py-5"
            >
              <p className="display text-4xl text-ink">{metric.value}</p>
              <p className="mt-1 text-xs text-muted">{metric.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
