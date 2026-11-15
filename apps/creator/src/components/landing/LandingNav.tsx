"use client";

import { ArrowUpRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Logo } from "@rupakarsa/shared/brand";
import { Button } from "@rupakarsa/shared/ui";

const LINKS = [
  { href: "#produk", label: "Produk" },
  { href: "#alur", label: "Alur" },
  { href: "#showcase", label: "Showcase" },
  { href: "#harga", label: "Harga" },
];

export function LandingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-canvas/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex" aria-label="Navigasi utama">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full px-3.5 py-2 text-sm text-muted transition-colors hover:bg-ink/5 hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Masuk
            </Button>
          </Link>
          <Link href="/login">
            <Button
              variant="primary"
              size="sm"
              icon={<ArrowUpRight className="size-3.5" aria-hidden />}
            >
              Mulai produksi
            </Button>
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? "Tutup menu" : "Buka menu"}
          aria-expanded={open}
          className="flex size-10 items-center justify-center rounded-full border border-border bg-white/60 text-ink md:hidden"
        >
          {open ? <X className="size-4" aria-hidden /> : <Menu className="size-4" aria-hidden />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-border bg-canvas px-5 pb-5 pt-3 md:hidden">
          <nav className="flex flex-col" aria-label="Navigasi mobile">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="border-b border-border/60 py-3 text-sm text-ink"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-2">
            <Link href="/login" onClick={() => setOpen(false)}>
              <Button variant="secondary" className="w-full">
                Masuk
              </Button>
            </Link>
            <Link href="/login" onClick={() => setOpen(false)}>
              <Button variant="primary" className="w-full">
                Mulai produksi
              </Button>
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
