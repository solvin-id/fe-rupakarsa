import { ArrowUpRight, Check, Sparkles } from "lucide-react";
import Link from "next/link";

import { formatRupiahFromTokens, formatTokens } from "@rupakarsa/shared/lib/format";

/** Static marketing copy mirrors the platform pricing defaults; no data fetch on the landing page. */
const TOKEN_VALUE_RUPIAH = 500;

const PLANS = [
  {
    name: "Video 5 detik",
    model: "Wan Qwen 5s",
    tokens: 18,
    capacity: "222 video",
    features: ["720p / 1080p", "16:9 · 9:16 · 1:1", "Hold & auto-refund"],
    featured: false,
  },
  {
    name: "Video 10 detik",
    model: "Wan Qwen 10s",
    tokens: 35,
    capacity: "114 video",
    features: ["720p / 1080p", "16:9 · 9:16 · 1:1", "Hold & auto-refund"],
    featured: true,
  },
  {
    name: "Generate gambar",
    model: "Flux Image",
    tokens: 2,
    capacity: "2.000 gambar",
    features: ["1k / 2k", "4 rasio aspek", "Character anchor"],
    featured: false,
  },
];

export function Pricing() {
  return (
    <section id="harga" className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <span className="mono-label text-accent-strong">Token</span>
          <h2 className="display mt-3 text-[clamp(2.4rem,4.6vw,4rem)] text-ink">
            Bayar sesuai render, bukan langganan.
          </h2>
        </div>
        <p className="max-w-sm text-sm leading-relaxed text-muted">
          Setiap model punya tarif token yang jelas. Estimasi tampil sebelum render, dan token
          dikembalikan penuh jika provider gagal.
        </p>
      </div>

      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        {PLANS.map((plan) => (
          <article
            key={plan.name}
            className={`relative flex flex-col overflow-hidden rounded-[1.75rem] border p-6 shadow-card ${
              plan.featured
                ? "border-ink bg-ink text-canvas"
                : "border-border bg-white text-ink"
            }`}
          >
            {plan.featured ? (
              <span className="absolute right-5 top-5 rounded-full bg-accent px-2.5 py-1 text-[10px] font-medium text-white">
                Paling sering dipakai
              </span>
            ) : null}

            <p
              className={`mono-label ${plan.featured ? "text-canvas/50" : "text-muted"}`}
            >
              {plan.model}
            </p>
            <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em]">{plan.name}</h3>

            <div className="mt-6 flex items-end gap-2">
              <span className="display text-5xl">{formatTokens(plan.tokens)}</span>
              <span className={`pb-1 text-sm ${plan.featured ? "text-canvas/60" : "text-muted"}`}>
                token
              </span>
            </div>
            <p className={`mt-1 text-sm ${plan.featured ? "text-canvas/60" : "text-muted"}`}>
              {formatRupiahFromTokens(plan.tokens, TOKEN_VALUE_RUPIAH)} per render
            </p>

            <ul className="mt-6 flex flex-col gap-2.5">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <span
                    className={`flex size-4 items-center justify-center rounded-full ${
                      plan.featured ? "bg-accent/20 text-accent" : "bg-accent-3-soft text-[#3f6212]"
                    }`}
                  >
                    <Check className="size-2.5" aria-hidden />
                  </span>
                  <span className={plan.featured ? "text-canvas/75" : "text-ink/70"}>
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            <div
              className={`mt-6 flex items-center justify-between border-t pt-4 text-xs ${
                plan.featured ? "border-white/10 text-canvas/50" : "border-border text-muted"
              }`}
            >
              <span>Dari 4.000 token</span>
              <span className={plan.featured ? "text-canvas" : "text-ink"}>{plan.capacity}</span>
            </div>

            <Link
              href="/login"
              className={`mt-5 inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${
                plan.featured
                  ? "bg-accent text-white hover:bg-accent-strong"
                  : "bg-ink text-canvas hover:bg-ink-soft"
              }`}
            >
              Mulai dengan model ini
              <ArrowUpRight className="size-3.5" aria-hidden />
            </Link>
          </article>
        ))}
      </div>

      <div className="mt-4 flex flex-col items-start justify-between gap-4 rounded-[1.75rem] border border-border bg-accent-soft/60 px-6 py-5 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-accent-strong">
            <Sparkles className="size-4" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-medium text-ink">
              1 Token = Rp 500 · Top-up Rp 2.000.000 = 4.000 Token
            </p>
            <p className="mt-1 text-xs text-muted">
              Termasuk bonus 250× Plan Mode gratis. Setelah itu 1 Token per plan atau reprompt.
            </p>
          </div>
        </div>
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink transition-colors hover:text-accent-strong"
        >
          Masuk untuk melihat saldo
          <ArrowUpRight className="size-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
