import type { PublicConfig } from "./types";

export interface MediaGates {
  /** The plan model reads an attachment in plan mode. */
  planImage: boolean;
  planVideo: boolean;
  /** Project-context media is analysed by the analysis models, never by the plan model. */
  analysisImage: boolean;
  analysisVideo: boolean;
  /** Generator attachments: plan mode sends them to the plan model, direct mode analyses them. */
  attachmentImage: boolean;
  attachmentVideo: boolean;
}

/**
 * Which media inputs the studio may accept. Analysis is a separate service from planning, so the
 * context panel must not inherit the plan model's capabilities — wiring a video analysis model is
 * enough to upload a reference video, even when no plan model is set.
 */
export function mediaGates(config: PublicConfig | undefined, planMode: boolean): MediaGates {
  const planImage = config?.planModel?.inputCapabilities.includes("IMAGE") ?? false;
  const planVideo = config?.planModel?.inputCapabilities.includes("VIDEO") ?? false;
  const analysisImage =
    config?.analysisModels.image?.inputCapabilities.includes("IMAGE") ?? false;
  const analysisVideo =
    config?.analysisModels.video?.inputCapabilities.includes("VIDEO") ?? false;

  return {
    planImage,
    planVideo,
    analysisImage,
    analysisVideo,
    attachmentImage: planMode ? planImage : analysisImage,
    attachmentVideo: planMode ? planVideo : analysisVideo,
  };
}
