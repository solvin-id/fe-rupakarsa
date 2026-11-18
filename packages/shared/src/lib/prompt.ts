import type { AiModel } from "./types";

/**
 * Effective final-prompt ceiling, mirroring the server: a per-model limit of 0 (or none) means the
 * workspace default applies. The CMS now rejects 0, but old rows still carry it.
 */
export function effectivePromptLimit(
  model: Pick<AiModel, "maxPromptChars"> | null,
  finalPromptMaxChars: number,
): number {
  const own = model?.maxPromptChars ?? 0;
  return own > 0 ? own : finalPromptMaxChars;
}

/** Cuts at a word boundary and drops trailing punctuation, matching the server's fallback. */
export function truncateToLimit(text: string, limit: number): string {
  if (limit <= 0 || text.length <= limit) return text;
  const head = text.slice(0, limit);
  const boundary = head.lastIndexOf(" ");
  const base = (boundary > 0 ? head.slice(0, boundary) : head).trimEnd();
  return base.replace(/[,;:.\-\s]+$/, "").trimEnd();
}
