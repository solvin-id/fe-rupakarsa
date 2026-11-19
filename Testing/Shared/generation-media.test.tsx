import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GenerationMediaPreview } from "@/components/workspace/GenerationMediaPreview";

describe("GenerationMediaPreview", () => {
  it("renders a metadata-only video for a card, seeked to its first frame", () => {
    const { container } = render(
      <GenerationMediaPreview
        url="https://api.test/media/workspaces/w/generations/g1.mp4"
        mediaType="VIDEO"
        mime="video/mp4"
        label="Wan Qwen 10s"
      />,
    );

    const video = container.querySelector("video");
    expect(video).not.toBeNull();
    expect(video).toHaveAttribute(
      "src",
      "https://api.test/media/workspaces/w/generations/g1.mp4#t=0.1",
    );
    expect(video).toHaveAttribute("preload", "metadata");
    expect(video?.getAttribute("controls")).toBeNull();
    expect(container.querySelector("img")).toBeNull();
  });

  it("preloads the whole clip in the dialog and exposes a buffer bar", () => {
    const { container } = render(
      <GenerationMediaPreview
        url="https://api.test/media/a.mp4"
        mediaType="VIDEO"
        mime="video/mp4"
        label="Detail"
        controls
      />,
    );

    const video = container.querySelector("video");
    expect(video).toHaveAttribute("controls");
    expect(video).toHaveAttribute("preload", "auto");
    // A fragment on the URL would stop Chrome from buffering and seeking.
    expect(video).toHaveAttribute("src", "https://api.test/media/a.mp4");
    expect(screen.getByTestId("video-buffer")).toBeInTheDocument();
  });

  it("clips the buffer bar inside the rounded frame", () => {
    render(
      <GenerationMediaPreview
        url="https://api.test/media/a.mp4"
        mediaType="VIDEO"
        mime="video/mp4"
        label="Detail"
        controls
        frameClassName="aspect-video w-full rounded-2xl"
      />,
    );

    const frame = screen.getByTestId("video-buffer").closest(".rounded-2xl");
    expect(frame).not.toBeNull();
    expect(frame?.querySelector("video")).not.toBeNull();
  });

  it("delays the loading overlay and never shows it for cached media", () => {
    vi.useFakeTimers();
    try {
      const { container } = render(
        <GenerationMediaPreview
          url="https://api.test/media/a.mp4"
          mediaType="VIDEO"
          mime="video/mp4"
          label="Detail"
          controls
        />,
      );

      expect(screen.queryByText(/Memuat video/)).toBeNull();
      act(() => {
        vi.advanceTimersByTime(400);
      });
      expect(screen.getByText(/Memuat video/)).toBeInTheDocument();

      const video = container.querySelector("video");
      expect(video).not.toBeNull();
      act(() => {
        fireEvent.loadedData(video as HTMLVideoElement);
      });
      expect(screen.queryByText(/Memuat video/)).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("keeps the overlay hidden when a cached clip is ready before the delay", () => {
    vi.useFakeTimers();
    try {
      const { container } = render(
        <GenerationMediaPreview
          url="https://api.test/media/a.mp4"
          mediaType="VIDEO"
          mime="video/mp4"
          label="Detail"
          controls
        />,
      );

      const video = container.querySelector("video");
      act(() => {
        fireEvent.loadedData(video as HTMLVideoElement);
      });
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      expect(screen.queryByText(/Memuat video/)).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("renders a simulation poster as an image, never as a broken video", () => {
    const { container } = render(
      <GenerationMediaPreview
        url="https://api.test/media/a.svg"
        mediaType="VIDEO"
        mime="image/svg+xml"
        label="Poster"
      />,
    );

    expect(container.querySelector("video")).toBeNull();
    expect(screen.getByAltText("Poster")).toHaveAttribute("src", "https://api.test/media/a.svg");
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

  it("replaces a broken image with a labelled placeholder", () => {
    render(
      <GenerationMediaPreview
        url="https://api.test/media/missing.png"
        mediaType="IMAGE"
        mime="image/png"
        label="Flux"
      />,
    );

    fireEvent.error(screen.getByAltText("Flux"));
    expect(screen.getByRole("img", { name: "Flux" })).toHaveTextContent("Pratinjau tidak tersedia");
  });
});
