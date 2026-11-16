import Link from "next/link";

import { Logo } from "@rupakarsa/shared/brand";

const CMS_URL = process.env.NEXT_PUBLIC_CMS_URL ?? "http://localhost:3001";

const COLUMNS = [
  {
    title: "Produk",
    links: [
      { label: "Fitur", href: "#produk" },
      { label: "Alur produksi", href: "#alur" },
      { label: "Showcase", href: "#showcase" },
      { label: "Harga token", href: "#harga" },
    ],
  },
  {
    title: "Perusahaan",
    links: [
      { label: "Tentang", href: "#" },
      { label: "Kontak", href: "/request-access" },
      { label: "CMS", href: CMS_URL },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privasi", href: "/privacy" },
      { label: "Ketentuan", href: "/terms" },
      { label: "Keamanan", href: "/security" },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-canvas">
      <div className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              Ruang produksi visual berbasis AI untuk tim. Plan, render, dan kelola aset dalam satu
              alur yang bisa ditelusuri.
            </p>
            <p className="mt-4 font-mono text-xs text-muted">rupakarsa.id</p>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.title}>
              <p className="mono-label text-muted">{column.title}</p>
              <ul className="mt-4 flex flex-col gap-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-ink/70 transition-colors hover:text-accent-strong"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-border pt-6 text-xs text-muted sm:flex-row sm:items-center">
          <p>© 2026 Rupakarsa. Seluruh hak cipta dilindungi.</p>
          <p className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-success" aria-hidden />
            MVP · Production workspace
          </p>
        </div>
      </div>
    </footer>
  );
}
