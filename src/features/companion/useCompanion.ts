import { useEffect, useState, useSyncExternalStore } from "react";
import {
  CompanionStore,
  COMPANION_STORAGE_KEY,
} from "../../../shared/companion";

const store = new CompanionStore({
  // Adaptador web: o domínio conhece só getItem/setItem, não o localStorage.
  getItem: async (key) => {
    try {
      return localStorage.getItem(key);
    } catch {
      throw new Error(
        "O navegador não permitiu carregar o progresso. Libere o armazenamento e tente novamente.",
      );
    }
  },
  setItem: async (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      throw new Error(
        "Não foi possível salvar no navegador. Libere espaço e tente a ação novamente.",
      );
    }
  },
  exclusive: async (work) => {
    // Se houver Web Locks, duas abas não gastam a mesma fruta ao mesmo tempo.
    if (navigator.locks)
      await navigator.locks.request(COMPANION_STORAGE_KEY, work);
    else await work();
  },
});

export function useCompanion() {
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot);
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    void store.hydrate();
    // O relógio atualiza contagens na tela; os atributos vêm de advanceCompanion.
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    const refresh = () => {
      setNow(Date.now());
      void store.hydrate();
    };
    const sync = (event: StorageEvent) => {
      // Outra aba salvou? Recarrego o save p/ esta aba refletir a mudança.
      if (event.key === COMPANION_STORAGE_KEY || event.key === null) refresh();
    };
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", sync);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return { ...snapshot, now, execute: store.execute, reload: store.hydrate };
}
