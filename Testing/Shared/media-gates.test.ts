import { describe, expect, it } from "vitest";

import { mediaGates } from "@rupakarsa/shared/lib/inputs";
import type { MediaCapability, PublicConfig, PublicModelRef } from "@rupakarsa/shared/lib/types";

function model(name: string, inputCapabilities: MediaCapability[]): PublicModelRef {
  return { id: name, name, inputCapabilities };
}

function config(input: {
  plan?: PublicModelRef | null;
  image?: PublicModelRef | null;
  video?: PublicModelRef | null;
}): PublicConfig {
  return {
    contact: { name: "Tim", whatsapp: "", email: "halo@rupakarsa.id" },
    pricing: {
      tokenValueRupiah: 500,
      packageTokens: 4000,
      packagePlanQuota: 250,
      planModeTokenCost: 1,
    },
    features: { simulation: true },
    planModel: input.plan ?? null,
    analysisModels: { image: input.image ?? null, video: input.video ?? null },
    defaults: { videoModelId: null },
    limits: { planPromptMaxChars: 2000, finalPromptMaxChars: 4000 },
  };
}

describe("media gates", () => {
  it("enables project-context video from the analysis model even without a plan model", () => {
    const gates = mediaGates(
      config({ plan: null, video: model("Vision Video", ["TEXT", "VIDEO"]) }),
      true,
    );

    // The regression: a configured video analysis model must be enough for context uploads.
    expect(gates.analysisVideo).toBe(true);
    expect(gates.analysisImage).toBe(false);
    // Plan mode still needs the plan model for its own attachments.
    expect(gates.attachmentVideo).toBe(false);
    expect(gates.planVideo).toBe(false);
  });

  it("gates direct-mode attachments on the analysis models", () => {
    const configured = config({
      plan: null,
      image: model("Vision Image", ["TEXT", "IMAGE"]),
      video: model("Vision Video", ["TEXT", "VIDEO"]),
    });

    const direct = mediaGates(configured, false);
    expect(direct.attachmentImage).toBe(true);
    expect(direct.attachmentVideo).toBe(true);

    const planned = mediaGates(configured, true);
    expect(planned.attachmentImage).toBe(false);
    expect(planned.attachmentVideo).toBe(false);
  });

  it("does not require the plan model to read the media types it is not given", () => {
    const gates = mediaGates(
      config({ plan: model("Planner", ["TEXT", "IMAGE"]), video: model("Vision", ["VIDEO"]) }),
      true,
    );

    expect(gates.planImage).toBe(true);
    expect(gates.planVideo).toBe(false);
    expect(gates.analysisVideo).toBe(true);
  });

  it("keeps every gate closed before the config loads", () => {
    const gates = mediaGates(undefined, false);
    expect(Object.values(gates).every((value) => value === false)).toBe(true);
  });
});
