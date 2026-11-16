import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AttachmentTray } from "@/components/workspace/AttachmentTray";
import { PlanCanvas } from "@/components/workspace/PlanCanvas";
import { pickModel } from "@rupakarsa/shared/lib/models";
import type { AiModel, MediaType } from "@rupakarsa/shared/lib/types";

function model(overrides: Partial<AiModel>): AiModel {
  return {
    id: "mdl_default",
    providerId: "prv_1",
    code: "wan-qwen-10s",
    displayName: "Wan Qwen 10s",
    providerModelId: "wan-qwen-10s",
    mediaType: "VIDEO",
    inputCapabilities: ["TEXT"],
    outputCapabilities: ["VIDEO"],
    source: "SYNC",
    allowedParams: { durations: [10], resolutions: ["1080p"], aspectRatios: ["16:9"] },
    tokenCost: 35,
    isActive: true,
    isDefault: false,
    ...overrides,
  };
}

const baseProps = {
  rawPrompt: "Uap rendang",
  onRawPromptChange: vi.fn(),
  plannedPrompt: "Cinematic steam",
  onPlannedPromptChange: vi.fn(),
  direction: "",
  negativePrompt: "",
  onNegativePromptChange: vi.fn(),
  planState: "idle" as const,
  onPlan: vi.fn(),
  planCost: { tokens: 1, usesFreeQuota: false },
  freePlanRemaining: 0,
  model: model({}),
  durationSec: 10,
  resolution: "1080p",
  aspectRatio: "16:9",
  balance: 100,
  tokenValueRupiah: 500,
  onGenerate: vi.fn(),
  generating: false,
  simulateFailure: false,
  onSimulateFailureChange: vi.fn(),
  canGenerate: true,
  activeStatus: null,
  showSimulation: false,
  planMode: true,
  onPlanModeChange: vi.fn(),
  analysisText: "ANALYSED SUBJECT",
  planModelCapabilities: ["TEXT", "IMAGE", "VIDEO"] as Array<"TEXT" | "IMAGE" | "VIDEO">,
  planModelName: "Vision",
};

describe("PlanCanvas plan mode", () => {
  it("hides Buat Plan and offers Generate sekarang when plan mode is off", () => {
    render(<PlanCanvas {...baseProps} planMode={false} />);

    expect(screen.queryByText(/Buat Plan/)).toBeDisabled();
    expect(screen.getByText("Generate sekarang")).toBeInTheDocument();
    expect(screen.getByText("ANALYSED SUBJECT")).toBeInTheDocument();
  });

  it("warns about attachment types the plan model cannot read", () => {
    render(<PlanCanvas {...baseProps} planModelCapabilities={["TEXT", "IMAGE"]} />);
    expect(screen.getByText("Model plan tidak menerima VIDEO; lampiran tipe itu dinonaktifkan.")).toBeInTheDocument();
  });
});

describe("AttachmentTray capabilities", () => {
  it("never offers video input when the plan model lacks VIDEO", () => {
    const { container } = render(
      <AttachmentTray
        attachments={[]}
        onChange={vi.fn()}
        allowImage
        allowVideo={false}
        onError={vi.fn()}
      />,
    );

    const input = container.querySelector('input[type="file"]');
    expect(input?.getAttribute("accept")).toBe("image/jpeg,image/png,image/webp");
  });
});

describe("pickModel", () => {
  const models: AiModel[] = [
    model({ id: "vid_cheap", tokenCost: 18, isDefault: false }),
    model({ id: "vid_default", tokenCost: 35, isDefault: true }),
    model({ id: "img_1", mediaType: "IMAGE" as MediaType, code: "flux-image", tokenCost: 2 }),
  ];

  it("selects the default video model when the Video tab opens", () => {
    expect(pickModel(models, "VIDEO", "")?.id).toBe("vid_default");
  });

  it("honours an explicit choice and falls back per media type", () => {
    expect(pickModel(models, "VIDEO", "vid_cheap")?.id).toBe("vid_cheap");
    expect(pickModel(models, "IMAGE", "")?.id).toBe("img_1");
  });
});
