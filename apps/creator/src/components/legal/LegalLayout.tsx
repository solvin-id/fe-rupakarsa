import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Logo } from "@rupakarsa/shared/brand";

import { LegalContactLink } from "./LegalContactLink";

export interface LegalSection {
  heading: string;
  paragraphs: string[];
}

export interface LegalLayoutProps {
  title: string;
  updatedAt: string;
  sections: LegalSection[];
}

const LEGAL_LINKS = [
  { label: "Ketentuan", href: "/terms" },
  { label: "Privasi", href: "/privacy" },
  { label: "Keamanan", href: "/security" },
];

export function LegalLayout({ title, updatedAt, sections }: LegalLayoutProps) {
  return (
    <div className="relative min-h-screen bg-canvas">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Logo />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-ink"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Kembali ke beranda
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
        <span className="mono-label text-accent-strong">Legal · Rupakarsa</span>
        <h1 className="display mt-3 text-4xl text-ink sm:text-5xl">{title}</h1>
        <p className="mt-3 font-mono text-[11px] text-muted">Terakhir diperbarui: {updatedAt}</p>

        <div className="mt-10 flex flex-col gap-10">
          {sections.map((section, index) => (
            <section key={section.heading} className="flex flex-col gap-3">
              <h2 className="flex items-baseline gap-3 text-lg font-semibold tracking-[-0.02em] text-ink sm:text-xl">
                <span className="mono-label text-muted">{String(index + 1).padStart(2, "0")}</span>
                <span>{section.heading}</span>
              </h2>
              {section.paragraphs.map((paragraph, paragraphIndex) => (
                <p key={paragraphIndex} className="text-sm leading-relaxed text-ink/70">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>

        <div className="card mt-12 flex flex-col gap-2 p-5 sm:p-6">
          <p className="mono-label text-muted">Kontak</p>
          <p className="text-sm leading-relaxed text-muted">
            Pertanyaan tentang dokumen ini, permintaan hak subjek data, atau laporan kerentanan
            dapat dikirim ke <LegalContactLink />.
          </p>
        </div>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-4xl flex-col items-start justify-between gap-3 px-5 py-6 text-xs text-muted sm:flex-row sm:items-center sm:px-8">
          <p>© 2026 Rupakarsa. Seluruh hak cipta dilindungi.</p>
          <div className="flex flex-wrap items-center gap-4">
            {LEGAL_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="transition-colors hover:text-ink">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
