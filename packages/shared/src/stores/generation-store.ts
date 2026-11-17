"use client";

import { create } from "zustand";

import type { ActiveGeneration, Generation } from "../lib/types";

export interface GenerationAlert {
  id: string;
  generationId: string;
  folderId: string;
  folderName: string;
  modelName: string;
  status: "COMPLETED" | "FAILED";
  message: string;
  at: string;
  read: boolean;
}

export type StreamMode = "connecting" | "live" | "polling";

interface GenerationState {
  jobs: Record<string, ActiveGeneration>;
  alerts: GenerationAlert[];
  streamMode: StreamMode;
  /** Bumped when a render should draw attention to the bell; the bell animates on each change. */
  morphPulse: number;
  setSnapshot: (jobs: ActiveGeneration[]) => void;
  finish: (generation: Generation) => void;
  markAllRead: () => void;
  pulseBell: () => void;
  setStreamMode: (mode: StreamMode) => void;
  reset: () => void;
}

const MAX_ALERTS = 20;

/** Folder names are not on a `Generation`, so an alert inherits the ones already known. */
function folderNameOf(generation: Generation, jobs: Record<string, ActiveGeneration>): string {
  const known = Object.values(jobs).find((job) => job.folderId === generation.folderId);
  return known?.folderName ?? "Proyek";
}

export const useGenerationStore = create<GenerationState>()((set) => ({
  jobs: {},
  alerts: [],
  streamMode: "connecting",
  morphPulse: 0,

  setSnapshot: (jobs) =>
    set({ jobs: Object.fromEntries(jobs.map((job) => [job.id, job])) }),

  finish: (generation) =>
    set((state) => {
      const status = generation.status === "COMPLETED" ? "COMPLETED" : "FAILED";
      const alert: GenerationAlert = {
        id: `${generation.id}:${status}`,
        generationId: generation.id,
        folderId: generation.folderId,
        folderName: folderNameOf(generation, state.jobs),
        modelName: generation.modelName,
        status,
        message:
          status === "COMPLETED" ? "Render selesai" : (generation.errorMessage ?? "Render gagal"),
        at: generation.completedAt ?? new Date().toISOString(),
        read: false,
      };
      const jobs = { ...state.jobs };
      delete jobs[generation.id];
      const alerts = [alert, ...state.alerts.filter((item) => item.id !== alert.id)].slice(
        0,
        MAX_ALERTS,
      );
      return { jobs, alerts };
    }),

  markAllRead: () =>
    set((state) => ({
      alerts: state.alerts.map((alert) => (alert.read ? alert : { ...alert, read: true })),
    })),

  pulseBell: () => set((state) => ({ morphPulse: state.morphPulse + 1 })),

  setStreamMode: (streamMode) => set({ streamMode }),

  reset: () => set({ jobs: {}, alerts: [] }),
}));
