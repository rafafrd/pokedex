/** @type {import('tailwindcss').Config} */

// CSS variables hold "R G B" triples (see src/index.css) instead of hex so
// opacity modifiers work: `bg-surface/40` needs to compile down to
// `rgb(var(--color-surface) / 0.4)`, which Tailwind can only generate for a
// color when it's expressed as this kind of function — a plain
// `"var(--color-surface)"` string silently drops any `/NN` modifier applied
// to it (the whole utility fails to build, and everything relying on it
// falls back to the browser's default light UI, which is exactly the "bar
// stays light in dark mode" bug this fixes).
function withOpacity(variable) {
  return ({ opacityValue }) =>
    opacityValue === undefined
      ? `rgb(var(${variable}))`
      : `rgb(var(${variable}) / ${opacityValue})`;
}

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: ["class"],
  theme: {
    extend: {
      colors: {
        // Theme-aware tokens driven by CSS variables (see src/index.css).
        // Values swap automatically when data-theme="gengar" | "mewtwo".
        bg1: withOpacity("--color-bg-1"),
        bg2: withOpacity("--color-bg-2"),
        bg3: withOpacity("--color-bg-3"),
        surface: withOpacity("--color-surface"),
        border: withOpacity("--color-border"),
        accent: withOpacity("--color-accent"),
        "accent-hover": withOpacity("--color-accent-hover"),
        highlight: withOpacity("--color-highlight"),
        "text-primary": withOpacity("--color-text-primary"),
        "text-secondary": withOpacity("--color-text-secondary"),
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      animation: {
        smoothGradient: "smoothGradient 25s ease infinite",
        shimmer: "shimmer 1.6s ease-in-out infinite",
        floatSlow: "floatSlow 6s ease-in-out infinite",
        // Marching-ants dash used by the Flow Button (spell-ui) outline.
        flowDash: "flowDash 1s linear infinite",
      },
      keyframes: {
        smoothGradient: {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
        floatSlow: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        flowDash: {
          to: { strokeDashoffset: "-10" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
