const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov", ".m4v"];
const UNKNOWN_MIME = "application/octet-stream";

/**
 * A specific stored mime decides: an image recorded as `image/png` stays an image even when the
 * URL ends in `.mp4`. An absent or generic mime falls back to the path extension, which is all
 * pre-mime rows and every provider URL with a signature has left.
 */
export function isVideoMedia(url: string, mime?: string | null): boolean {
  const normalized = mime?.trim().toLowerCase() ?? "";
  if (normalized.length > 0 && normalized !== UNKNOWN_MIME) return normalized.startsWith("video/");

  const path = new URL(url, "http://x").pathname.toLowerCase();
  return VIDEO_EXTENSIONS.some((extension) => path.endsWith(extension));
}
