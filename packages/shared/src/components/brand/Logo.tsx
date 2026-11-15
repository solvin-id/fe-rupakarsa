import Link from "next/link";
import { Play } from "lucide-react";

import { cn } from "../../lib/utils/cn";

export function Logo({
  className,
  dark = false,
  href = "/",
  onClick,
}: {
  className?: string;
  dark?: boolean;
  href?: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn("group inline-flex items-center gap-2.5", className)}
      aria-label="Rupakarsa — beranda"
    >
      <span className="relative flex size-9 items-center justify-center">
        <span className="absolute inset-0 translate-x-1 translate-y-1 rounded-full bg-accent transition-transform duration-300 group-hover:translate-x-1.5 group-hover:translate-y-1.5" />
        <span
          className={cn(
            "relative flex size-9 items-center justify-center rounded-full",
            dark ? "bg-canvas text-ink" : "bg-ink text-canvas",
          )}
        >
          <Play className="size-3.5 fill-current" aria-hidden />
        </span>
      </span>
      <span
        className={cn(
          "text-[17px] font-semibold tracking-[-0.045em]",
          dark ? "text-canvas" : "text-ink",
        )}
      >
        rupakarsa<span className="text-accent">.</span>
      </span>
    </Link>
  );
}
