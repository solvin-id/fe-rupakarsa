import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "../../lib/utils/cn";

type ButtonVariant = "primary" | "dark" | "secondary" | "ghost" | "danger" | "soft";
type ButtonSize = "sm" | "md" | "lg";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-accent-strong text-white shadow-[0_14px_30px_-16px_rgba(217,62,20,0.9)] hover:bg-accent hover:shadow-[0_18px_36px_-16px_rgba(240,78,35,0.9)]",
  dark: "bg-ink text-canvas hover:bg-ink-soft",
  secondary:
    "border border-border-strong bg-white/70 text-ink hover:border-ink/40 hover:bg-white",
  ghost: "bg-transparent text-muted hover:bg-ink/5 hover:text-ink",
  danger: "border border-danger/25 bg-danger/10 text-danger hover:bg-danger/15",
  soft: "bg-accent-soft text-accent-strong hover:bg-[#ffd4c2]",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-8 px-3.5 text-xs",
  md: "h-10 px-4.5 text-sm",
  lg: "h-12 px-6 text-[15px]",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
}

export function Button({
  variant = "secondary",
  size = "md",
  loading = false,
  icon,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-[-0.01em] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-45",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      )}
    >
      {loading ? (
        <span
          aria-hidden
          className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      ) : (
        icon
      )}
      {children}
    </button>
  );
}
