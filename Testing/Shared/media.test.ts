import { describe, expect, it } from "vitest";

import { isVideoUrl } from "@rupakarsa/shared/lib/media";

describe("isVideoUrl", () => {
  it("detects rendered video output", () => {
    expect(isVideoUrl("http://localhost:8787/media/generations/a.mp4")).toBe(true);
    expect(isVideoUrl("https://cdn.test/media/a.webm")).toBe(true);
    expect(isVideoUrl("https://cdn.test/media/a.mp4?download=1")).toBe(true);
  });

  it("treats images as stills", () => {
    expect(isVideoUrl("http://localhost:8787/media/generations/a.svg")).toBe(false);
    expect(isVideoUrl("https://cdn.test/media/a.png")).toBe(false);
  });
});
