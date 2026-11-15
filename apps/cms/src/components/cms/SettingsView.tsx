"use client";

import { CheckCircle2, MessageCircle, Phone, Save, Settings } from "lucide-react";
import { useEffect, useState } from "react";

import {
  normalizeWhatsAppNumber,
  whatsappLink,
} from "@rupakarsa/shared/lib/contact-settings-cookie";
import { useContactStore } from "@rupakarsa/shared/stores/contact-store";
import { useUiStore } from "@rupakarsa/shared/stores/ui-store";
import { Button, Field, TextInput } from "@rupakarsa/shared/ui";

export function SettingsView() {
  const hydrated = useContactStore((state) => state.hydrated);
  const hydrate = useContactStore((state) => state.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!hydrated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <span className="size-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return <SettingsForm />;
}

function SettingsForm() {
  const contact = useContactStore((state) => state.contact);
  const save = useContactStore((state) => state.save);
  const pushToast = useUiStore((state) => state.pushToast);

  const [name, setName] = useState(contact.name);
  const [whatsapp, setWhatsapp] = useState(contact.whatsapp);
  const [email, setEmail] = useState(contact.email);

  const normalized = normalizeWhatsAppNumber(whatsapp);
  const previewLink = normalized
    ? whatsappLink(normalized, "Halo, saya ingin mengajukan akses Rupakarsa.")
    : null;

  function handleSave(): void {
    if (name.trim().length < 2) {
      pushToast("error", "Nama admin minimal 2 karakter.");
      return;
    }
    if (normalized.length < 8 || normalized.length > 15) {
      pushToast("error", "Nomor WhatsApp harus 8–15 digit, contoh 6281234567890.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      pushToast("error", "Format email admin tidak valid.");
      return;
    }

    save({
      name: name.trim(),
      whatsapp: normalized,
      email: email.trim().toLowerCase(),
    });
    pushToast("success", "Kontak admin disimpan. Halaman request akses langsung memakai nomor ini.");
  }

  return (
    <div className="animate-fade-up">
      <header>
        <span className="mono-label text-accent-strong">Konfigurasi</span>
        <h1 className="display mt-2 text-[clamp(2.2rem,4vw,3.4rem)] text-ink">Settings</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          Atur kontak admin yang dihubungi calon tenant dari tombol “Butuh akses?” di halaman
          login Creator.
        </p>
      </header>

      <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-accent/20 bg-accent-soft/50 px-4 py-3.5">
        <MessageCircle className="mt-0.5 size-4 shrink-0 text-accent-strong" aria-hidden />
        <p className="text-xs leading-relaxed text-ink/70">
          <span className="font-medium text-ink">Nomor WhatsApp admin dipakai untuk request akses.</span>{" "}
          Gunakan format internasional tanpa tanda plus, misalnya{" "}
          <span className="font-mono text-ink">6281234567890</span>.
        </p>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="card p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-canvas-2 text-ink">
              <Phone className="size-4" aria-hidden />
            </span>
            <div>
              <p className="mono-label text-muted">Kontak admin</p>
              <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-ink">
                Tujuan request akses
              </h2>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-4">
            <Field label="Nama admin" htmlFor="admin-name">
              <TextInput
                id="admin-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Contoh: Tim Rupakarsa"
              />
            </Field>
            <Field
              label="Nomor WhatsApp"
              htmlFor="admin-whatsapp"
              hint="Format internasional tanpa +, contoh 6281234567890."
            >
              <TextInput
                id="admin-whatsapp"
                inputMode="tel"
                value={whatsapp}
                onChange={(event) => setWhatsapp(event.target.value)}
                placeholder="6281234567890"
              />
            </Field>
            <Field label="Email admin" htmlFor="admin-email" hint="Dipakai sebagai fallback jika WhatsApp tidak tersedia.">
              <TextInput
                id="admin-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="halo@rupakarsa.id"
              />
            </Field>
          </div>

          <Button
            variant="primary"
            size="lg"
            className="mt-5 w-full"
            icon={<Save className="size-4" aria-hidden />}
            onClick={handleSave}
          >
            Simpan kontak admin
          </Button>
        </section>

        <section className="card p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-canvas-2 text-ink">
              <Settings className="size-4" aria-hidden />
            </span>
            <div>
              <p className="mono-label text-muted">Pratinjau</p>
              <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-ink">
                Tombol “Butuh akses?”
              </h2>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-border bg-surface-2/60 p-4">
            <p className="text-xs leading-relaxed text-muted">
              Calon tenant mengisi form di halaman request akses. Setelah menekan tombol kirim,
              WhatsApp akan terbuka dengan pesan yang sudah terisi.
            </p>
            <div className="mt-3 rounded-xl border border-border bg-white px-3 py-2.5">
              <p className="mono-label text-[8px] text-muted">Tujuan WhatsApp</p>
              <p className="mt-1 font-mono text-xs text-ink">
                {normalized ? `+${normalized}` : "Belum diatur"}
              </p>
            </div>
            {previewLink ? (
              <a
                href={previewLink}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-ink hover:text-accent-strong"
              >
                <MessageCircle className="size-3.5" aria-hidden />
                Buka pratinjau WhatsApp
              </a>
            ) : (
              <p className="mt-3 text-[11px] text-warning">
                Isi nomor WhatsApp agar tombol request akses dapat membuka WhatsApp.
              </p>
            )}
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-xl border border-border bg-white px-3 py-2.5 text-[10px] leading-relaxed text-muted">
            <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden />
            <p>
              Perubahan disimpan di cookie bersama, jadi halaman request akses di Creator langsung
              memakai nomor terbaru tanpa deploy ulang.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
