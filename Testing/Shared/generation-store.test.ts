import { beforeEach, describe, expect, it } from "vitest";

import type { ActiveGeneration, Generation } from "@rupakarsa/shared/lib/types";
import { useGenerationStore } from "@rupakarsa/shared/stores/generation-store";

const job: ActiveGeneration = {
  id: "00000000-0000-4000-8000-000000000401",
  folderId: "00000000-0000-4000-8000-000000000201",
  folderName: "Proyek Rendang",
  modelName: "Wan Qwen 10s",
  mediaType: "VIDEO",
  status: "RENDERING",
  startedAt: "2026-11-16T05:30:00.500Z",
  providerStatus: "rendering",
  createdAt: "2026-11-16T05:30:00.000Z",
  completedAt: null,
  tokensCharged: 35,
  errorMessage: null,
};

const finished: Generation = {
  id: job.id,
  workspaceId: "00000000-0000-4000-8000-000000000002",
  folderId: job.folderId,
  userId: "00000000-0000-4000-8000-000000000101",
  modelId: "mdl_test",
  modelName: job.modelName,
  mediaType: "VIDEO",
  rawPrompt: "Uap rendang",
  plannedPrompt: "",
  planMode: false,
  finalPrompt: "[BRIEF] Uap rendang",
  analysisSnapshot: "",
  preContextSnapshot: "",
  referenceImageUrl: null,
  sequence: 1,
  selectedParams: { durationSec: 10, resolution: "1080p", aspectRatio: "16:9" },
  tokensCharged: 35,
  status: "COMPLETED",
  externalJobId: "job-1",
  outputUrl: "https://api.test/media/generations/a.mp4",
  outputMime: "video/mp4",
  outputSize: 1024,
  outputPurgedAt: null,
  errorMessage: null,
  refunded: false,
  startedAt: job.startedAt,
  providerStatus: "done",
  promptCompressed: true,
  promptLimitChars: 120,
  estimateMs: 90_000,
  progressPercent: 100,
  createdAt: job.createdAt,
  completedAt: "2026-11-16T05:31:00.000Z",
};

describe("generation store", () => {
  beforeEach(() => {
    useGenerationStore.getState().reset();
    useGenerationStore.setState({ alerts: [], morphPulse: 0 });
  });

  it("keeps the active snapshot keyed by id", () => {
    useGenerationStore.getState().setSnapshot([job]);
    expect(Object.keys(useGenerationStore.getState().jobs)).toEqual([job.id]);
    expect(useGenerationStore.getState().jobs[job.id]?.providerStatus).toBe("rendering");
  });

  it("moves a finished job into an unread alert and drops the job", () => {
    useGenerationStore.getState().setSnapshot([job]);
    useGenerationStore.getState().finish(finished);

    const state = useGenerationStore.getState();
    expect(state.jobs[finished.id]).toBeUndefined();
    expect(state.alerts).toHaveLength(1);
    expect(state.alerts[0]).toMatchObject({
      generationId: finished.id,
      folderName: job.folderName,
      status: "COMPLETED",
      message: "Render selesai",
      read: false,
    });
  });

  it("marks every alert read", () => {
    useGenerationStore.getState().setSnapshot([job]);
    useGenerationStore.getState().finish(finished);
    useGenerationStore.getState().markAllRead();

    expect(useGenerationStore.getState().alerts.every((alert) => alert.read)).toBe(true);
  });
});
