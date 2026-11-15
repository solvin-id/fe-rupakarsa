import { describe, expect, it } from "vitest";

import { buildPlanBlueprint } from "@rupakarsa/shared/lib/plan";
import { SEED_MODELS } from "@rupakarsa/shared/lib/seed";

const video = SEED_MODELS.find((model) => model.id === "mdl_wan_10");
const image = SEED_MODELS.find((model) => model.id === "mdl_flux");

if (!video || !image) throw new Error("Seed models are missing");

describe("plan blueprint", () => {
  it("builds a structured video plan with output specs", () => {
    const plan = buildPlanBlueprint({
      rawPrompt: "Mbok Srini berjalan di lorong batu.",
      model: video,
      durationSec: 10,
      resolution: "1080p",
      aspectRatio: "16:9",
      hasReference: true,
    });

    expect(plan.prompt).toContain("[SUBJECT] Mbok Srini berjalan di lorong batu.");
    expect(plan.prompt).toContain("Duration: 10 seconds.");
    expect(plan.prompt).toContain("Resolution: 1080p.");
    expect(plan.prompt).toContain("Aspect ratio: 16:9.");
    expect(plan.prompt).toContain("reference image");
    expect(plan.negativePrompt).toContain("blurry");
  });

  it("builds an image plan without a duration", () => {
    const plan = buildPlanBlueprint({
      rawPrompt: "Still life rempah.",
      model: image,
      resolution: "2k",
      aspectRatio: "4:5",
      hasReference: false,
    });

    expect(plan.prompt).toContain("[COMPOSITION]");
    expect(plan.prompt).not.toContain("Duration:");
    expect(plan.prompt).toContain("Resolution: 2k.");
  });
});
