import type { AiModel, MediaType } from "./types";

/**
 * Model selection for the studio: an explicit choice wins, then the workspace default for that
 * media type, then the cheapest active model (the API already orders by token cost).
 */
export function pickModel(models: AiModel[], mediaType: MediaType, modelId: string): AiModel | null {
  const active = models.filter((item) => item.isActive && item.mediaType === mediaType);
  return (
    active.find((item) => item.id === modelId) ??
    active.find((item) => item.isDefault) ??
    active[0] ??
    null
  );
}
