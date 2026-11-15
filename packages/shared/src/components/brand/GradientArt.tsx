import { cn } from "../../lib/utils/cn";

export type GradientVariant =
  | "sunset"
  | "violet"
  | "lime"
  | "ocean"
  | "peach"
  | "mono"
  | "sand"
  | "night";

const VARIANTS: Record<GradientVariant, string> = {
  sunset:
    "radial-gradient(circle at 18% 18%, #ffd166 0%, transparent 42%), radial-gradient(circle at 82% 28%, #f04e23 0%, transparent 48%), radial-gradient(circle at 50% 92%, #7c2d12 0%, transparent 58%), linear-gradient(135deg, #ff9a6c 0%, #d93e14 100%)",
  violet:
    "radial-gradient(circle at 22% 20%, #e9e3ff 0%, transparent 40%), radial-gradient(circle at 78% 30%, #7c5cff 0%, transparent 52%), radial-gradient(circle at 50% 90%, #2e1065 0%, transparent 60%), linear-gradient(135deg, #b9a7ff 0%, #4c1d95 100%)",
  lime:
    "radial-gradient(circle at 20% 20%, #f4ffd6 0%, transparent 42%), radial-gradient(circle at 80% 30%, #c8f169 0%, transparent 50%), radial-gradient(circle at 50% 90%, #3f6212 0%, transparent 60%), linear-gradient(135deg, #d9ff8a 0%, #4d7c0f 100%)",
  ocean:
    "radial-gradient(circle at 20% 20%, #dbeafe 0%, transparent 40%), radial-gradient(circle at 80% 30%, #38bdf8 0%, transparent 50%), radial-gradient(circle at 50% 90%, #0c4a6e 0%, transparent 60%), linear-gradient(135deg, #7dd3fc 0%, #075985 100%)",
  peach:
    "radial-gradient(circle at 20% 20%, #fff1e6 0%, transparent 42%), radial-gradient(circle at 80% 30%, #ffb38a 0%, transparent 50%), radial-gradient(circle at 50% 90%, #9a3412 0%, transparent 60%), linear-gradient(135deg, #ffd6c2 0%, #c2410c 100%)",
  mono:
    "radial-gradient(circle at 20% 20%, #ffffff 0%, transparent 40%), radial-gradient(circle at 80% 30%, #a3a3a3 0%, transparent 50%), radial-gradient(circle at 50% 90%, #171717 0%, transparent 60%), linear-gradient(135deg, #e5e5e5 0%, #404040 100%)",
  sand:
    "radial-gradient(circle at 20% 20%, #fff7ed 0%, transparent 42%), radial-gradient(circle at 80% 30%, #d6b98c 0%, transparent 50%), radial-gradient(circle at 50% 90%, #78350f 0%, transparent 60%), linear-gradient(135deg, #f5e6cf 0%, #92400e 100%)",
  night:
    "radial-gradient(circle at 20% 20%, #c4b5fd 0%, transparent 40%), radial-gradient(circle at 80% 30%, #7c3aed 0%, transparent 50%), radial-gradient(circle at 50% 90%, #020617 0%, transparent 60%), linear-gradient(135deg, #312e81 0%, #020617 100%)",
};

export interface GradientArtProps {
  variant?: GradientVariant;
  className?: string;
  children?: React.ReactNode;
  rounded?: string;
}

export function GradientArt({
  variant = "sunset",
  className,
  children,
  rounded = "rounded-[1.4rem]",
}: GradientArtProps) {
  return (
    <div
      className={cn("relative overflow-hidden", rounded, className)}
      style={{ backgroundImage: VARIANTS[variant] }}
    >
      <div className="grain-overlay" aria-hidden />
      <div
        className="pointer-events-none absolute -left-10 top-1/3 size-32 rounded-full bg-white/20 blur-2xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-8 bottom-0 size-28 rounded-full bg-black/20 blur-2xl"
        aria-hidden
      />
      {children}
    </div>
  );
}
