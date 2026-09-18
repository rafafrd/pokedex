import AsyncStorage from "expo-sqlite/kv-store";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

export type AppTheme = "gengar" | "mewtwo";

/** Alias kept for consumers that prefer the more explicit theme name. */
export type ThemeName = AppTheme;

export const DEFAULT_USER_NAME = "Treinador";
export const DEFAULT_APP_THEME: AppTheme = "gengar";

export const PREFERENCES_STORAGE_KEYS = {
  userName: "pokedex.preferences.userName",
  appTheme: "pokedex.preferences.appTheme",
} as const;

export interface PreferencesContextValue {
  userName: string;
  appTheme: AppTheme;
  setUserName: (userName: string) => Promise<void>;
  setAppTheme: (appTheme: AppTheme) => Promise<void>;
  isHydrated: boolean;
  /** The most recent hydration error, if one occurred. */
  loadError: string | null;
  /** The most recent persistence error, if one occurred. */
  saveError: string | null;
  /** Combined error for consumers that do not need to distinguish its source. */
  error: string | null;
}

export const PreferencesContext = createContext<PreferencesContextValue | undefined>(
  undefined,
);

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  return fallback;
}

function readStoredUserName(value: string | null): string {
  const trimmed = value?.trim() ?? "";
  return trimmed || DEFAULT_USER_NAME;
}

function readStoredAppTheme(value: string | null): AppTheme {
  return value === "mewtwo" ? "mewtwo" : DEFAULT_APP_THEME;
}

export function PreferencesProvider({ children }: PropsWithChildren) {
  const [userName, setUserNameState] = useState(DEFAULT_USER_NAME);
  const [appTheme, setAppThemeState] = useState<AppTheme>(DEFAULT_APP_THEME);
  const [isHydrated, setIsHydrated] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const hydrate = async () => {
      const results = await Promise.allSettled([
        AsyncStorage.getItem(PREFERENCES_STORAGE_KEYS.userName),
        AsyncStorage.getItem(PREFERENCES_STORAGE_KEYS.appTheme),
      ]);

      if (!isMounted) return;

      const [storedName, storedTheme] = results;
      if (storedName.status === "fulfilled") {
        setUserNameState(readStoredUserName(storedName.value));
      }
      if (storedTheme.status === "fulfilled") {
        setAppThemeState(readStoredAppTheme(storedTheme.value));
      }

      const failedRead = results.find((result) => result.status === "rejected");
      setLoadError(
        failedRead?.status === "rejected"
          ? errorMessage(failedRead.reason, "Não foi possível carregar suas preferências.")
          : null,
      );
      setIsHydrated(true);
    };

    void hydrate();

    return () => {
      isMounted = false;
    };
  }, []);

  const setUserName = useCallback(async (nextUserName: string) => {
    const normalizedUserName = nextUserName.trim() || DEFAULT_USER_NAME;

    // Update first so a failed write never rolls back the user's draft.
    setUserNameState(normalizedUserName);
    setSaveError(null);

    try {
      await AsyncStorage.setItem(PREFERENCES_STORAGE_KEYS.userName, normalizedUserName);
    } catch (error) {
      setSaveError(errorMessage(error, "Não foi possível salvar o nome."));
      throw error;
    }
  }, []);

  const setAppTheme = useCallback(async (nextAppTheme: AppTheme) => {
    // Update first so a failed write never rolls back the user's draft.
    setAppThemeState(nextAppTheme);
    setSaveError(null);

    try {
      await AsyncStorage.setItem(PREFERENCES_STORAGE_KEYS.appTheme, nextAppTheme);
    } catch (error) {
      setSaveError(errorMessage(error, "Não foi possível salvar o tema."));
      throw error;
    }
  }, []);

  const value = useMemo<PreferencesContextValue>(
    () => ({
      userName,
      appTheme,
      setUserName,
      setAppTheme,
      isHydrated,
      loadError,
      saveError,
      error: saveError ?? loadError,
    }),
    [
      appTheme,
      isHydrated,
      loadError,
      saveError,
      setAppTheme,
      setUserName,
      userName,
    ],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): PreferencesContextValue {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error("usePreferences must be used within a PreferencesProvider");
  }
  return context;
}
