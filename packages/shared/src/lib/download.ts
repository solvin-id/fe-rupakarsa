import type { Generation } from "./types";

const GRADIENTS: Record<string, [string, string, string]> = {
  sunset: ["#ffd166", "#f04e23", "#7c2d12"],
  violet: ["#e9e3ff", "#7c5cff", "#2e1065"],
  lime: ["#f4ffd6", "#c8f169", "#3f6212"],
  ocean: ["#dbeafe", "#38bdf8", "#0c4a6e"],
  peach: ["#fff1e6", "#ffb38a", "#9a3412"],
  mono: ["#ffffff", "#a3a3a3", "#171717"],
  sand: ["#fff7ed", "#d6b98c", "#78350f"],
  night: ["#c4b5fd", "#7c3aed", "#020617"],
};

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
): void {
  const words = text.split(/\s+/);
  let line = "";
  let lines = 0;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (context.measureText(test).width > maxWidth && line) {
      context.fillText(line, x, y + lines * lineHeight);
      line = word;
      lines += 1;
      if (lines >= maxLines) return;
    } else {
      line = test;
    }
  }
  if (line && lines < maxLines) {
    context.fillText(line, x, y + lines * lineHeight);
  }
}

export function downloadGenerationPoster(generation: Generation): void {
  const canvas = document.createElement("canvas");
  canvas.width = 1280;
  canvas.height = 720;
  const context = canvas.getContext("2d");
  if (!context) return;

  const key = generation.outputUrl?.replace("gradient:", "") ?? "sunset";
  const [start, middle, end] = GRADIENTS[key] ?? GRADIENTS.sunset!;
  const gradient = context.createLinearGradient(0, 0, 1280, 720);
  gradient.addColorStop(0, start);
  gradient.addColorStop(0.55, middle);
  gradient.addColorStop(1, end);
  context.fillStyle = gradient;
  context.fillRect(0, 0, 1280, 720);

  context.fillStyle = "rgba(255,255,255,0.12)";
  context.beginPath();
  context.arc(1080, 120, 220, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "rgba(0,0,0,0.12)";
  context.beginPath();
  context.arc(180, 640, 260, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "rgba(255,255,255,0.72)";
  context.font = "500 18px ui-sans-serif, system-ui, sans-serif";
  context.fillText("RUPAKARSA · FOLDER HISTORY", 72, 88);

  context.fillStyle = "#ffffff";
  context.font = "600 64px ui-sans-serif, system-ui, sans-serif";
  context.fillText(generation.modelName, 72, 190);

  context.fillStyle = "rgba(255,255,255,0.82)";
  context.font = "400 28px ui-sans-serif, system-ui, sans-serif";
  wrapText(context, generation.plannedPrompt || generation.rawPrompt, 72, 260, 900, 40, 6);

  context.fillStyle = "rgba(255,255,255,0.7)";
  context.font = "500 20px ui-monospace, monospace";
  const meta = [
    generation.mediaType === "VIDEO" ? `${generation.selectedParams.durationSec ?? "—"}s` : "IMAGE",
    generation.selectedParams.resolution,
    generation.selectedParams.aspectRatio,
    `${generation.tokensCharged} token`,
  ].join("  ·  ");
  context.fillText(meta, 72, 640);

  context.fillStyle = "rgba(255,255,255,0.55)";
  context.font = "400 16px ui-sans-serif, system-ui, sans-serif";
  context.fillText("Poster demo · file asli tersedia setelah integrasi storage", 72, 676);

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rupakarsa-${generation.id}.png`;
    link.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}
