import { describe, expect, it } from "vitest";

import type { AiModel } from "@rupakarsa/shared/lib/types";
import { formatRupiahFromTokens, formatTokens } from "@rupakarsa/shared/lib/format";
import {
  canAfford,
  estimateTokens,
  projectedBalance,
  tokenCapacity,
} from "@rupakarsa/shared/lib/tokens";

const videoModel: AiModel = {
  id: "mdl_test_video",
  code: "wan-qwen-10s",
  displayName: "Wan Qwen 10s",
  mediaType: "VIDEO",
  providerId: "prv_test",
  allowedParams: { durations: [10], resolutions: ["1080p"], aspectRatios: ["16:9"] },
  tokenCost: 35,
  isActive: true,
};

const imageModel: AiModel = {
  ...videoModel,
  id: "mdl_test_image",
  code: "flux-image",
  displayName: "Flux Image",
  mediaType: "IMAGE",
  allowedParams: { resolutions: ["1k", "2k"], aspectRatios: ["1:1"] },
  tokenCost: 2,
};

describe("token helpers", () => {
  it("estimates model cost and render capacity", () => {
    expect(estimateTokens(videoModel)).toBe(35);
    expect(estimateTokens(imageModel)).toBe(2);
    expect(estimateTokens(null)).toBe(0);
    expect(canAfford(4000, 35)).toBe(true);
    expect(canAfford(10, 35)).toBe(false);
    expect(projectedBalance(4000, 35)).toBe(3965);
    expect(projectedBalance(10, 35)).toBe(0);
    expect(tokenCapacity(4000, 35)).toBe(114);
    expect(tokenCapacity(4000, 0)).toBe(0);
  });

  it("formats token and rupiah values", () => {
    expect(formatTokens(4000)).toBe("4.000");
    expect(formatRupiahFromTokens(35, 500)).toContain("17.500");
    expect(formatRupiahFromTokens(2, 1000)).toContain("2.000");
  });
});
