import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export type PopButtonVariant = "surface" | "accent";
export type PopButtonSize = "icon" | "md";

interface PopButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: PopButtonVariant;
  size?: PopButtonSize;
}

const VARIANT_CLASSES: Record<PopButtonVariant, string> = {
  surface:
    "border border-border/50 bg-surface/40 text-text-primary hover:bg-accent hover:text-white disabled:hover:bg-surface/40 disabled:hover:text-text-primary",
  accent: "border border-accent-hover bg-accent text-white shadow-md shadow-accent/30",
};

const SIZE_CLASSES: Record<PopButtonSize, string> = {
  icon: "h-9 w-9 text-sm",
  md: "h-9 px-4 text-sm",
};

/**
 * Tactile "press-in" button adapted from Spell UI's Pop Button
 * (https://spell.sh/docs/components/pop-button). Spell UI's original ships
 * a skeuomorphic bordered look with a fixed rainbow of Tailwind colors; here
 * only the interaction — a quick vertical squish on `:active` — is kept, and
 * the surface is recolored to this project's `--color-*` theme tokens so it
 * matches the glass/pill look used everywhere else instead of clashing.
 */
export function PopButton({
  variant = "surface",
  size = "icon",
  className,
  disabled,
  ...props
}: PopButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        "inline-flex origin-bottom select-none items-center justify-center rounded-full font-semibold transition-all duration-150 ease-out",
        "active:scale-y-90 active:translate-y-px",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-30 disabled:active:scale-y-100 disabled:active:translate-y-0",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      )}
      {...props}
    />
  );
}
