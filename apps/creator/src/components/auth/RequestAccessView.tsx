"use client";

import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  MessageCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Logo } from "@rupakarsa/shared/brand";
import {
  normalizeWhatsAppNumber,
  whatsappLink,
} from "@rupakarsa/shared/lib/contact-settings-cookie";
import { useContactStore } from "@rupakarsa/shared/stores/contact-store";
import { Button, Field, TextArea, TextInput } from "@rupakarsa/shared/ui";

export function RequestAccessView() {
  const hydrated = useContactStore((state) => state.hydrated);
  const hydrate = useContactStore((state) => state.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <span className="size-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return <RequestForm />;
}

function RequestForm() {
  const contact = useContactStore((state) => state.contact);

  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [waUrl, setWaUrl] = useState<string | null>(null);

  const hasAdminWhatsApp = normalizeWhatsAppNumber(contact.whatsapp).length >= 8;

  function handleSubmit(event: React.FormEvent): void {
    event.preventDefault();
    setError(null);

    if (!hasAdminWhatsApp) {
      setError(
        `Nomor WhatsApp admin belum diatur. Silakan hubungi ${contact.email} untuk mengajukan akses.`,
      );
      return;
    }
    if (name.trim().length < 2) {
      setError("Nama minimal 2 karakter.");
      return;
    }
    if (company.trim().length < 2) {
      setError("Nama tenant atau perusahaan minimal 2 karakter.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Format email tidak valid.");
      return;
    }
    if (normalizeWhatsAppNumber(whatsapp).length < 8) {
      setError("Nomor WhatsApp minimal 8 digit.");
      return;
    }

    const text = [
      `Halo ${contact.name}, saya ingin mengajukan akses/kerja sama Rupakarsa.`,
      "",
      `Nama: ${name.trim()}`,
      `Tenant/Perusahaan: ${company.trim()}`,
      `Email: ${email.trim()}`,
      `WhatsApp: ${whatsapp.trim()}`,
      `Pesan: ${message.trim() || "-"}`,
    ].join("\n");

    const url = whatsappLink(contact.whatsapp, text);
    setWaUrl(url);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden bg-ink px-10 py-12 text-canvas lg:flex lg:flex-col lg:justify-between">
        <div
          className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-accent/25 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-20 size-96 rounded-full bg-accent-2/20 blur-3xl"
          aria-hidden
        />

        <div className="relative">
          <Logo dark />
        </div>

        <div className="relative max-w-lg">
          <span className="pill border-white/15 bg-white/5 text-canvas/70">
            <Sparkles className="size-3.5 text-accent" aria-hidden />
            Request access
          </span>
          <h1 className="display mt-6 text-[clamp(2.8rem,4.6vw,4.6rem)] text-canvas">
            Ajukan
            <br />
            akses <span className="serif text-accent">workspace</span>.
          </h1>
          <p className="mt-5 text-sm leading-relaxed text-canvas/60">
            Ceritakan tim dan kebutuhan produksi Anda. Tim Rupakarsa akan menghubungi Anda melalui
            WhatsApp untuk proses verifikasi dan pembuatan akun.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-3">
            {[
              { value: "1", label: "workspace" },
              { value: "Plan", label: "→ Implement" },
              { value: "Token", label: "per tenant" },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3">
                <p className="text-lg font-semibold tracking-[-0.03em] text-canvas">{item.value}</p>
                <p className="mt-0.5 text-[10px] text-canvas/50">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent">
            <ShieldCheck className="size-4" aria-hidden />
          </span>
          <p className="text-xs leading-relaxed text-canvas/60">
            Akun dibuat oleh Superadmin setelah verifikasi. Tidak ada public sign-up.
          </p>
        </div>
      </section>

      <section className="relative flex items-center justify-center px-5 py-12 sm:px-8">
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-60" aria-hidden />
        <div className="relative w-full max-w-md">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <Logo />
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-ink"
            >
              <ArrowLeft className="size-3.5" aria-hidden />
              Beranda
            </Link>
          </div>

          <div className="mb-8">
            <span className="mono-label text-accent-strong">Request access</span>
            <h2 className="display mt-3 text-4xl text-ink">Ceritakan tim Anda.</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Isi form singkat ini. Tim Rupakarsa akan menghubungi Anda melalui WhatsApp.
            </p>
          </div>

          {waUrl ? (
            <div className="card p-6 sm:p-7">
              <span className="flex size-11 items-center justify-center rounded-full bg-success/10 text-success">
                <CheckCircle2 className="size-5" aria-hidden />
              </span>
              <h3 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-ink">
                Permintaan siap dikirim.
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                WhatsApp akan terbuka dengan pesan yang sudah terisi. Jika tab WhatsApp tidak
                terbuka, gunakan tombol di bawah.
              </p>
              <a
                href={waUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent-strong px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-accent"
              >
                <MessageCircle className="size-4" aria-hidden />
                Buka WhatsApp
              </a>
              <Link
                href="/login"
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-border px-5 py-3 text-sm font-medium text-ink transition-colors hover:border-ink/30"
              >
                Kembali ke login
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="card p-6 sm:p-7">
              {!hasAdminWhatsApp ? (
                <div className="mb-4 rounded-xl border border-warning/25 bg-warning/5 px-3.5 py-2.5 text-xs leading-relaxed text-warning">
                  Nomor WhatsApp admin belum diatur. Silakan hubungi{" "}
                  <a href={`mailto:${contact.email}`} className="font-medium underline">
                    {contact.email}
                  </a>{" "}
                  untuk mengajukan akses.
                </div>
              ) : null}

              <div className="flex flex-col gap-4">
                <Field label="Nama lengkap" htmlFor="request-name">
                  <TextInput
                    id="request-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Nama Anda"
                    required
                  />
                </Field>
                <Field label="Tenant / perusahaan" htmlFor="request-company">
                  <TextInput
                    id="request-company"
                    value={company}
                    onChange={(event) => setCompany(event.target.value)}
                    placeholder="Nama tim atau perusahaan"
                    required
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Email" htmlFor="request-email">
                    <TextInput
                      id="request-email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="nama@perusahaan.com"
                      required
                    />
                  </Field>
                  <Field label="WhatsApp" htmlFor="request-whatsapp">
                    <TextInput
                      id="request-whatsapp"
                      inputMode="tel"
                      value={whatsapp}
                      onChange={(event) => setWhatsapp(event.target.value)}
                      placeholder="6281234567890"
                      required
                    />
                  </Field>
                </div>
                <Field label="Kebutuhan produksi" htmlFor="request-message" hint="Opsional.">
                  <TextArea
                    id="request-message"
                    rows={3}
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Ceritakan jenis konten, volume, dan target waktu Anda."
                  />
                </Field>
              </div>

              {error ? (
                <p className="mt-4 rounded-xl border border-danger/20 bg-danger/5 px-3.5 py-2.5 text-sm leading-relaxed text-danger">
                  {error}
                </p>
              ) : null}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="mt-5 w-full"
                disabled={!hasAdminWhatsApp}
                icon={<MessageCircle className="size-4" aria-hidden />}
              >
                Kirim via WhatsApp
              </Button>

              <p className="mt-3 text-center text-[10px] leading-relaxed text-muted">
                Dengan mengirim form, Anda setuju dihubungi tim Rupakarsa melalui WhatsApp atau
                email.
              </p>
            </form>
          )}

          <div className="mt-6 flex items-center justify-between gap-3 text-xs text-muted">
            <Link href="/" className="inline-flex items-center gap-1.5 hover:text-ink">
              <ArrowLeft className="size-3.5" aria-hidden />
              Kembali ke beranda
            </Link>
            <Link href="/login" className="inline-flex items-center gap-1.5 hover:text-ink">
              Sudah punya akses?
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
