export function isVideoUrl(url: string): boolean {
  const path = url.split("?")[0] ?? url;
  return path.endsWith(".mp4") || path.endsWith(".webm");
}
