"use client";

import { create } from "zustand";

export type ToastKind = "info" | "success" | "error";

export interface Toast {
  id: string;
  kind: ToastKind;
  message: string;
}

interface UiState {
  toasts: Toast[];
  pushToast: (kind: ToastKind, message: string) => void;
  dismissToast: (id: string) => void;
}

export const useUiStore = create<UiState>()((set) => ({
  toasts: [],
  pushToast: (kind, message) =>
    set((state) => ({
      toasts: [...state.toasts, { id: crypto.randomUUID(), kind, message }].slice(-4),
    })),
  dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
