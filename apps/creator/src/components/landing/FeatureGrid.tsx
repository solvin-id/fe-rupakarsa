import {
  ArrowUpRight,
  FolderKanban,
  Layers3,
  ReceiptText,
  Sparkles,
  Wand2,
} from "lucide-react";

const FEATURES = [
  {
    icon: FolderKanban,
    title: "Drive proyek",
    description:
      "Setiap brief punya folder. Aset referensi, plan, dan hasil render tersimpan rapi per proyek—bukan tercampur di satu feed.",
    className: "bg-white",
    accent: "bg-accent-soft text-accent-strong",
  },
  {
    icon: Wand2,
    title: "Plan Mode",
    description:
      "DeepSeek-V3 via Kenari AI menerjemahkan ide mentah dan gambar acuan menjadi blueprint sinematik yang bisa diedit.",
    className: "bg-accent-2-soft",
    accent: "bg-white text-accent-2",
  },
  {
    icon: Layers3,
    title: "Implement Mode",
    description:
      "Eksekusi blueprint ke Higgsfield. Token di-hold saat render, di-commit saat sukses, dan direfund otomatis saat gagal.",
    className: "bg-accent-3-soft",
    accent: "bg-white text-[#3f6212]",
  },
  {
    icon: ReceiptText,
    title: "Token ledger",
    description:
      "Estimasi biaya tampil sebelum render. Setiap hold, commit, refund, dan top-up tercatat dalam buku besar yang bisa diaudit.",
    className: "bg-sky-soft",
    accent: "bg-white text-[#075985]",
  },
];

export function FeatureGrid() {
  return (
    <section id="produk" className="relative mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <span className="mono-label text-accent-strong">Satu workspace</span>
          <h2 className="display mt-3 text-[clamp(2.4rem,4.6vw,4rem)] text-ink">
            Semua yang tim produksi butuhkan, tanpa tabrakan file.
          </h2>
        </div>
        <p className="max-w-sm text-sm leading-relaxed text-muted">
          Rupakarsa bukan generator stateless. Ia menyimpan konteks cerita, aset, dan keputusan
          kreatif di dalam folder proyek.
        </p>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((feature) => {
          const Icon = feature.icon;
          return (
            <article
              key={feature.title}
              className={`hover-lift group relative overflow-hidden rounded-[1.75rem] border border-border p-6 shadow-card hover:-translate-y-1 hover:shadow-lift ${feature.className}`}
            >
              <span
                className={`flex size-11 items-center justify-center rounded-2xl ${feature.accent}`}
              >
                <Icon className="size-5" aria-hidden />
              </span>
              <h3 className="mt-5 text-lg font-semibold tracking-[-0.02em] text-ink">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/65">{feature.description}</p>
              <ArrowUpRight
                className="absolute right-5 top-5 size-4 text-ink/25 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink/60"
                aria-hidden
              />
            </article>
          );
        })}
      </div>

      <div className="mt-4 flex flex-col items-start justify-between gap-4 rounded-[1.75rem] border border-border bg-white/60 px-6 py-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-full bg-ink text-canvas">
            <Sparkles className="size-4" aria-hidden />
          </span>
          <p className="text-sm text-ink">
            Isolasi data per tenant sejak database pertama. Setiap tim bekerja di ruangnya sendiri.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted/70">
          <span>Kenari AI</span>
          <span>Higgsfield</span>
          <span>Cloudflare R2</span>
        </div>
      </div>
    </section>
  );
}
