import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type PropsWithChildren,
} from "react";
import AsyncStorage from "@/lib/storage";
import { TrainerStore, type TrainerProfile } from "../../../../shared/trainer";

export type AppTheme = "gengar" | "mewtwo";
export type ThemeName = AppTheme;
export const DEFAULT_USER_NAME = "Treinador";
export const DEFAULT_APP_THEME: AppTheme = "gengar";
export const PREFERENCES_STORAGE_KEYS = {
  userName: "pokedex.preferences.userName",
  appTheme: "pokedex.preferences.appTheme",
} as const;

const trainerStore = new TrainerStore({
  // O perfil usa a mesma store do web; só trocamos o adaptador de storage.
  getItem: async (key) => {
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      throw new Error("Não foi possível carregar o perfil. Tente novamente.");
    }
  },
  setItem: async (key, value) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch {
      throw new Error(
        "Não foi possível salvar o perfil. Verifique o espaço do dispositivo e tente novamente.",
      );
    }
  },
});

export interface PreferencesContextValue {
  userName: string;
  appTheme: AppTheme;
  setUserName: (name: string) => Promise<void>;
  setAppTheme: (theme: AppTheme) => Promise<void>;
  isHydrated: boolean;
  loadError: string | null;
  saveError: string | null;
  error: string | null;
  trainerProfile: TrainerProfile;
  trainerReady: boolean;
  trainerBusy: boolean;
  saveTrainerProfile: (profile: TrainerProfile) => Promise<boolean>;
  reloadTrainer: () => Promise<void>;
}
export const PreferencesContext = createContext<
  PreferencesContextValue | undefined
>(undefined);

export function PreferencesProvider({ children }: PropsWithChildren) {
  const trainer = useSyncExternalStore(
    trainerStore.subscribe,
    trainerStore.getSnapshot,
    trainerStore.getSnapshot,
  );
  const [appTheme, setTheme] = useState<AppTheme>(DEFAULT_APP_THEME);
  const [isHydrated, setHydrated] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const savingTheme = useRef(false);
  useEffect(() => {
    let mounted = true;
    // Tema e perfil carregam juntos, mas uma falha não esconde o resultado do outro.
    void Promise.allSettled([
      AsyncStorage.getItem(PREFERENCES_STORAGE_KEYS.appTheme),
      trainerStore.hydrate(),
    ]).then(([theme]) => {
      if (!mounted) return;
      if (theme.status === "fulfilled")
        setTheme(theme.value === "mewtwo" ? "mewtwo" : "gengar");
      else setLoadError("Não foi possível carregar o tema salvo.");
      setHydrated(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const setAppTheme = useCallback(async (next: AppTheme) => {
    // Persisto antes de aplicar: se falhar, a UI não finge q salvou o tema.
    if (savingTheme.current) return;
    savingTheme.current = true;
    setSaveError(null);
    try {
      await AsyncStorage.setItem(PREFERENCES_STORAGE_KEYS.appTheme, next);
      setTheme(next);
      setLoadError(null);
    } catch {
      const message = "Não foi possível salvar o tema. Tente novamente.";
      setSaveError(message);
      throw new Error(message);
    } finally {
      savingTheme.current = false;
    }
  }, []);

  const setUserName = useCallback(async (name: string) => {
    // Compatibilidade com telas antigas: nome agora mora no perfil versionado.
    const result = await trainerStore.save({
      ...trainerStore.getSnapshot().profile,
      name: name.trim() || DEFAULT_USER_NAME,
    });
    if (!result)
      throw new Error(
        trainerStore.getSnapshot().error ?? "Não foi possível salvar o nome.",
      );
  }, []);

  const value = useMemo<PreferencesContextValue>(
    () => ({
      userName: trainer.profile.name,
      appTheme,
      setUserName,
      setAppTheme,
      isHydrated,
      loadError: loadError ?? (!trainer.ready ? trainer.error : null),
      saveError: saveError ?? (trainer.ready ? trainer.error : null),
      error: trainer.error ?? saveError ?? loadError,
      trainerProfile: trainer.profile,
      trainerReady: trainer.ready,
      trainerBusy: trainer.busy,
      saveTrainerProfile: trainerStore.save,
      reloadTrainer: trainerStore.hydrate,
    }),
    [
      trainer,
      appTheme,
      setUserName,
      setAppTheme,
      isHydrated,
      loadError,
      saveError,
    ],
  );
  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}
export function usePreferences(): PreferencesContextValue {
  const context = useContext(PreferencesContext);
  if (!context)
    throw new Error("usePreferences must be used within a PreferencesProvider");
  return context;
}
