import type { MediaType, ModelAllowedParams } from "./types";

export interface ModelTemplate {
  providerCode: string;
  code: string;
  displayName: string;
  mediaType: MediaType;
  allowedParams: ModelAllowedParams;
  tokenCost: number;
}

export const MODEL_TEMPLATES: ModelTemplate[] = [
  {
    providerCode: "HIGGSFIELD",
    code: "wan-qwen-10s",
    displayName: "Wan Qwen 10s",
    mediaType: "VIDEO",
    allowedParams: {
      durations: [10],
      resolutions: ["720p", "1080p"],
      aspectRatios: ["16:9", "9:16", "1:1"],
    },
    tokenCost: 35,
  },
  {
    providerCode: "HIGGSFIELD",
    code: "wan-qwen-5s",
    displayName: "Wan Qwen 5s",
    mediaType: "VIDEO",
    allowedParams: {
      durations: [5],
      resolutions: ["720p", "1080p"],
      aspectRatios: ["16:9", "9:16", "1:1"],
    },
    tokenCost: 18,
  },
  {
    providerCode: "HIGGSFIELD",
    code: "flux-image",
    displayName: "Flux Image",
    mediaType: "IMAGE",
    allowedParams: {
      resolutions: ["1k", "2k"],
      aspectRatios: ["1:1", "4:5", "16:9", "9:16"],
    },
    tokenCost: 2,
  },
  {
    providerCode: "HIGGSFIELD",
    code: "kling-2.6-pro",
    displayName: "Kling 2.6 Pro",
    mediaType: "VIDEO",
    allowedParams: {
      durations: [5, 10],
      resolutions: ["auto"],
      aspectRatios: ["16:9", "9:16", "1:1"],
    },
    tokenCost: 42,
  },
  {
    providerCode: "HIGGSFIELD",
    code: "kling-2.5-turbo-standard",
    displayName: "Kling 2.5",
    mediaType: "VIDEO",
    allowedParams: {
      durations: [5, 10],
      resolutions: ["auto"],
      aspectRatios: ["16:9", "9:16", "1:1"],
    },
    tokenCost: 30,
  },
  {
    providerCode: "HIGGSFIELD",
    code: "minimax-hailuo-2.3",
    displayName: "MiniMax Hailuo 2.3",
    mediaType: "VIDEO",
    allowedParams: {
      durations: [6, 10],
      resolutions: ["768p"],
      aspectRatios: ["16:9", "9:16", "1:1"],
    },
    tokenCost: 25,
  },
  {
    providerCode: "HIGGSFIELD",
    code: "minimax-h3",
    displayName: "MiniMax H3",
    mediaType: "VIDEO",
    allowedParams: {
      durations: [5, 10, 15],
      resolutions: ["2K"],
      aspectRatios: ["auto", "adaptive", "21:9", "16:9", "4:3", "1:1", "3:4", "9:16"],
    },
    tokenCost: 40,
  },
  {
    providerCode: "HIGGSFIELD",
    code: "wan-3.0-prime",
    displayName: "Wan 3.0 Prime",
    mediaType: "VIDEO",
    allowedParams: {
      durations: [5, 10, 15, 20, 25, 30],
      resolutions: ["480p", "720p", "1080p"],
      aspectRatios: ["adaptive", "16:9", "4:3", "1:1", "3:4", "9:16"],
    },
    tokenCost: 30,
  },
  {
    providerCode: "HIGGSFIELD",
    code: "marketing-studio-image",
    displayName: "Marketing Studio Image",
    mediaType: "IMAGE",
    allowedParams: {
      resolutions: ["1k", "2k", "4k"],
      aspectRatios: ["1:1", "4:5", "9:16", "16:9", "3:4", "2:3", "3:2", "4:3", "21:9"],
    },
    tokenCost: 2,
  },
];

export function templatesForProvider(providerCode: string): ModelTemplate[] {
  return MODEL_TEMPLATES.filter((template) => template.providerCode === providerCode);
}
