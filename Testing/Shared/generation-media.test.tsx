import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GenerationMediaPreview } from "@/components/workspace/GenerationMediaPreview";

describe("GenerationMediaPreview", () => {
  it("renders a video for a video render, never a broken img", () => {
    const { container } = render(
      <GenerationMediaPreview
        url="https://api.test/media/workspaces/w/generations/g1"
        mediaType="VIDEO"
        mime="video/mp4"
        label="Wan Qwen 10s"
      />,
    );

    const video = container.querySelector("video");
    expect(video).not.toBeNull();
    expect(video).toHaveAttribute(
      "src",
      "https://api.test/media/workspaces/w/generations/g1#t=0.1",
    );
    expect(video).toHaveAttribute("preload", "metadata");
    expect(video?.getAttribute("controls")).toBeNull();
    expect(container.querySelector("img")).toBeNull();
  });

  it("adds controls only when asked, so the detail dialog can play", () => {
    const { container } = render(
      <GenerationMediaPreview
        url="https://api.test/media/a.mp4"
        mediaType="VIDEO"
        mime="video/mp4"
        label="Detail"
        controls
      />,
    );

    expect(container.querySelector("video")).toHaveAttribute("controls");
  });

  it("renders a lazy image for an image render", () => {
    const { container } = render(
      <GenerationMediaPreview
        url="https://api.test/media/a.png"
        mediaType="IMAGE"
        mime="image/png"
        label="Flux"
      />,
    );

    const img = container.querySelector("img");
    expect(img).toHaveAttribute("alt", "Flux");
    expect(img).toHaveAttribute("loading", "lazy");
    expect(container.querySelector("video")).toBeNull();
  });
});
