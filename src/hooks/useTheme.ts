import { useCallback, useEffect, useMemo, useState } from "react";
import type { ThemeName, ThemePalette } from "../types/pokemon";

const STORAGE_KEY = "pokedex:theme";

/** Paletas em JS espelham as vars do CSS; o fundo 3D precisa das cores em hex. */
export const THEMES: Record<ThemeName, ThemePalette> = {
  gengar: {
    name: "gengar",
    label: "Gengar",
    gradient: ["#1A0526", "#2D0B3D", "#12031B"],
    surface: "#6A0DAD",
    border: "#7D78A3",
    accent: "#C31C41",
    accentHover: "#E23A5D",
    highlight: "#A29CBB",
    textPrimary: "#F5EDFA",
    textSecondary: "#A29CBB",
  },
  mewtwo: {
    name: "mewtwo",
    label: "Mewtwo",
    gradient: ["#F5EDFA", "#ECD8F5", "#DFC0EC"],
    surface: "#C9A7C7",
    border: "#835271",
    accent: "#6B4DBB",
    accentHover: "#8367D1",
    highlight: "#F5EDFA",
    textPrimary: "#4E3E50",
    textSecondary: "#835271",
  },
};

function getInitialTheme(): ThemeName {
  if (typeof window === "undefined") return "gengar";

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "gengar" || stored === "mewtwo") return stored;
  } catch {
    /* Theme still works when browser storage is unavailable. */
  }

  // Sem preferência salva, seguimos o tema claro/escuro do sistema.
  const prefersLight = window.matchMedia?.(
    "(prefers-color-scheme: light)",
  ).matches;
  return prefersLight ? "mewtwo" : "gengar";
}

/** Troca data-theme no <html>; os componentes CSS repintam sem estado extra. */
export function useTheme() {
  const [theme, setTheme] = useState<ThemeName>(getInitialTheme);
  const [themeError, setThemeError] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
      setThemeError(null);
    } catch {
      setThemeError(
        "O tema foi aplicado, mas não pôde ser salvo neste navegador.",
      );
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === "gengar" ? "mewtwo" : "gengar"));
  }, []);

  // Mesma referência evita reiniciar efeitos do ThreeBackground a cada render.
  const palette = useMemo(() => THEMES[theme], [theme]);

  return { theme, setTheme, toggleTheme, palette, themeError };
}
