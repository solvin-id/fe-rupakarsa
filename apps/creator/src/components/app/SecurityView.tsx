"use client";

import { KeyRound, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { useSessionQuery } from "@rupakarsa/shared/hooks/use-session";
import {
  useTotpActivateMutation,
  useTotpDisableMutation,
  useTotpEnrollMutation,
} from "@rupakarsa/shared/hooks/use-session";
import type { TotpEnrollment } from "@rupakarsa/shared/lib/types";
import { useUiStore } from "@rupakarsa/shared/stores/ui-store";
import { Button, Field, TextInput } from "@rupakarsa/shared/ui";

export function SecurityView() {
  const sessionQuery = useSessionQuery();
  const enroll = useTotpEnrollMutation();
  const activate = useTotpActivateMutation();
  const disable = useTotpDisableMutation();
  const pushToast = useUiStore((state) => state.pushToast);

  const [enrollment, setEnrollment] = useState<TotpEnrollment | null>(null);
  const [code, setCode] = useState("");
  const [disableCode, setDisableCode] = useState("");

  const user = sessionQuery.data?.user ?? null;

  const [override, setOverride] = useState<boolean | null>(null);
  const totpEnabled = override ?? user?.totpEnabled ?? false;

  function startEnroll(): void {
    enroll.mutate(undefined, {
      onSuccess: (data) => {
        setEnrollment(data);
        setCode("");
        setOverride(false);
      },
      onError: (error) => pushToast("error", error.message),
    });
  }

  function confirmActivate(): void {
    activate.mutate(code, {
      onSuccess: () => {
        setEnrollment(null);
        setCode("");
        setOverride(true);
        pushToast("success", "2FA aktif. Kode dari aplikasi authenticator diminta saat masuk.");
      },
      onError: (error) => pushToast("error", error.message),
    });
  }

  function confirmDisable(): void {
    disable.mutate(disableCode, {
      onSuccess: () => {
        setDisableCode("");
        setOverride(false);
        pushToast("success", "2FA dinonaktifkan.");
      },
      onError: (error) => pushToast("error", error.message),
    });
  }

  return (
    <div className="animate-fade-up">
      <header>
        <span className="mono-label text-accent-strong">Akun</span>
        <h1 className="display mt-2 text-[clamp(2rem,3.8vw,3.2rem)] text-ink">Keamanan</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          Dua faktor (TOTP) melindungi akun meski password bocor. Kode 6 digit dari aplikasi seperti
          Google Authenticator atau 1Password.
        </p>
      </header>

      <section className="card mt-6 max-w-xl p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="mono-label text-muted">Dua faktor</p>
            <h2 className="mt-1 flex items-center gap-2 text-lg font-semibold text-ink">
              <ShieldCheck className="size-4 text-accent" aria-hidden />
              Authenticator app
            </h2>
          </div>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
              totpEnabled ? "bg-success/10 text-success" : "bg-surface-2 text-muted"
            }`}
          >
            {totpEnabled ? "Aktif" : "Belum aktif"}
          </span>
        </div>

        {totpEnabled ? (
          <div className="mt-4 flex flex-col gap-2">
            <Field label="Kode 6 digit" hint="Konfirmasi dengan kode dari authenticator.">
              <TextInput
                value={disableCode}
                onChange={(event) => setDisableCode(event.target.value)}
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
              />
            </Field>
            <Button
              variant="danger"
              loading={disable.isPending}
              disabled={disableCode.trim().length !== 6}
              onClick={confirmDisable}
            >
              Nonaktifkan 2FA
            </Button>
          </div>
        ) : enrollment ? (
          <div className="mt-4 flex flex-col gap-3">
            <div className="flex justify-center rounded-2xl border border-border bg-white p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={enrollment.qrDataUrl} alt="QR 2FA" className="size-40" />
            </div>
            <p className="break-all rounded-xl bg-surface-2/60 p-2 font-mono text-[10px] text-muted">
              {enrollment.secret}
            </p>
            <Field label="Kode 6 digit" hint="Scan QR, lalu masukkan kode yang muncul.">
              <TextInput
                value={code}
                onChange={(event) => setCode(event.target.value)}
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
              />
            </Field>
            <Button
              variant="primary"
              loading={activate.isPending}
              disabled={code.trim().length !== 6}
              onClick={confirmActivate}
            >
              Aktifkan 2FA
            </Button>
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-2">
            <p className="text-[11px] leading-relaxed text-muted">
              Simpan kode pemulihan di tempat aman. Bila perangkat hilang, hubungi admin untuk reset.
            </p>
            <Button
              variant="secondary"
              loading={enroll.isPending}
              icon={<KeyRound className="size-3.5" aria-hidden />}
              onClick={startEnroll}
            >
              Aktifkan 2FA
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
