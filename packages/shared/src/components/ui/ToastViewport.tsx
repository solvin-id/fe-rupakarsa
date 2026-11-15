"use client";

import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { useEffect } from "react";

import { useUiStore, type ToastKind } from "../../stores/ui-store";

const KIND_STYLES: Record<ToastKind, { className: string; icon: React.ReactNode }> = {
  info: {
    className: "border-border bg-surface text-ink",
    icon: <Info className="size-4 text-accent" aria-hidden />,
  },
  success: {
    className: "border-success/25 bg-[#eefaf4] text-success",
    icon: <CheckCircle2 className="size-4" aria-hidden />,
  },
  error: {
    className: "border-danger/25 bg-[#fdf0ed] text-danger",
    icon: <XCircle className="size-4" aria-hidden />,
  },
};

const AUTO_DISMISS_MS = 6000;

function ToastItem({ id, kind, message }: { id: string; kind: ToastKind; message: string }) {
  const dismissToast = useUiStore((state) => state.dismissToast);
  const style = KIND_STYLES[kind];

  useEffect(() => {
    const timer = setTimeout(() => dismissToast(id), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [id, dismissToast]);

  return (
    <div
      role="status"
      className={`pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm shadow-[0_18px_40px_-24px_rgba(20,19,17,0.4)] ${style.className}`}
    >
      <span className="mt-0.5 shrink-0">{style.icon}</span>
      <span className="flex-1 leading-relaxed">{message}</span>
      <button
        type="button"
        onClick={() => dismissToast(id)}
        aria-label="Tutup notifikasi"
        className="rounded-full p-1 text-current/60 transition-colors hover:bg-black/5 hover:text-current"
      >
        <X className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}

export function ToastViewport() {
  const toasts = useUiStore((state) => state.toasts);
  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} {...toast} />
      ))}
    </div>
  );
}
