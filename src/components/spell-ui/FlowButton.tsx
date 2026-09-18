import { useEffect, useRef, useState, type ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

type FlowButtonSize = "sm" | "md";

interface FlowButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: FlowButtonSize;
  /** CSS color for the animated dashed outline. Defaults to the theme accent. */
  borderColor?: string;
}

const SIZE_CLASSES: Record<FlowButtonSize, string> = {
  sm: "h-8 gap-1.5 px-3 text-xs",
  md: "h-9 gap-1.5 px-4 text-xs",
};

const RADIUS: Record<FlowButtonSize, number> = { sm: 16, md: 18 };

function roundedRectPath(w: number, h: number, r: number) {
  return `M${r},0.5 H${w - r} A${r},${r} 0 0 1 ${w - 0.5},${r} V${h - r} A${r},${r} 0 0 1 ${
    w - r
  },${h - 0.5} H${r} A${r},${r} 0 0 1 0.5,${h - r} V${r} A${r},${r} 0 0 1 ${r},0.5 Z`;
}

/**
 * Button whose outline flows around its edge as a marching dashed line on
 * hover. Adapted from Spell UI's Flow Button
 * (https://spell.sh/docs/components/flow-button): the SVG-overlay technique
 * is kept as-is, the base button recolored to `--color-accent` (Spell UI's
 * original relies on shadcn tokens — `bg-muted`, `text-primary` — this
 * project doesn't define), and the dash keyframes moved to
 * tailwind.config.js instead of an injected `<style>` tag per instance.
 */
export function FlowButton({
  size = "md",
  borderColor = "rgb(var(--color-accent))",
  className,
  children,
  ...props
}: FlowButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (buttonRef.current) {
      const { offsetWidth, offsetHeight } = buttonRef.current;
      setDimensions({ width: offsetWidth, height: offsetHeight });
    }
  }, [children]);

  const radius = RADIUS[size];

  return (
    <div className="group relative inline-block">
      <div
        className="pointer-events-none absolute inset-[2px] z-10 opacity-0 transition-all duration-200 ease-out group-hover:inset-0 group-hover:opacity-100"
        style={{ borderRadius: radius }}
      >
        <svg
          width={dimensions.width}
          height={dimensions.height}
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          preserveAspectRatio="none"
          aria-hidden="true"
          className="absolute left-0 top-0 h-full w-full"
        >
          <path
            d={roundedRectPath(dimensions.width, dimensions.height, radius)}
            fill="none"
            stroke={borderColor}
            strokeWidth={1}
            strokeDasharray="6,4"
            className="group-hover:animate-flowDash"
          />
        </svg>
      </div>
      <button
        ref={buttonRef}
        type="button"
        className={cn(
          "relative z-0 inline-flex items-center justify-center whitespace-nowrap rounded-full bg-accent font-semibold text-white transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-50",
          SIZE_CLASSES[size],
          className,
        )}
        {...props}
      >
        {children}
      </button>
    </div>
  );
}
