import type { AiModel, PlanBlueprint } from "./types";

export interface PlanInput {
  rawPrompt: string;
  model: AiModel;
  durationSec?: number;
  resolution: string;
  aspectRatio: string;
  hasReference: boolean;
}

const NEGATIVE_PROMPT =
  "blurry, low resolution, distorted anatomy, extra fingers, warped faces, text artifacts, watermark, logo, oversaturated skin, plastic texture, flickering, jump cuts, inconsistent lighting";

function cleanPrompt(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function buildPlanBlueprint(input: PlanInput): PlanBlueprint {
  const subject = cleanPrompt(input.rawPrompt);
  const isVideo = input.model.mediaType === "VIDEO";
  const duration = isVideo && input.durationSec ? `${input.durationSec} seconds` : null;
  const reference = input.hasReference
    ? "Use the attached reference image as the visual anchor for subject identity, wardrobe, and set design."
    : "No reference image attached; keep the subject description internally consistent.";

  const technical = [
    isVideo ? `Duration: ${duration}.` : null,
    `Resolution: ${input.resolution}.`,
    `Aspect ratio: ${input.aspectRatio}.`,
    `Model: ${input.model.displayName}.`,
  ]
    .filter(Boolean)
    .join(" ");

  const prompt = [
    `[SUBJECT] ${subject}`,
    isVideo
      ? "[CAMERA] Controlled cinematic movement, 35mm lens, shallow depth of field, natural motion blur, stable framing."
      : "[COMPOSITION] Editorial composition, clear focal hierarchy, generous negative space, precise subject placement.",
    "[LIGHT] Motivated practical light with soft falloff, gentle rim separation, controlled contrast.",
    "[PALETTE] Cohesive warm-neutral palette with one deliberate accent color; avoid oversaturation.",
    isVideo
      ? "[MOTION] Slow, intentional movement. No sudden cuts. Preserve continuity across the full duration."
      : "[DETAIL] High micro-texture, realistic materials, clean edges, no artificial gloss.",
    `[REFERENCE] ${reference}`,
    `[OUTPUT] ${technical}`,
  ].join("\n");

  const direction = isVideo
    ? `Plan sinematik ${duration ?? ""} dengan gerak kamera terkendali. Fokus pada satu aksi utama, kontinuitas cahaya, dan tekstur material. ${reference}`
    : `Plan still image ${input.resolution} dengan komposisi editorial. Fokus pada hierarki visual, material, dan konsistensi warna. ${reference}`;

  return {
    prompt,
    direction,
    negativePrompt: NEGATIVE_PROMPT,
  };
}
