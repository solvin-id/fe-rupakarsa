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
  referenceImageUrl: null,
  selectedParams: { durationSec: 10, resolution: "1080p", aspectRatio: "16:9" },
  tokensCharged: 35,
  status: "COMPLETED",
  externalJobId: "stub_1234abcd",
  outputUrl: "https://api.test/media/generations/a.svg",
  errorMessage: null,
  refunded: false,
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
  it("renders the rendered poster when the output URL exists", () => {
    renderCard({});
    expect(screen.getByAltText("Wan Qwen 10s")).toHaveAttribute(
      "src",
      "https://api.test/media/generations/a.svg",
    );
  });

  it("falls back to gradient art when there is no output URL", () => {
    renderCard({ outputUrl: null });
    expect(screen.queryByAltText("Wan Qwen 10s")).toBeNull();
  });
});
