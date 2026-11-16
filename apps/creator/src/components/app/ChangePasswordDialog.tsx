"use client";

import { KeyRound } from "lucide-react";
import { useState } from "react";

import { useChangePasswordMutation } from "@rupakarsa/shared/hooks/use-session";
import { useUiStore } from "@rupakarsa/shared/stores/ui-store";
import { Button, Dialog, Field, TextInput } from "@rupakarsa/shared/ui";

export interface ChangePasswordDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ChangePasswordDialog({ open, onClose }: ChangePasswordDialogProps) {
  const pushToast = useUiStore((state) => state.pushToast);
  const changePassword = useChangePasswordMutation();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  function reset(): void {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setLocalError(null);
    changePassword.reset();
  }

  function handleClose(): void {
    reset();
    onClose();
  }

  function handleSubmit(event: React.FormEvent): void {
    event.preventDefault();
    setLocalError(null);

    if (newPassword.length < 8) {
      setLocalError("Password baru minimal 8 karakter.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setLocalError("Konfirmasi password tidak sama.");
      return;
    }

    changePassword.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          pushToast("success", "Password diperbarui.");
          handleClose();
        },
        onError: (error) => {
          pushToast("error", error.message);
        },
      },
    );
  }

  const errorMessage = localError ?? (changePassword.error?.message ?? null);

  return (
    <Dialog
      open={open}
      title="Ubah password"
      description="Gunakan minimal 8 karakter. Sesi lain akan otomatis keluar."
      onClose={handleClose}
      footer={
        <>
          <Button variant="ghost" onClick={handleClose}>
            Batal
          </Button>
          <Button
            variant="dark"
            type="submit"
            form="change-password-form"
            loading={changePassword.isPending}
            icon={<KeyRound className="size-3.5" aria-hidden />}
          >
            Simpan password
          </Button>
        </>
      }
    >
      <form id="change-password-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Password saat ini" htmlFor="current-password">
          <TextInput
            id="current-password"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            required
          />
        </Field>
        <Field label="Password baru" htmlFor="new-password" hint="Minimal 8 karakter.">
          <TextInput
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            required
          />
        </Field>
        <Field label="Ulangi password baru" htmlFor="confirm-password">
          <TextInput
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />
        </Field>
        {errorMessage ? (
          <p className="rounded-xl border border-danger/20 bg-danger/5 px-3.5 py-2.5 text-sm leading-relaxed text-danger">
            {errorMessage}
          </p>
        ) : null}
      </form>
    </Dialog>
  );
}
