export type AppThemeName = "gengar" | "mewtwo";

export interface AppThemePalette {
  name: AppThemeName;
  label: string;
  background: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  text: string;
  mutedText: string;
  accent: string;
  accentContrast: string;
  heroStart: string;
  heroEnd: string;
}

export const appThemes: Record<AppThemeName, AppThemePalette> = {
  gengar: {
    name: "gengar",
    label: "Gengar",
    background: "#110A1F",
    surface: "#211136",
    surfaceMuted: "#30194C",
    border: "#54347B",
    text: "#F9F3FF",
    mutedText: "#C8B5DD",
    accent: "#A878F5",
    accentContrast: "#1A0B29",
    heroStart: "#1D0B33",
    heroEnd: "#512A7A",
  },
  mewtwo: {
    name: "mewtwo",
    label: "Mewtwo",
    background: "#FFF6FC",
    surface: "#FFFFFF",
    surfaceMuted: "#F8E7F4",
    border: "#E6C7DF",
    text: "#34213C",
    mutedText: "#76566E",
    accent: "#B9498C",
    accentContrast: "#FFFFFF",
    heroStart: "#64345C",
    heroEnd: "#C46C9D",
  },
};

export function getAppTheme(name: AppThemeName): AppThemePalette {
  return appThemes[name];
}
