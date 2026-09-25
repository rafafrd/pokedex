import { useEffect, useSyncExternalStore } from "react";
import { TrainerStore, TRAINER_STORAGE_KEY } from "../../../shared/trainer";

const store = new TrainerStore({
  // Mesmo contrato do mobile, mas aqui a gravação é no navegador.
  getItem: async (key) => {
    try {
      return localStorage.getItem(key);
    } catch {
      throw new Error(
        "O navegador não permitiu carregar seu perfil. Libere o armazenamento e tente novamente.",
      );
    }
  },
  setItem: async (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      throw new Error(
        "Não foi possível salvar o perfil. Libere espaço e tente novamente.",
      );
    }
  },
});
export function useTrainer() {
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot);
  useEffect(() => {
    void store.hydrate();
    const sync = (event: StorageEvent) => {
      // Perfil alterado em outra aba entra aqui sem recarregar a página inteira.
      if (event.key === TRAINER_STORAGE_KEY || event.key === null)
        void store.hydrate();
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  return { ...snapshot, saveProfile: store.save, reload: store.hydrate };
}
