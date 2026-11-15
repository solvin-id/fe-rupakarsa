import { ArrowRight, Check, CircleDollarSign, Sparkles, Wand2 } from "lucide-react";

const STEPS = [
  {
    number: "01",
    title: "Tulis brief",
    description: "Masukkan ide mentah, gambar acuan, dan spesifikasi model di dalam folder proyek.",
  },
  {
    number: "02",
    title: "Buat plan",
    description: "DeepSeek-V3 menyusun blueprint sinematik. Edit manual sampai sesuai arah kreatif.",
  },
  {
    number: "03",
    title: "Implement & unduh",
    description: "Token di-hold, render berjalan di Higgsfield, hasil tersimpan ke R2.",
  },
];

export function Workflow() {
  return (
    <section id="alur" className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-ink px-6 py-12 text-canvas sm:px-10 lg:px-14 lg:py-16">
        <div
          className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-accent/25 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-20 size-80 rounded-full bg-accent-2/20 blur-3xl"
          aria-hidden
        />

        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <span className="mono-label text-accent">Alur produksi</span>
            <h2 className="display mt-3 text-[clamp(2.4rem,4.6vw,4rem)] text-canvas">
              Dua mode. Satu alur yang jelas.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-canvas/60">
            Plan Mode untuk berpikir. Implement Mode untuk mengeksekusi. Tidak ada render yang
            dimulai tanpa estimasi biaya.
          </p>
        </div>

        <div className="relative mt-10 grid gap-4 lg:grid-cols-2">
          <article className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-full bg-accent-2/20 text-[#c4b5fd]">
                  <Wand2 className="size-4" aria-hidden />
                </span>
                <div>
                  <p className="mono-label text-[9px] text-canvas/50">Tahap 1</p>
                  <h3 className="text-base font-semibold text-canvas">Plan Mode</h3>
                </div>
              </div>
              <span className="rounded-full border border-white/15 px-2.5 py-1 text-[10px] text-canvas/60">
                DeepSeek-V3
              </span>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="mono-label text-[9px] text-canvas/40">Raw prompt</p>
              <p className="mt-2 text-sm leading-relaxed text-canvas/80">
                “Mbok Srini berjalan di lorong penjara batu, membawa lentera, bayangan jeruji jatuh
                di wajahnya.”
              </p>
            </div>

            <div className="mt-3 flex items-center justify-center">
              <span className="flex size-8 items-center justify-center rounded-full border border-white/15 bg-white/5">
                <ArrowRight className="size-3.5 rotate-90 text-accent" aria-hidden />
              </span>
            </div>

            <div className="mt-3 rounded-2xl border border-accent/25 bg-accent/10 p-4">
              <div className="flex items-center justify-between">
                <p className="mono-label text-[9px] text-accent">Plan blueprint</p>
                <span className="flex items-center gap-1 text-[10px] text-accent-3">
                  <Check className="size-3" aria-hidden />
                  Siap diedit
                </span>
              </div>
              <div className="mt-3 space-y-2 text-[11px] leading-relaxed text-canvas/70">
                <p>
                  <span className="text-canvas">[SUBJECT]</span> Elderly Javanese farmer, faded
                  batik shawl, lantern in hand.
                </p>
                <p>
                  <span className="text-canvas">[CAMERA]</span> Slow tracking shot, 35mm, gentle
                  handheld follow.
                </p>
                <p>
                  <span className="text-canvas">[LIGHT]</span> Cold stone against warm lantern
                  light, dust in the air.
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-full bg-accent/20 text-accent">
                  <Sparkles className="size-4" aria-hidden />
                </span>
                <div>
                  <p className="mono-label text-[9px] text-canvas/50">Tahap 2</p>
                  <h3 className="text-base font-semibold text-canvas">Implement Mode</h3>
                </div>
              </div>
              <span className="rounded-full border border-white/15 px-2.5 py-1 text-[10px] text-canvas/60">
                Higgsfield
              </span>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between">
                <p className="mono-label text-[9px] text-canvas/40">Rincian biaya</p>
                <CircleDollarSign className="size-4 text-accent-3" aria-hidden />
              </div>
              <div className="mt-3 flex items-end justify-between">
                <div>
                  <p className="text-3xl font-semibold tracking-[-0.04em] text-canvas">35</p>
                  <p className="text-[10px] text-canvas/50">token · Wan Qwen 10s</p>
                </div>
                <p className="text-right text-[11px] text-canvas/60">
                  Saldo 4.000
                  <br />
                  <span className="text-canvas">Sisa 3.965</span>
                </p>
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[92%] rounded-full bg-gradient-to-r from-accent to-accent-3" />
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              {[
                { label: "Hold", value: "35" },
                { label: "Commit", value: "35" },
                { label: "Refund", value: "0" },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-white/10 bg-white/[0.03] px-2 py-2.5">
                  <p className="mono-label text-[8px] text-canvas/40">{item.label}</p>
                  <p className="mt-1 text-sm font-medium text-canvas">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-white">
              Generate konten
              <ArrowRight className="size-4" aria-hidden />
            </div>
            <p className="mt-2 text-center text-[10px] text-canvas/40">
              Gagal render? Token kembali otomatis.
            </p>
          </article>
        </div>

        <div className="relative mt-10 grid gap-4 border-t border-white/10 pt-8 sm:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.number} className="flex gap-3">
              <span className="mono-label text-accent">{step.number}</span>
              <div>
                <h3 className="text-sm font-semibold text-canvas">{step.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-canvas/55">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
