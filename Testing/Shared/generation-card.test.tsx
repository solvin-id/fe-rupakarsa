import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GenerationCard } from "@/components/workspace/GenerationCard";
import type { Generation } from "@rupakarsa/shared/lib/types";

const baseGeneration: Generation = {
  id: "00000000-0000-4000-8000-000000000401",
  workspaceId: "00000000-0000-4000-8000-000000000002",
  folderId: "00000000-0000-4000-8000-000000000201",
  userId: "00000000-0000-4000-8000-000000000101",
  modelId: "mdl_test",
  modelName: "Wan Qwen 10s",
  mediaType: "VIDEO",
  rawPrompt: "Uap rendang",
  plannedPrompt: "[SUBJECT] Uap rendang",
  planMode: true,
  finalPrompt: "[SUBJECT] Uap rendang",
  analysisSnapshot: "",
  preContextSnapshot: "",
  referenceImageUrl: null,
  sequence: 1,
  selectedParams: { durationSec: 10, resolution: "1080p", aspectRatio: "16:9" },
  tokensCharged: 35,
  status: "COMPLETED",
  externalJobId: "stub_1234abcd",
  outputUrl: "https://api.test/media/generations/a.svg",
  outputMime: "image/svg+xml",
  outputSize: 128,
  outputPurgedAt: null,
  errorMessage: null,
  refunded: false,
  startedAt: "2026-11-16T05:30:00.500Z",
  providerStatus: "rendering",
  promptCompressed: false,
  promptLimitChars: null,
  estimateMs: 90_000,
  progressPercent: 100,
  createdAt: "2026-11-16T05:30:00.000Z",
  completedAt: "2026-11-16T05:30:02.000Z",
};

function renderCard(overrides: Partial<Generation>) {
  const generation = { ...baseGeneration, ...overrides };
  return render(
    <GenerationCard
      generation={generation}
      active={false}
      onOpen={vi.fn()}
      onDownload={vi.fn()}
      onRemix={vi.fn()}
      onDelete={vi.fn()}
    />,
  );
}

describe("GenerationCard", () => {
  it("renders a video element for a completed mp4 render instead of a broken img", () => {
    const { container } = renderCard({
      outputUrl: "https://api.test/media/generations/a.mp4",
      outputMime: "video/mp4",
    });
    const video = container.querySelector("video");
    expect(video).not.toBeNull();
    expect(video).toHaveAttribute("src", "https://api.test/media/generations/a.mp4#t=0.1");
    expect(video).toHaveAttribute("preload", "metadata");
    expect(container.querySelector("img")).toBeNull();
  });

  it("keeps an image output on img", () => {
    const { container } = renderCard({ mediaType: "IMAGE", outputMime: "image/png" });
    expect(container.querySelector("video")).toBeNull();
    expect(screen.getByAltText("Wan Qwen 10s")).toHaveAttribute(
      "src",
      "https://api.test/media/generations/a.svg",
    );
  });

  it("falls back to gradient art when there is no output URL", () => {
    renderCard({ outputUrl: null });
    expect(screen.queryByAltText("Wan Qwen 10s")).toBeNull();
    expect(screen.queryByLabelText("Wan Qwen 10s")).toBeNull();
  });

  it("hides the poster and disables download after retention purged the asset", () => {
    renderCard({ outputPurgedAt: "2026-11-26T00:00:00.000Z" });
    expect(screen.queryByLabelText("Wan Qwen 10s")).toBeNull();
    expect(screen.getByText("Aset dibersihkan")).toBeInTheDocument();
    expect(screen.getByLabelText("Unduh hasil")).toBeDisabled();
  });
});
