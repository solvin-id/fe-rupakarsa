import { LayoutGrid, ShieldCheck } from "lucide-react";

import { cn } from "../../lib/utils/cn";

export type Surface = "creator" | "cms";

export interface SurfaceSwitcherProps {
  active: Surface;
  creatorUrl: string;
  cmsUrl: string;
  canUseCms: boolean;
  dark?: boolean;
  className?: string;
}

export function SurfaceSwitcher({
  active,
  creatorUrl,
  cmsUrl,
  canUseCms,
  dark = false,
  className,
}: SurfaceSwitcherProps) {
  const container = dark
    ? "border-white/10 bg-white/[0.04]"
    : "border-border bg-white/60";
  const idle = dark
    ? "text-canvas/55 hover:bg-white/[0.06] hover:text-canvas"
    : "text-muted hover:bg-ink/5 hover:text-ink";
  const activeClass = dark ? "bg-canvas text-ink" : "bg-ink text-canvas";

  return (
    <div
      className={cn("inline-flex items-center gap-1 rounded-full border p-1", container, className)}
      aria-label="Pindah surface"
    >
      <a
        href={`${creatorUrl}/app/projects`}
        aria-current={active === "creator" ? "page" : undefined}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-medium transition-colors",
          active === "creator" ? activeClass : idle,
        )}
      >
        <LayoutGrid className="size-3.5" aria-hidden />
        Creator
      </a>

      {canUseCms ? (
        <a
          href={`${cmsUrl}/overview`}
          aria-current={active === "cms" ? "page" : undefined}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-medium transition-colors",
            active === "cms" ? activeClass : idle,
          )}
        >
          <ShieldCheck className="size-3.5" aria-hidden />
          CMS
        </a>
      ) : (
        <span
          title="Butuh akses CMS dari Superadmin"
          aria-disabled="true"
          className={cn(
            "inline-flex cursor-not-allowed items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-medium opacity-45",
            dark ? "text-canvas/60" : "text-muted",
          )}
        >
          <ShieldCheck className="size-3.5" aria-hidden />
          CMS
        </span>
      )}
    </div>
  );
}
