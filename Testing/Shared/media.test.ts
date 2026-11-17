import { describe, expect, it } from "vitest";

import { isVideoMedia } from "@rupakarsa/shared/lib/media";

describe("isVideoMedia", () => {
  it("detects video by extension", () => {
    expect(isVideoMedia("http://localhost:8787/media/generations/a.mp4")).toBe(true);
    expect(isVideoMedia("https://cdn.test/media/a.webm")).toBe(true);
    expect(isVideoMedia("https://cdn.test/media/a.mov")).toBe(true);
    expect(isVideoMedia("https://cdn.test/media/a.mp4?download=1")).toBe(true);
  });

  it("detects video by mime even without a known extension", () => {
    expect(isVideoMedia("https://api.test/media/workspaces/w/generations/g1", "video/webm")).toBe(true);
  });

  it("lets an image mime win over a video-looking extension", () => {
    expect(isVideoMedia("https://api.test/media/x.mp4", "image/png")).toBe(false);
  });

  it("rejects still images", () => {
    expect(isVideoMedia("http://localhost:8787/media/generations/a.svg")).toBe(false);
    expect(isVideoMedia("https://cdn.test/media/a.png")).toBe(false);
    expect(isVideoMedia("https://cdn.test/media/a.png", null)).toBe(false);
  });
});
