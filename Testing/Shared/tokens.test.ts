import { describe, expect, it } from "vitest";

import { formatRupiahFromTokens, formatTokens } from "@rupakarsa/shared/lib/format";
import { SEED_MODELS } from "@rupakarsa/shared/lib/seed";
import {
  canAfford,
  estimateTokens,
  planModeCost,
  projectedBalance,
  tokenCapacity,
} from "@rupakarsa/shared/lib/tokens";

const video = SEED_MODELS.find((model) => model.id === "mdl_wan_10");
const image = SEED_MODELS.find((model) => model.id === "mdl_flux");

if (!video || !image) throw new Error("Seed models are missing");

describe("token helpers", () => {
  it("uses the free plan quota before charging a token", () => {
    expect(planModeCost(250)).toEqual({ tokens: 0, usesFreeQuota: true });
    expect(planModeCost(0)).toEqual({ tokens: 1, usesFreeQuota: false });
  });

  it("estimates model cost and render capacity", () => {
    expect(estimateTokens(video)).toBe(35);
    expect(estimateTokens(image)).toBe(2);
    expect(canAfford(4000, 35)).toBe(true);
    expect(canAfford(10, 35)).toBe(false);
    expect(projectedBalance(4000, 35)).toBe(3965);
    expect(tokenCapacity(4000, 35)).toBe(114);
  });

  it("formats token and rupiah values", () => {
    expect(formatTokens(4000)).toBe("4.000");
    expect(formatRupiahFromTokens(35)).toContain("17.500");
  });
});
